/**
 * Agentic Travel Orchestrator
 *
 * Multi-step planning pipeline using Perplexity Sonar:
 *   1. Parse user intent (natural language or URL)
 *   2. Research destination
 *   3. Search flights, hotels, attractions in parallel
 *   4. Generate day-by-day itinerary
 *   5. Stream thought trace to client
 */

import { sonarChat, sonarSearch, extractJSON, type SonarMessage } from "./perplexity";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TripPreferences {
  style: "relaxation" | "adventure" | "culture" | "foodie" | "";
  budget: "budget" | "mid-range" | "luxury" | "";
  pace: "slow" | "packed" | "";
}

export interface ThoughtStep {
  id: string;
  icon: string;
  label: string;
  detail?: string;
  status: "pending" | "active" | "done" | "error";
}

export interface ParsedIntent {
  type: "url" | "natural";
  destination?: string;
  origin?: string;
  departureDate?: string;
  returnDate?: string;
  travelers?: number;
  duration?: number;
  vibe?: string;
  url?: string;
  rawMessage: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: Array<{
    time: string;
    activity: string;
    type: "transport" | "sightseeing" | "food" | "hotel" | "free";
    cost?: number;
    tip?: string;
  }>;
}

export interface TripPlan {
  destination: string;
  origin: string;
  dates: { departure: string; return: string };
  travelers: number;
  summary: string;
  flights: any[];
  hotels: any[];
  attractions: any[];
  itinerary: ItineraryDay[];
  budget: { flights: number; hotels: number; activities: number; food: number; total: number };
  citations: string[];
}

// ─── URL Detection ─────────────────────────────────────────────────────────

const SOCIAL_URL_PATTERNS = [
  /instagram\.com\/(p|reel|stories)\//i,
  /threads\.net\/@?\w+\/post/i,
  /tiktok\.com\/@?\w+\/video/i,
  /youtube\.com\/watch/i,
  /youtu\.be\//i,
  /x\.com\/\w+\/status/i,
  /twitter\.com\/\w+\/status/i,
];

export function detectSocialURL(text: string): string | null {
  const urlMatch = text.match(/https?:\/\/[^\s)]+/i);
  if (!urlMatch) return null;
  const url = urlMatch[0];
  if (SOCIAL_URL_PATTERNS.some((p) => p.test(url))) {
    return url;
  }
  // Accept any URL—Perplexity can still analyze it
  if (url.includes("http")) return url;
  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Perplexity requires user/assistant messages to alternate strictly.
 * This function takes a raw history and produces a valid alternating sequence.
 * It also trims to the last few pairs to keep context manageable.
 */
function sanitizeHistory(history: SonarMessage[]): SonarMessage[] {
  // Filter to only user/assistant messages (no system)
  const filtered = history.filter((m) => m.role === "user" || m.role === "assistant");

  // Ensure alternation: walk through and only keep messages that alternate
  const result: SonarMessage[] = [];
  for (const msg of filtered) {
    const last = result[result.length - 1];
    if (!last || last.role !== msg.role) {
      result.push(msg);
    }
    // If same role as last, skip (merge would lose context)
  }

  // Must end with an assistant message (since we'll add user after)
  // If it ends with user, drop the last user msg
  if (result.length > 0 && result[result.length - 1].role === "user") {
    result.pop();
  }

  // Keep only the last 6 messages (3 pairs) to stay within context limits
  return result.slice(-6);
}

// ─── Step 1: Parse Intent ──────────────────────────────────────────────────

export async function parseIntent(
  message: string,
  preferences: TripPreferences,
  history: SonarMessage[]
): Promise<ParsedIntent> {
  const url = detectSocialURL(message);

  if (url) {
    return { type: "url", url, rawMessage: message };
  }

  const systemPrompt = `You are a travel intent parser. Given a user message, extract travel details.
Reply ONLY with a JSON object (no markdown, no explanation):
{
  "destination": "city or null",
  "origin": "city or null",
  "departureDate": "YYYY-MM-DD or null",
  "returnDate": "YYYY-MM-DD or null",
  "travelers": number or null,
  "duration": number_of_days or null,
  "vibe": "brief vibe description or null"
}

User preferences: style=${preferences.style || "any"}, budget=${preferences.budget || "any"}, pace=${preferences.pace || "any"}
Today's date: ${new Date().toISOString().split("T")[0]}`;

  // Perplexity requires alternating user/assistant messages.
  // Only include history pairs (user-assistant), then the current user message.
  const msgs: SonarMessage[] = [
    { role: "system", content: systemPrompt },
    ...sanitizeHistory(history),
    { role: "user", content: message },
  ];

  const result = await sonarChat(msgs);
  const parsed = extractJSON(result.content);

  return {
    type: "natural",
    destination: parsed?.destination || undefined,
    origin: parsed?.origin || undefined,
    departureDate: parsed?.departureDate || undefined,
    returnDate: parsed?.returnDate || undefined,
    travelers: parsed?.travelers || undefined,
    duration: parsed?.duration || undefined,
    vibe: parsed?.vibe || undefined,
    rawMessage: message,
  };
}

