import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const searches = sqliteTable("searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departureDate: text("departure_date"),
  returnDate: text("return_date"),
  travelers: integer("travelers").notNull().default(1),
  status: text("status").notNull().default("pending"), // pending | searching | done | error
  flightsData: text("flights_data"),       // JSON string
  accommodationsData: text("accommodations_data"), // JSON string
  attractionsData: text("attractions_data"), // JSON string
  summary: text("summary"),
  itineraryData: text("itinerary_data"),   // JSON: day-by-day itinerary + budget
  alertData: text("alert_data"),           // JSON: flight disruption alerts
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
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
});
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searches.$inferSelect;
