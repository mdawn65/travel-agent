import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { searches, monitorAlerts } from "@shared/schema";
import type { InsertSearch, Search, MonitorAlert, InsertMonitorAlert } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import path from "path";

const sqlite = new Database(path.join(process.cwd(), "data.db"));
export const db = drizzle(sqlite);

// ─── Create / migrate tables ──────────────────────────────────────────────────
sqlite.exec(`
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

sqlite.exec(`
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

// Migrate older schemas
const migrations = [
  `ALTER TABLE searches ADD COLUMN itinerary_data TEXT`,
  `ALTER TABLE searches ADD COLUMN alert_data TEXT`,
  `ALTER TABLE searches ADD COLUMN is_watched INTEGER DEFAULT 0`,
];
for (const sql of migrations) {
  try { sqlite.exec(sql); } catch {}
}

// ─── Storage interface ────────────────────────────────────────────────────────
export interface IStorage {
  // Searches
  createSearch(data: InsertSearch): Search;
  getSearch(id: number): Search | undefined;
  updateSearch(id: number, data: Partial<Search>): Search | undefined;
  listSearches(): Search[];
  listWatchedSearches(): Search[];

  // Monitor alerts
  createAlert(data: InsertMonitorAlert): MonitorAlert;
  getAlerts(searchId: number, limit?: number): MonitorAlert[];
  getLatestAlert(searchId: number, signal: string): MonitorAlert | undefined;
  markAlertsRead(searchId: number): void;
  getUnreadAlertCount(searchId: number): number;
}

export class Storage implements IStorage {
  // ── Searches ────────────────────────────────────────────────────────────────
  createSearch(data: InsertSearch): Search {
    return db.insert(searches).values({ ...data, createdAt: new Date() }).returning().get();
  }

  getSearch(id: number): Search | undefined {
    return db.select().from(searches).where(eq(searches.id, id)).get();
  }

  updateSearch(id: number, data: Partial<Search>): Search | undefined {
    return db.update(searches).set(data).where(eq(searches.id, id)).returning().get();
  }

  listSearches(): Search[] {
    return db.select().from(searches).all();
  }

  listWatchedSearches(): Search[] {
    return db.select().from(searches).where(eq(searches.isWatched, true)).all();
  }

  // ── Monitor alerts ───────────────────────────────────────────────────────────
  createAlert(data: InsertMonitorAlert): MonitorAlert {
    return db.insert(monitorAlerts).values({ ...data, checkedAt: new Date() }).returning().get();
  }

  getAlerts(searchId: number, limit = 30): MonitorAlert[] {
    return db
      .select()
      .from(monitorAlerts)
      .where(eq(monitorAlerts.searchId, searchId))
      .orderBy(desc(monitorAlerts.checkedAt))
      .limit(limit)
      .all();
  }

  getLatestAlert(searchId: number, signal: string): MonitorAlert | undefined {
    return db
      .select()
      .from(monitorAlerts)
      .where(eq(monitorAlerts.searchId, searchId))
      .orderBy(desc(monitorAlerts.checkedAt))
      .limit(1)
      .get();
  }

  markAlertsRead(searchId: number): void {
    db.update(monitorAlerts)
      .set({ isRead: true })
      .where(eq(monitorAlerts.searchId, searchId))
      .run();
  }

  getUnreadAlertCount(searchId: number): number {
    const alerts = db
      .select()
      .from(monitorAlerts)
      .where(eq(monitorAlerts.searchId, searchId))
      .all();
    return alerts.filter(a => !a.isRead).length;
  }
}

export const storage = new Storage();
