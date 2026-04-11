import type { Express, Request, Response } from "express";
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertSearchSchema } from "@shared/schema";
import {
  parseIntent,
  planTrip,
  chatResponse,
  detectSocialURL,
  type TripPreferences,
  type ThoughtStep,
  type TripPlan,
} from "./agent";
import { sonarChat, extractJSON } from "./perplexity";
import {
  checkFlightDisruptions,
  runMonitorForSearch,
  runMonitorForAllWatched,
  searchSocialPostsByVibe
} from "./monitor";

async function webSearch(prompt: string): Promise<string> {
  const result = await sonarChat([{ role: "user", content: prompt }]);
  return result.content;
}

// ─── Legacy search functions (keeping for backward compat on /classic) ───────
async function searchFlightsLegacy(origin: string, destination: string, departureDate: string, returnDate: string, travelers: number) {
  const raw = await webSearch(
    `Search the web for current flight options from ${origin} to ${destination} departing ${departureDate}${returnDate ? `, returning ${returnDate}` : ""} for ${travelers} traveler(s). Find real airlines and realistic prices. Reply ONLY with JSON: {"flights":[{"airline":"","flightNumber":"","departure":"HH:MM","arrival":"HH:MM","duration":"Xh Ym","stops":0,"stopCity":null,"price":0,"class":"Economy","amenities":["Wi-Fi","Meal included"]}]} Include exactly 3 options. Prices in USD per person.`
  );
  return extractJSON(raw)?.flights || [];
}

async function searchAccommodationsLegacy(destination: string, departureDate: string, returnDate: string, travelers: number) {
  const raw = await webSearch(
    `Search the web for hotels in ${destination}${departureDate && returnDate ? ` check-in ${departureDate}, check-out ${returnDate}` : ""} for ${travelers} guest(s). Reply ONLY with JSON: {"accommodations":[{"name":"","type":"Hotel","stars":4,"pricePerNight":0,"location":"","description":"","amenities":["Pool","Wi-Fi","Spa"],"rating":4.5,"reviewCount":1000}]} Include exactly 4 options. Prices in USD per night.`
  );
  return extractJSON(raw)?.accommodations || [];
}

async function searchAttractionsLegacy(destination: string) {
  const raw = await webSearch(
    `Search the web for top tourist attractions in ${destination}. Reply ONLY with JSON: {"attractions":[{"name":"","type":"Landmark","description":"","duration":"2-3 hours","price":0,"rating":4.5,"bestTime":"Morning","tips":"","address":""}]} Include exactly 6 attractions. Prices in USD.`
  );
  return extractJSON(raw)?.attractions || [];
}

async function generateTravelPlan(origin: string, destination: string, departureDate: string, returnDate: string, travelers: number) {
  const [flights, accommodations, attractions] = await Promise.all([
    searchFlightsLegacy(origin, destination, departureDate, returnDate, travelers),
    searchAccommodationsLegacy(destination, departureDate, returnDate, travelers),
    searchAttractionsLegacy(destination),
  ]);
  const summaryRaw = await webSearch(
    `Give a brief travel summary for a trip from ${origin} to ${destination}. Reply ONLY with JSON: {"summary":"","bestSeason":"","currency":"","language":"","timezone":"","tips":["","",""],"visaRequired":false,"visaInfo":""}`
  );
  const summaryData = extractJSON(summaryRaw) || {};

  return {
    flights: { flights },
    accommodations: { accommodations },
    attractions: { attractions },
    summaryData: { ...summaryData, poweredBy: "Perplexity Sonar" },
  };
}

