import { storage } from "./storage";
import { sonarChat, extractJSON } from "./perplexity";

export interface MonitorResult {
  signal: "weather" | "flight" | "news";
  severity: "ok" | "warning" | "critical";
  title: string;
  body: string;
  source?: string;
}

async function webSearch(prompt: string): Promise<string> {
  const result = await sonarChat([{ role: "user", content: prompt }]);
  return result.content;
}

export async function checkFlightDisruptions(
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
    `Reply ONLY with a JSON object:\n` +
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

async function checkWeather(destination: string, departureDate: string): Promise<MonitorResult> {
  const dateCtx = departureDate ? `around ${departureDate}` : "in the coming weeks";
  try {
    const raw = await webSearch(
      `Search the web for current and forecast weather conditions in ${destination} ${dateCtx}. ` +
      `Look for extreme weather alerts, typhoons, monsoons, heatwaves, winter storms, or travel advisories. ` +
      `Reply ONLY with a JSON object:\n` +
      `{"severity":"ok|warning|critical","title":"short headline","body":"2-3 sentences about weather conditions","source":"URL or source name"}\n` +
      `severity=ok if conditions are normal, warning if notable but manageable, critical if dangerous or travel-disrupting.`
    );
    const parsed = extractJSON(raw);
    if (parsed) return { signal: "weather", ...parsed };
  } catch {}
  return { signal: "weather", severity: "ok", title: `Weather in ${destination}`, body: "No unusual weather alerts found.", source: "" };
}

async function checkFlightStatus(origin: string, destination: string, departureDate: string, flightRefs: string): Promise<MonitorResult> {
  const dateCtx = departureDate ? `on or around ${departureDate}` : "soon";
  try {
    const raw = await webSearch(
      `Search the web for flight status, delays, cancellations, or route disruptions between ${origin} and ${destination} ${dateCtx}. ` +
      `${flightRefs ? `Flights to check: ${flightRefs}.` : ""} ` +
      `Check for airline strikes, airport closures, air traffic control issues, or route suspensions. ` +
      `Reply ONLY with a JSON object:\n` +
      `{"severity":"ok|warning|critical","title":"short headline","body":"2-3 sentences about flight/route status","source":"URL or source name"}\n` +
      `severity=ok if no issues, warning if delays possible, critical if route suspended or major disruption.`
    );
    const parsed = extractJSON(raw);
    if (parsed) return { signal: "flight", ...parsed };
  } catch {}
  return { signal: "flight", severity: "ok", title: `${origin} → ${destination} route`, body: "No flight disruptions detected for your route.", source: "" };
}

async function checkDestinationNews(destination: string): Promise<MonitorResult> {
  try {
    const raw = await webSearch(
      `Search the web for the latest news, travel advisories, safety alerts, visa changes, entry requirement changes, ` +
      `political unrest, health alerts (disease outbreaks), or natural disasters in ${destination} in the last 7 days. ` +
      `Reply ONLY with a JSON object:\n` +
      `{"severity":"ok|warning|critical","title":"short headline","body":"2-3 sentences about what travelers should know","source":"URL or source name"}\n` +
      `severity=ok if destination is safe and normal, warning if travelers should be aware, critical if advisories recommend against travel.`
    );
    const parsed = extractJSON(raw);
    if (parsed) return { signal: "news", ...parsed };
  } catch {}
  return { signal: "news", severity: "ok", title: `${destination} travel news`, body: "No travel advisories or unusual news for this destination.", source: "" };
}

export async function runMonitorForSearch(searchId: number): Promise<MonitorResult[]> {
  const search = await storage.getSearch(searchId);
  if (!search) throw new Error(`Search ${searchId} not found`);

  let flightRefs = "";
  try {
    const flights = JSON.parse(search.flightsData || "{}").flights || [];
    flightRefs = flights.slice(0, 2).map((f: any) => `${f.airline} ${f.flightNumber}`).join(", ");
  } catch {}

  const [weather, flight, news] = await Promise.all([
    checkWeather(search.destination, search.departureDate || ""),
    checkFlightStatus(search.origin, search.destination, search.departureDate || "", flightRefs),
    checkDestinationNews(search.destination),
  ]);

  const results = [weather, flight, news];

  for (const r of results) {
    await storage.createAlert({
      searchId,
      signal: r.signal,
      severity: r.severity,
      title: r.title,
      body: r.body,
      source: r.source || "",
    });
  }

  return results;
}

export async function runMonitorForAllWatched(): Promise<{ searchId: number; results: MonitorResult[] }[]> {
  const watched = await storage.listWatchedSearches();
  const allResults = [];
  for (const search of watched) {
    try {
      const results = await runMonitorForSearch(search.id);
      allResults.push({ searchId: search.id, results });
    } catch (err: any) {
      console.error(`Monitor failed for search ${search.id}:`, err.message);
    }
  }
  return allResults;
}

// ─── Social post search by travel vibe ──────────────────────────────────────
export async function searchSocialPostsByVibe(styleInput: string): Promise<{
  posts: Array<{
    platform: string;
    url: string;
    caption: string;
    location: string;
    destination: string;
    imageContext: string;
    author: string;
    likes?: string;
  }>;
  destination: string;
  alternatives: string[];
  reasoning: string;
}> {
  const [instagramRaw, xRaw] = await Promise.all([
    webSearch(
      `Search Instagram and travel blogs for posts about "${styleInput}" travel style. ` +
      `Find real, publicly visible Instagram posts, travel blog posts, or travel content that matches this vibe. ` +
      `Look for posts with real location tags, captions, and destination names. ` +
      `Reply ONLY with a JSON array:\n` +
      `[{"platform":"Instagram","url":"https://www.instagram.com/p/...","caption":"post caption text","location":"City, Country","destination":"City, Country","imageContext":"describe what the image/reel shows","author":"@username","likes":"12.3k"}]\n` +
      `Return up to 4 real posts.`
    ),
    webSearch(
      `Search X (Twitter) and TikTok for posts about "${styleInput}" travel. ` +
      `Find real travel posts, threads, or videos matching this travel style and vibe. ` +
      `Reply ONLY with a JSON array:\n` +
      `[{"platform":"X","url":"https://x.com/...","caption":"tweet or post text","location":"City, Country","destination":"City, Country","imageContext":"describe what the post shows","author":"@username","likes":""}]\n` +
      `Return up to 3 real posts.`
    ),
  ]);

  const destRaw = await webSearch(
    `Based on the travel style "${styleInput}", what is the single best matching destination trending in 2025-2026? ` +
    `Reply ONLY with a JSON object:\n` +
    `{"destination":"City, Country","alternatives":["City2, Country2","City3, Country3"],"reasoning":"2 sentences why this is perfect for this travel style"}`
  );

  let posts: any[] = [];
  try {
    const ig = extractJSON(instagramRaw);
    if (Array.isArray(ig)) posts = [...posts, ...ig];
  } catch {}
  try {
    const x = extractJSON(xRaw);
    if (Array.isArray(x)) posts = [...posts, ...x];
  } catch {}

  posts = posts.filter(p =>
    p.url && p.url.startsWith("http") &&
    !p.url.includes("example.com") &&
    p.caption && p.caption.length > 5
  );

  const destParsed = extractJSON(destRaw);

  return {
    posts: posts.slice(0, 6),
    destination: destParsed?.destination || "",
    alternatives: destParsed?.alternatives || [],
    reasoning: destParsed?.reasoning || "",
  };
}
