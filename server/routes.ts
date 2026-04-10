import type { Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { insertSearchSchema } from "@shared/schema";
import OpenAI from "openai";

// ─── OpenAI client via platform proxy (injected by llm-api:website) ───────────
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
    max_output_tokens: 2500,
  } as any);

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
    `Search the web and trivago for hotels and accommodations in ${destination} ${dateCtx} for ${travelers} guest(s). ` +
    `Find real hotels with current availability and pricing from trivago and booking sites. ` +
    `Reply ONLY with a JSON object — no markdown, no explanation:\n` +
    `{"accommodations":[{"name":"","type":"Hotel","stars":4,"pricePerNight":0,"location":"","description":"","amenities":["Pool","Wi-Fi","Spa"],"rating":4.5,"reviewCount":1000,"bookingUrl":""}]}\n` +
    `Include exactly 4 options ranging from budget to luxury. Real hotel names in ${destination}. Prices in USD per night. bookingUrl should be a trivago or booking.com search URL for that hotel.`
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

// ─── NEW: Multi-step itinerary agent ─────────────────────────────────────────
async function generateItinerary(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  travelers: number,
  attractions: any[],
  flights: any[],
  accommodations: any[]
) {
  // Calculate trip duration
  let numDays = 5; // default
  if (departureDate && returnDate) {
    const dep = new Date(departureDate);
    const ret = new Date(returnDate);
    const diff = Math.round((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) numDays = Math.min(diff, 10);
  }

  const attractionNames = attractions.slice(0, 6).map((a: any) => a.name).join(", ");
  const cheapestFlight = flights.sort((a: any, b: any) => a.price - b.price)[0];
  const midHotel = accommodations[Math.floor(accommodations.length / 2)];

  const raw = await webSearch(
    `Create a detailed ${numDays}-day travel itinerary for a trip from ${origin} to ${destination}. ` +
    `Attractions available: ${attractionNames || "top local sights"}. ` +
    `Search the web for best local restaurants, neighborhoods, and hidden gems in ${destination} to enrich each day. ` +
    `Reply ONLY with a JSON object — no markdown, no explanation:\n` +
    `{"days":[{"day":1,"date":"","theme":"","morning":{"activity":"","location":"","tip":"","durationHours":2},"afternoon":{"activity":"","location":"","tip":"","durationHours":3},"evening":{"activity":"","location":"","tip":"","durationHours":2},"meals":{"breakfast":"","lunch":"","dinner":""},"travelTip":""}],` +
    `"budget":{"flightCostPerPerson":${cheapestFlight?.price || 0},"hotelCostPerNight":${midHotel?.pricePerNight || 0},"estimatedDailyFood":60,"estimatedDailyTransport":20,"estimatedAttractions":30,"numDays":${numDays},"numTravelers":${travelers},"totalEstimate":0,"currency":"USD"}}\n` +
    `Fill in ${numDays} days. Calculate totalEstimate as: (flightCostPerPerson*numTravelers*2) + (hotelCostPerNight*numDays*ceil(numTravelers/2)) + ((estimatedDailyFood+estimatedDailyTransport+estimatedAttractions)*numDays*numTravelers). Use real restaurant and area names from ${destination}.`
  );

  const parsed = extractJSON(raw);
  return parsed || { days: [], budget: {} };
}

// ─── NEW: Disruption monitoring agent ────────────────────────────────────────
async function checkFlightDisruptions(
  flights: any[],
  origin: string,
  destination: string,
  departureDate: string
) {
  if (!flights || flights.length === 0) return { alerts: [], checkedAt: new Date().toISOString() };

  const flightRefs = flights
    .slice(0, 3)
    .map((f: any) => `${f.airline} ${f.flightNumber}`)
    .join(", ");

  const dateCtx = departureDate ? `on ${departureDate}` : "soon";

  const raw = await webSearch(
    `Search the web for current flight status, delays, cancellations, or disruptions for flights from ${origin} to ${destination} ${dateCtx}. ` +
    `Flights to check: ${flightRefs}. ` +
    `Also check for any airport delays, weather disruptions, or strikes affecting ${origin} or ${destination} airports. ` +
    `Reply ONLY with a JSON object — no markdown, no explanation:\n` +
    `{"alerts":[{"type":"delay|cancellation|weather|strike|normal","severity":"low|medium|high","flight":"","message":"","recommendation":""}],"airportStatus":{"origin":"","destination":""},"checkedAt":"ISO date"}\n` +
    `If no disruptions found, return one alert with type "normal" and a positive message. checkedAt = current ISO timestamp.`
  );

  const parsed = extractJSON(raw);
  if (parsed) {
    parsed.checkedAt = parsed.checkedAt || new Date().toISOString();
    return parsed;
  }
  return { alerts: [{ type: "normal", severity: "low", message: "No disruptions detected for your route.", recommendation: "Check back closer to departure." }], checkedAt: new Date().toISOString() };
}

// ─── NEW: Travel style/vibe inference ───────────────────────────────────────
// Takes free-text: travel style keywords, vibe description, or bucket list hints.
// Uses Perplexity web search to find trending destinations that match.
async function inferDestinationFromStyle(styleInput: string): Promise<{
  destination: string;
  confidence: string;
  reasoning: string;
  suggestedStyle: string;
  topInterests: string[];
  alternatives: string[];
}> {
  const raw = await webSearch(
    `A traveler describes their travel style and interests as: "${styleInput}". ` +
    `Search the web for the best travel destinations in 2025-2026 that match this vibe, aesthetic, and interests. ` +
    `Consider trending destinations, hidden gems, and destinations popular with that travel style. ` +
    `Reply ONLY with a JSON object — no markdown, no explanation:\n` +
    `{"destination":"City, Country","confidence":"high|medium|low","reasoning":"2-3 sentences explaining why this destination perfectly matches their described style","suggestedStyle":"adventure|luxury|cultural|beach|foodie|urban","topInterests":["interest1","interest2","interest3"],"alternatives":["City2, Country2","City3, Country3"]}\n` +
    `Pick the single best matching real destination. Include 2 runner-up alternatives.`
  );

  const parsed = extractJSON(raw);
  return parsed || {
    destination: "",
    confidence: "low",
    reasoning: "Could not determine a destination from the description.",
    suggestedStyle: "cultural",
    topInterests: [],
    alternatives: [],
  };
}

// ─── Main orchestrator ────────────────────────────────────────────────────────
async function generateTravelPlan(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  travelers: number
) {
  // Step 1: Run core searches in parallel
  const [flights, accommodations, attractions, summaryData] = await Promise.all([
    searchFlights(origin, destination, departureDate, returnDate, travelers),
    searchAccommodations(destination, departureDate, returnDate, travelers),
    searchAttractions(destination),
    searchDestinationInfo(origin, destination),
  ]);

  // Step 2: Run agentic steps in parallel (itinerary + disruption check)
  const [itinerary, alertData] = await Promise.all([
    generateItinerary(origin, destination, departureDate, returnDate, travelers, attractions, flights, accommodations),
    checkFlightDisruptions(flights, origin, destination, departureDate),
  ]);

  return {
    flights: { flights },
    accommodations: { accommodations },
    attractions: { attractions },
    summaryData: {
      ...summaryData,
      poweredBy: "Perplexity Sonar (web-grounded)",
    },
    itinerary,
    alertData,
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
          const { flights, accommodations, attractions, summaryData, itinerary, alertData } = await generateTravelPlan(
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
            itineraryData: JSON.stringify(itinerary),
            alertData: JSON.stringify(alertData),
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

  // ─── Travel style/vibe inference ────────────────────────────────────────────
  // Accepts free-text style description — Perplexity searches web for matching destinations
  app.post("/api/infer-destination", async (req, res) => {
    try {
      const { styleInput } = req.body;
      if (!styleInput || typeof styleInput !== "string") {
        return res.status(400).json({ error: "styleInput is required" });
      }
      const result = await inferDestinationFromStyle(styleInput);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── NEW: Re-check flight disruptions for an existing search ─────────────
  app.post("/api/searches/:id/check-disruptions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = storage.getSearch(id);
      if (!search) return res.status(404).json({ error: "Not found" });

      let flights: any[] = [];
      try { flights = JSON.parse(search.flightsData || "{}").flights || []; } catch {}

      const alertData = await checkFlightDisruptions(
        flights,
        search.origin,
        search.destination,
        search.departureDate || ""
      );
      storage.updateSearch(id, { alertData: JSON.stringify(alertData) });
      res.json(alertData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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