// ─── Step 2: Analyze Social Media URL ──────────────────────────────────────

export async function analyzeURL(url: string): Promise<{
  destination: string;
  vibe: string;
  activities: string[];
  season: string;
  details: string;
}> {
  const result = await sonarChat([
    {
      role: "system",
      content: `You are a travel content analyzer. Given a social media URL, search the web for information about this post/content and extract travel-related details.
Reply ONLY with a JSON object:
{
  "destination": "city, country",
  "vibe": "brief vibe (e.g. luxury beach, cultural backpacking)",
  "activities": ["activity1", "activity2", ...],
  "season": "best time to visit",
  "details": "2-3 sentence description of the travel content"
}`,
    },
    {
      role: "user",
      content: `Analyze this social media URL and extract travel inspiration details: ${url}`,
    },
  ]);

  const parsed = extractJSON(result.content);
  return {
    destination: parsed?.destination || "Unknown",
    vibe: parsed?.vibe || "",
    activities: parsed?.activities || [],
    season: parsed?.season || "",
    details: parsed?.details || result.content,
  };
}

// ─── Step 3: Research & Plan ───────────────────────────────────────────────

async function suggestDestination(vibe: string, preferences: TripPreferences): Promise<string> {
  const result = await sonarChat([
    {
      role: "system",
      content: `You are a travel expert. Suggest ONE perfect destination.
Reply ONLY with a JSON: {"destination": "City, Country", "reason": "one sentence why"}`,
    },
    {
      role: "user",
      content: `Suggest a destination for: ${vibe || "a great trip"}.
Style: ${preferences.style || "any"}, Budget: ${preferences.budget || "mid-range"}, Pace: ${preferences.pace || "balanced"}`,
    },
  ]);
  const parsed = extractJSON(result.content);
  return parsed?.destination || "Paris, France";
}

async function searchFlights(origin: string, destination: string, depDate: string, retDate: string, travelers: number) {
  const result = await sonarChat([
    {
      role: "user",
      content: `Search the web for current flight options from ${origin} to ${destination} departing ${depDate}${retDate ? `, returning ${retDate}` : ""} for ${travelers} traveler(s).
Find real airlines and realistic prices.
Reply ONLY with JSON:
{"flights":[{"airline":"","flightNumber":"","departure":"HH:MM","arrival":"HH:MM","duration":"Xh Ym","stops":0,"stopCity":null,"price":0,"class":"Economy","amenities":["Wi-Fi"]}]}
Include exactly 3 flight options. Prices in USD per person.`,
    },
  ]);
  const parsed = extractJSON(result.content);
  return { flights: parsed?.flights || [], citations: result.citations };
}

async function searchHotels(destination: string, depDate: string, retDate: string, travelers: number, preferences: TripPreferences) {
  const budgetHint = preferences.budget === "luxury" ? "luxury 5-star" : preferences.budget === "budget" ? "budget-friendly" : "mid-range";
  const result = await sonarChat([
    {
      role: "user",
      content: `Search the web for ${budgetHint} hotels in ${destination}${depDate ? ` check-in ${depDate}` : ""}${retDate ? `, check-out ${retDate}` : ""} for ${travelers} guest(s).
Reply ONLY with JSON:
{"hotels":[{"name":"","type":"Hotel","stars":4,"pricePerNight":0,"location":"","description":"","amenities":["Pool","Wi-Fi"],"rating":4.5,"reviewCount":1000}]}
Include exactly 4 options. Real hotel names. Prices in USD per night.`,
    },
  ]);
  const parsed = extractJSON(result.content);
  return { hotels: parsed?.hotels || [], citations: result.citations };
}