// ─── Routes ────────────────────────────────────────────────────────────────
export function registerRoutes(httpServer: Server, app: Express) {
  // ═══════════════════════════════════════════════════════════════════════
  //  NEW: WebSocket-based Agentic Chat
  // ═══════════════════════════════════════════════════════════════════════
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/chat" });

  wss.on("connection", (ws: WebSocket) => {
    let history: Array<{ role: "user" | "assistant"; content: string }> = [];
    let currentTrip: TripPlan | null = null;

    ws.on("message", async (raw: Buffer) => {
      try {
        const data = JSON.parse(raw.toString());
        const userMessage: string = data.message || "";
        const preferences: TripPreferences = data.preferences || { style: "", budget: "", pace: "" };

        if (!userMessage.trim()) return;

        history.push({ role: "user", content: userMessage });

        // Detect if this is a planning request or casual chat
        const shouldPlan = await detectPlanningIntent(userMessage, history);

        // Pass history WITHOUT the latest user message (functions add it)
        const historyContext = history.slice(0, -1);

        if (shouldPlan) {
          // ── Agentic Planning Mode ──
          ws.send(JSON.stringify({ type: "thinking_start" }));

          // Parse intent
          const intent = await parseIntent(userMessage, preferences, historyContext as any);

          // Stream thought steps via WebSocket
          const tripPlan = await planTrip(intent, preferences, (step: ThoughtStep) => {
            ws.send(JSON.stringify({ type: "thought", step }));
          });

          currentTrip = tripPlan;

          // Send the completed trip
          ws.send(JSON.stringify({ type: "trip", trip: tripPlan }));
          ws.send(JSON.stringify({ type: "thinking_end" }));

          // Add a summary message to history
          const summaryMsg = `I've planned a ${tripPlan.itinerary.length}-day trip to ${tripPlan.destination}! ${tripPlan.summary}`;
          history.push({ role: "assistant", content: summaryMsg });
          ws.send(JSON.stringify({ type: "message", role: "assistant", content: summaryMsg }));
        } else {
          // ── Conversational Mode ──
          const response = await chatResponse(userMessage, historyContext as any, currentTrip || undefined);
          history.push({ role: "assistant", content: response });
          ws.send(JSON.stringify({ type: "message", role: "assistant", content: response }));
        }
      } catch (err: any) {
        console.error("Chat error:", err.message);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Something went wrong. Please try again!",
          })
        );
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  LEGACY & MONITORING ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/searches", async (req: Request, res: Response) => {
    try {
      const parsed = insertSearchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const search = await storage.createSearch(parsed.data);
      res.json(search);
      (async () => {
        try {
          await storage.updateSearch(search.id, { status: "searching" });
          const { flights, accommodations, attractions, summaryData } = await generateTravelPlan(
            search.origin, search.destination, search.departureDate || "", search.returnDate || "", search.travelers
          );
          await storage.updateSearch(search.id, {
            status: "done",
            flightsData: JSON.stringify(flights),
            accommodationsData: JSON.stringify(accommodations),
            attractionsData: JSON.stringify(attractions),
            summary: JSON.stringify(summaryData)
          });
        } catch (err: any) {
          console.error("Travel plan generation error:", err.message);
          await storage.updateSearch(search.id, { status: "error" });
        }
      })();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/searches/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const search = await storage.getSearch(id);
    if (!search) return res.status(404).json({ error: "Not found" });
    res.json(search);
  });

  app.get("/api/searches", async (req: Request, res: Response) => {
    const list = await storage.listSearches();
    res.json(list.reverse().slice(0, 10));
  });

  // ─── Social post search by travel vibe ──────────────────────────────────────
  app.post("/api/infer-destination", async (req, res) => {
    try {
      const { styleInput } = req.body;
      if (!styleInput || typeof styleInput !== "string") {
        return res.status(400).json({ error: "styleInput is required" });
      }
      const result = await searchSocialPostsByVibe(styleInput);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Re-check flight disruptions for an existing search ─────────────
  app.post("/api/searches/:id/check-disruptions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getSearch(id);
      if (!search) return res.status(404).json({ error: "Not found" });

      let flights: any[] = [];
      try { flights = JSON.parse(search.flightsData || "{}").flights || []; } catch {}

      const alertData = await checkFlightDisruptions(
        flights,
        search.origin,
        search.destination,
        search.departureDate || ""
      );
      await storage.updateSearch(id, { alertData: JSON.stringify(alertData) });
      res.json(alertData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Watch/unwatch a trip for daily monitoring ────────────────────────────
  app.post("/api/searches/:id/watch", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getSearch(id);
      if (!search) return res.status(404).json({ error: "Not found" });
      const { watch } = req.body;
      await storage.updateSearch(id, { isWatched: watch !== false });
      res.json({ isWatched: watch !== false });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Get alert history for a trip ────────────────────────────────────────
  app.get("/api/searches/:id/alerts", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string || "30");
      const alerts = await storage.getAlerts(id, limit);
      const unread = await storage.getUnreadAlertCount(id);
      res.json({ alerts, unread });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Mark alerts as read ──────────────────────────────────────────────────
  app.post("/api/searches/:id/alerts/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markAlertsRead(id);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── On-demand: run full monitor check now ────────────────────────────────
  app.post("/api/searches/:id/monitor-now", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getSearch(id);
      if (!search) return res.status(404).json({ error: "Not found" });
      res.json({ status: "running" }); // respond immediately
      runMonitorForSearch(id).catch(err => console.error("Monitor error:", err.message));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Cron endpoint: run all watched trips ────────────────────────────────
  app.post("/api/monitor/run-all", async (req, res) => {
    try {
      const results = await runMonitorForAllWatched();
      res.json({ checked: results.length, results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Health / config check
  app.get("/api/status", (req: Request, res: Response) => {
    res.json({
      ready: true,
      model: "sonar-pro",
      provider: "Perplexity Sonar API",
      features: ["chat", "url-analysis", "itinerary", "thought-trace", "monitoring"],
    });
  });
}

// ─── Helper: Detect if user wants to plan a trip ───────────────────────────
async function detectPlanningIntent(
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<boolean> {
  // Quick heuristic checks first
  const lower = message.toLowerCase();

  // URL → always plan
  if (detectSocialURL(message)) return true;

  // Obvious planning keywords
  const planKeywords = [
    "plan", "trip", "travel", "book", "fly", "flight", "hotel",
    "vacation", "holiday", "itinerary", "go to", "visit", "beach",
    "adventure", "backpack", "cruise", "destination", "surprise me",
    "weekend", "getaway",
  ];
  if (planKeywords.some((k) => lower.includes(k))) return true;

  // Location pattern (e.g., "tokyo in september")
  if (/\b(in|to|from)\s+[A-Z][a-z]+/i.test(message)) return true;

  // Budget pattern
  if (/\$\d+|\d+\s*(?:dollar|usd|budget)/i.test(message)) return true;

  return false;
}

