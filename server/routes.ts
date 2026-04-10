import type { Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { insertSearchSchema } from "@shared/schema";
import OpenAI from "openai";

// ─── OpenAI client via platform proxy (injected by llm-api:website) ───────────
// Falls back to direct Perplexity API if env vars present
function getClient(): OpenAI {
  const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const apiKey = process.env.OPENAI_API_KEY || process.env.PERPLEXITY_API_KEY || "";
  return new OpenAI({ apiKey, baseURL });
}

const MODEL = "gpt_5_1";

// ─── Core search function using web_search_preview ────────────────────────────
async function webSearch(prompt: string): Promise<string> {
  const client = getClient();
  const response = await client.responses.create({
    model: MODEL,
    input: prompt,
    tools: [{ type: "web_search_preview" } as any],
    max_output_tokens: 2000,
  } as any);

  // Extract text from output
  const output = (response as any).output_text || "";
  return output;
}

// ─── JSON extraction helper ───────────────────────────────────────────────────
function extractJSON(raw: string): any {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try { return JSON.parse(match[1]); } catch {}
    }
    return null;
  }
}

// ─── Individual search functions ──────────────────────────────────────────────

async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  travelers: number
) {
  const dateCtx = departureDate ? `departing ${departureDate}` : "with flexible dates";
  const returnCtx = returnDate ? `, returning ${returnDate}` : "";

  const raw = await webSearch(
    `Search the web for current flight options from ${origin} to ${destination} ${dateCtx}${returnCtx} for ${travelers} traveler(s). ` +
    `Find real airlines and realistic prices. ` +
    `Reply ONLY with a JSON object — no markdown, no explanation:\n` +
    `{"flights":[{"airline":"","flightNumber":"","departure":"HH:MM","arrival":"HH:MM","duration":"Xh Ym","stops":0,"stopCity":null,"price":0,"class":"Economy","amenities":["Wi-Fi","Meal included"]}]}\n` +
    `Include exactly 3 different flight options. prices in USD per person.`
  );

  const parsed = extractJSON(raw);
  return parsed?.flights || [];
}

async function searchAccommodations(
  destination: string,
  departureDate: string,
  returnDate: string,
  travelers: number
) {
  const dateCtx = departureDate && returnDate ? `check-in ${departureDate}, check-out ${returnDate}` : "";

  const raw = await webSearch(
    `Search the web for hotels and accommodations in ${destination} ${dateCtx} for ${travelers} guest(s). ` +
    `Find real hotels with current availability and pricing. ` +
    `Reply ONLY with a JSON object — no markdown, no explanation:\n` +
    `{"accommodations":[{"name":"","type":"Hotel","stars":4,"pricePerNight":0,"location":"","description":"","amenities":["Pool","Wi-Fi","Spa"],"rating":4.5,"reviewCount":1000}]}\n` +
    `Include exactly 4 options ranging from budget to luxury. Real hotel names in ${destination}. Prices in USD per night.`
  );

  const parsed = extractJSON(raw);
  return parsed?.accommodations || [];
}

async function searchAttractions(destination: string) {
  const raw = await webSearch(
    `Search the web for the top tourist attractions and activities in ${destination}. ` +
    `Find real, popular sights and current visitor details. ` +
    `Reply ONLY with a JSON object — no markdown, no explanation:\n` +
    `{"attractions":[{"name":"","type":"Landmark","description":"","duration":"2-3 hours","price":0,"rating":4.5,"bestTime":"Morning","tips":"","address":""}]}\n` +
    `Types: Landmark, Museum, Nature, Food & Drink, Shopping, Entertainment, Cultural. ` +
    `Include exactly 6 attractions. Price must be in USD (convert if needed, use 0 if free). Real places in ${destination}. Keep prices reasonable (Tokyo Skytree is ~$17 USD).`
  );

  const parsed = extractJSON(raw);
  return parsed?.attractions || [];
}

async function searchDestinationInfo(origin: string, destination: string) {
  const raw = await webSearch(
    `Search the web for practical travel information for a trip from ${origin} to ${destination}. ` +
    `Reply ONLY with a JSON object — no markdown, no explanation:\n` +
    `{"summary":"","bestSeason":"","currency":"","language":"","timezone":"","tips":["","",""],"visaRequired":false,"visaInfo":""}` +
    `\nMake the summary 2-3 sentences about what to expect. Include 3 practical travel tips.`
  );

  const parsed = extractJSON(raw);
  return parsed || {};
}

// ─── Main orchestrator ────────────────────────────────────────────────────────
async function generateTravelPlan(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  travelers: number
) {
  // Run all four searches in parallel for speed
  const [flights, accommodations, attractions, summaryData] = await Promise.all([
    searchFlights(origin, destination, departureDate, returnDate, travelers),
    searchAccommodations(destination, departureDate, returnDate, travelers),
    searchAttractions(destination),
    searchDestinationInfo(origin, destination),
  ]);

  return {
    flights: { flights },
    accommodations: { accommodations },
    attractions: { attractions },
    summaryData: {
      ...summaryData,
      poweredBy: "Perplexity Sonar (web-grounded)",
    },
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export function registerRoutes(httpServer: Server, app: Express) {
  // Create a new search
  app.post("/api/searches", async (req, res) => {
    try {
      const parsed = insertSearchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const search = storage.createSearch(parsed.data);
      res.json(search);

      // Kick off async generation
      (async () => {
        try {
          storage.updateSearch(search.id, { status: "searching" });
          const { flights, accommodations, attractions, summaryData } = await generateTravelPlan(
            search.origin,
            search.destination,
            search.departureDate || "",
            search.returnDate || "",
            search.travelers
          );
          storage.updateSearch(search.id, {
            status: "done",
            flightsData: JSON.stringify(flights),
            accommodationsData: JSON.stringify(accommodations),
            attractionsData: JSON.stringify(attractions),
            summary: JSON.stringify(summaryData),
          });
        } catch (err: any) {
          console.error("Travel plan generation error:", err.message);
          storage.updateSearch(search.id, { status: "error" });
        }
      })();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get a search by ID (polling endpoint)
  app.get("/api/searches/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const search = storage.getSearch(id);
    if (!search) return res.status(404).json({ error: "Not found" });
    res.json(search);
  });

  // List recent searches
  app.get("/api/searches", (req, res) => {
    const list = storage.listSearches();
    res.json(list.reverse().slice(0, 10));
  });

  // Health / config check
  app.get("/api/status", (req, res) => {
    res.json({
      ready: true,
      model: MODEL,
      provider: "Perplexity (via web_search_preview)",
      baseURL: process.env.OPENAI_BASE_URL || "default",
    });
  });
}