async function searchAttractions(destination: string, preferences: TripPreferences) {
  const styleHint = preferences.style === "foodie" ? "food and dining experiences" : preferences.style === "adventure" ? "adventure activities" : preferences.style === "culture" ? "cultural and historical sites" : "top tourist attractions";
  const result = await sonarChat([
    {
      role: "user",
      content: `Search the web for ${styleHint} in ${destination}.
Reply ONLY with JSON:
{"attractions":[{"name":"","type":"Landmark","description":"","duration":"2-3 hours","price":0,"rating":4.5,"bestTime":"Morning","tips":"","address":""}]}
Types: Landmark, Museum, Nature, Food & Drink, Shopping, Entertainment, Cultural.
Include exactly 6 attractions. Prices in USD (0 if free). Real places.`,
    },
  ]);
  const parsed = extractJSON(result.content);
  return { attractions: parsed?.attractions || [], citations: result.citations };
}

// ─── Step 4: Generate Itinerary ────────────────────────────────────────────

async function generateItinerary(
  destination: string,
  duration: number,
  attractions: any[],
  preferences: TripPreferences
): Promise<ItineraryDay[]> {
  const attractionNames = attractions.map((a: any) => a.name).join(", ");
  const result = await sonarChat(
    [
      {
        role: "user",
        content: `Create a ${duration}-day itinerary for ${destination}.
Available attractions: ${attractionNames}.
Travel style: ${preferences.style || "balanced"}, pace: ${preferences.pace || "moderate"}.

Reply ONLY with JSON:
{"itinerary":[{"day":1,"title":"Day Title","activities":[{"time":"09:00","activity":"Activity name","type":"sightseeing","cost":0,"tip":"optional tip"}]}]}

Types: transport, sightseeing, food, hotel, free
Include breakfast, lunch, dinner suggestions. Make it realistic and enjoyable.
Each day should have 5-7 activities. Prices in USD.`,
      },
    ],
    { maxTokens: 6000 }
  );
  const parsed = extractJSON(result.content);
  return parsed?.itinerary || [];
}

// ─── Step 5: Budget Estimation ─────────────────────────────────────────────

function estimateBudget(flights: any[], hotels: any[], itinerary: ItineraryDay[], travelers: number, nights: number) {
  const cheapestFlight = flights.length > 0 ? Math.min(...flights.map((f: any) => f.price || 0)) * travelers : 0;
  const avgHotelPerNight = hotels.length > 0 ? hotels.reduce((sum: number, h: any) => sum + (h.pricePerNight || 0), 0) / hotels.length : 0;
  const hotelTotal = avgHotelPerNight * nights;
  const activityCost = itinerary.reduce(
    (sum, day) => sum + day.activities.reduce((dSum, a) => dSum + (a.cost || 0), 0),
    0
  ) * travelers;
  const foodEstimate = 50 * nights * travelers; // rough estimate

  return {
    flights: cheapestFlight,
    hotels: Math.round(hotelTotal),
    activities: Math.round(activityCost),
    food: foodEstimate,
    total: Math.round(cheapestFlight + hotelTotal + activityCost + foodEstimate),
  };
}

// ─── Main Orchestrator ─────────────────────────────────────────────────────

export type StepCallback = (step: ThoughtStep) => void;

