import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { searches, monitorAlerts } from "@shared/schema";
import type { InsertSearch, Search, MonitorAlert, InsertMonitorAlert } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import path from "path";

const client = createClient({
  url: `file:${path.join(process.cwd(), "data.db")}`,
});
export const db = drizzle(client);

// Create tables (sync via execute)
await client.execute(`
  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_date TEXT,
    return_date TEXT,
    travelers INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    flights_data TEXT,
    accommodations_data TEXT,
    attractions_data TEXT,
    summary TEXT,
    itinerary_data TEXT,
    alert_data TEXT,
    is_watched INTEGER DEFAULT 0,
    created_at INTEGER
  )
`);

await client.execute(`
  CREATE TABLE IF NOT EXISTS monitor_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_id INTEGER NOT NULL,
    signal TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    source TEXT,
    checked_at INTEGER,
    is_read INTEGER DEFAULT 0
  )
`);

await client.execute(`
  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL DEFAULT 'planning',
    preferences TEXT,
    source_url TEXT,
    trip_data TEXT,
    thought_steps TEXT,
    created_at INTEGER
  )
`);

await client.execute(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at INTEGER
  )
`);

// Migrate older schemas by attempting to run ALTER TABLE statements
const migrations = [
  `ALTER TABLE searches ADD COLUMN itinerary_data TEXT`,
  `ALTER TABLE searches ADD COLUMN alert_data TEXT`,
  `ALTER TABLE searches ADD COLUMN is_watched INTEGER DEFAULT 0`,
];
for (const sql of migrations) {
  try { await client.execute(sql); } catch {}
}

export interface IStorage {
  // Searches
  createSearch(data: InsertSearch): Promise<Search>;
  getSearch(id: number): Promise<Search | undefined>;
  updateSearch(id: number, data: Partial<Search>): Promise<Search | undefined>;
  listSearches(): Promise<Search[]>;
  listWatchedSearches(): Promise<Search[]>;

  // Monitor alerts
  createAlert(data: InsertMonitorAlert): Promise<MonitorAlert>;
  getAlerts(searchId: number, limit?: number): Promise<MonitorAlert[]>;
  getLatestAlert(searchId: number, signal: string): Promise<MonitorAlert | undefined>;
  markAlertsRead(searchId: number): Promise<void>;
  getUnreadAlertCount(searchId: number): Promise<number>;
}

export class Storage implements IStorage {
  // ── Searches ────────────────────────────────────────────────────────────────
  async createSearch(data: InsertSearch): Promise<Search> {
    const result = await db.insert(searches).values({ ...data, createdAt: new Date() }).returning();
    return result[0];
  }

  async getSearch(id: number): Promise<Search | undefined> {
    const result = await db.select().from(searches).where(eq(searches.id, id));
    return result[0];
  }

  async updateSearch(id: number, data: Partial<Search>): Promise<Search | undefined> {
    const result = await db.update(searches).set(data).where(eq(searches.id, id)).returning();
    return result[0];
  }

  async listSearches(): Promise<Search[]> {
    return await db.select().from(searches);
  }

  async listWatchedSearches(): Promise<Search[]> {
    return await db.select().from(searches).where(eq(searches.isWatched, true));
  }

  // ── Monitor alerts ───────────────────────────────────────────────────────────
  async createAlert(data: InsertMonitorAlert): Promise<MonitorAlert> {
    const result = await db.insert(monitorAlerts).values({ ...data, checkedAt: new Date() }).returning();
    return result[0];
  }

  async getAlerts(searchId: number, limit = 30): Promise<MonitorAlert[]> {
    return await db
      .select()
      .from(monitorAlerts)
      .where(eq(monitorAlerts.searchId, searchId))
      .orderBy(desc(monitorAlerts.checkedAt))
      .limit(limit);
  }

  async getLatestAlert(searchId: number, signal: string): Promise<MonitorAlert | undefined> {
    const result = await db
      .select()
      .from(monitorAlerts)
      .where(eq(monitorAlerts.searchId, searchId))
      .orderBy(desc(monitorAlerts.checkedAt))
      .limit(1);
    return result[0];
  }

  async markAlertsRead(searchId: number): Promise<void> {
    await db.update(monitorAlerts)
      .set({ isRead: true })
      .where(eq(monitorAlerts.searchId, searchId));
  }

  async getUnreadAlertCount(searchId: number): Promise<number> {
    const alerts = await db
      .select()
      .from(monitorAlerts)
      .where(eq(monitorAlerts.searchId, searchId));
    return alerts.filter(a => !a.isRead).length;
  }
}

export const storage = new Storage();
