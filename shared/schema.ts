import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Legacy: Simple searches ────────────────────────────────────────────────
export const searches = sqliteTable("searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departureDate: text("departure_date"),
  returnDate: text("return_date"),
  travelers: integer("travelers").notNull().default(1),
  status: text("status").notNull().default("pending"), // pending | searching | done | error
  flightsData: text("flights_data"),
  accommodationsData: text("accommodations_data"),
  attractionsData: text("attractions_data"),
  summary: text("summary"),
  itineraryData: text("itinerary_data"),
  alertData: text("alert_data"),          // latest one-off disruption check
  isWatched: integer("is_watched", { mode: "boolean" }).default(false), // monitoring active?
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Persistent alert history — one row per monitoring run per signal
export const monitorAlerts = sqliteTable("monitor_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  searchId: integer("search_id").notNull(),
  signal: text("signal").notNull(),      // "weather" | "flight" | "news"
  severity: text("severity").notNull(),  // "ok" | "warning" | "critical"
  title: text("title").notNull(),
  body: text("body").notNull(),
  source: text("source"),               // URL or source name
  checkedAt: integer("checked_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
});

export const insertSearchSchema = createInsertSchema(searches).omit({
  id: true,
  createdAt: true,
  status: true,
  flightsData: true,
  accommodationsData: true,
  attractionsData: true,
  summary: true,
  itineraryData: true,
  alertData: true,
  isWatched: true,
});

export const insertMonitorAlertSchema = createInsertSchema(monitorAlerts).omit({
  id: true,
  checkedAt: true,
  isRead: true,
});

export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searches.$inferSelect;
export type MonitorAlert = typeof monitorAlerts.$inferSelect;
export type InsertMonitorAlert = z.infer<typeof insertMonitorAlertSchema>;

// ─── New: Agentic trips ─────────────────────────────────────────────────────
export const trips = sqliteTable("trips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  status: text("status").notNull().default("planning"), // planning | done | error
  preferences: text("preferences"), // JSON: { style, budget, pace }
  sourceUrl: text("source_url"), // Instagram / Threads URL if applicable
  tripData: text("trip_data"), // JSON: full TripPlan
  thoughtSteps: text("thought_steps"), // JSON: ThoughtStep[]
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id"),
  role: text("role").notNull(), // user | assistant | system | thought
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON: extra data (thought steps, trip card, etc.)
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