export async function planTrip(
  intent: ParsedIntent,
  preferences: TripPreferences,
  onStep: StepCallback
): Promise<TripPlan> {
  const allCitations: string[] = [];
  let destination = intent.destination || "";
  let origin = intent.origin || "your city";
  const travelers = intent.travelers || 1;
  let duration = intent.duration || 5;

  // Calculate dates
  const today = new Date();
  const depDate = intent.departureDate || new Date(today.getTime() + 30 * 86400000).toISOString().split("T")[0];
  const retDate =
    intent.returnDate ||
    new Date(new Date(depDate).getTime() + duration * 86400000).toISOString().split("T")[0];
  const nights = Math.max(1, Math.round((new Date(retDate).getTime() - new Date(depDate).getTime()) / 86400000));
  duration = nights;

  // ── Step: Analyze URL (if applicable) ──
  if (intent.type === "url" && intent.url) {
    onStep({ id: "url", icon: "🔗", label: "Analyzing your link...", status: "active" });
    try {
      const analysis = await analyzeURL(intent.url);
      destination = analysis.destination;
      onStep({
        id: "url",
        icon: "🔗",
        label: `Found: ${analysis.destination}`,
        detail: analysis.details,
        status: "done",
      });
    } catch (err: any) {
      onStep({ id: "url", icon: "🔗", label: "Couldn't analyze link, continuing...", status: "error" });
    }
  }

  // ── Step: Pick destination (if not specified) ──
  if (!destination) {
    onStep({ id: "dest", icon: "🌍", label: "Choosing the perfect destination...", status: "active" });
    destination = await suggestDestination(intent.vibe || intent.rawMessage, preferences);
    onStep({ id: "dest", icon: "🌍", label: `Selected: ${destination}`, status: "done" });
  } else {
    onStep({ id: "dest", icon: "🌍", label: `Destination: ${destination}`, status: "done" });
  }

  // ── Step: Parallel searches ──
  onStep({ id: "flights", icon: "✈️", label: `Searching flights from ${origin}...`, status: "active" });
  onStep({ id: "hotels", icon: "🏨", label: `Finding hotels in ${destination}...`, status: "active" });
  onStep({ id: "attractions", icon: "📍", label: `Discovering things to do...`, status: "active" });

  const [flightResult, hotelResult, attractionResult] = await Promise.all([
    searchFlights(origin, destination, depDate, retDate, travelers).catch(() => ({ flights: [], citations: [] })),
    searchHotels(destination, depDate, retDate, travelers, preferences).catch(() => ({ hotels: [], citations: [] })),
    searchAttractions(destination, preferences).catch(() => ({ attractions: [], citations: [] })),
  ]);

  allCitations.push(...flightResult.citations, ...hotelResult.citations, ...attractionResult.citations);

  onStep({
    id: "flights",
    icon: "✈️",
    label: `Found ${flightResult.flights.length} flight options`,
    status: "done",
  });
  onStep({
    id: "hotels",
    icon: "🏨",
    label: `Found ${hotelResult.hotels.length} hotels`,
    status: "done",
  });
  onStep({
    id: "attractions",
    icon: "📍",
    label: `Found ${attractionResult.attractions.length} attractions`,
    status: "done",
  });

  // ── Step: Generate itinerary ──
  onStep({ id: "itinerary", icon: "📋", label: "Building your day-by-day itinerary...", status: "active" });

  const itinerary = await generateItinerary(destination, duration, attractionResult.attractions, preferences).catch(() => []);

  onStep({
    id: "itinerary",
    icon: "📋",
    label: `Created ${itinerary.length}-day itinerary`,
    status: "done",
  });

  // ── Step: Budget ──
  const budget = estimateBudget(flightResult.flights, hotelResult.hotels, itinerary, travelers, nights);
  onStep({
    id: "budget",
    icon: "💰",
    label: `Estimated total: $${budget.total.toLocaleString()}`,
    status: "done",
  });

  // ── Step: Summary ──
  onStep({ id: "summary", icon: "✨", label: "Finalizing your trip plan...", status: "active" });

  const summaryResult = await sonarSearch(
    `Give a 2-3 sentence travel summary for a trip to ${destination}. Include best season, currency, language, and one unique tip.`
  );
  allCitations.push(...summaryResult.citations);

  onStep({ id: "summary", icon: "✨", label: "Your trip is ready!", status: "done" });

  return {
    destination,
    origin,
    dates: { departure: depDate, return: retDate },
    travelers,
    summary: summaryResult.answer,
    flights: flightResult.flights,
    hotels: hotelResult.hotels,
    attractions: attractionResult.attractions,
    itinerary,
    budget,
    citations: [...new Set(allCitations)],
  };
}

// ─── Conversational Response (for non-planning messages) ───────────────────

export async function chatResponse(
  message: string,
  history: SonarMessage[],
  tripContext?: TripPlan
): Promise<string> {
  const systemPrompt = `You are Voyagr, an enthusiastic and knowledgeable AI travel agent. You help users plan incredible trips.

Key traits:
- You're proactive: suggest ideas, don't just answer questions
- You use web search to give real, current information
- You're concise but helpful (2-3 paragraphs max)
- You encourage users to share Instagram/Threads links for inspiration
- When users seem ready to plan, guide them toward providing: destination (or link), dates, origin city, budget preference

${tripContext ? `Current trip context: ${tripContext.destination}, ${tripContext.dates.departure} to ${tripContext.dates.return}` : "No trip planned yet."}`;

  const msgs: SonarMessage[] = [
    { role: "system", content: systemPrompt },
    ...sanitizeHistory(history),
    { role: "user", content: message },
  ];

  const result = await sonarChat(msgs);
  return result.content;
}
