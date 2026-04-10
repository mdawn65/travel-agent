import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { searches } from "@shared/schema";
import type { InsertSearch, Search } from "@shared/schema";
import { eq } from "drizzle-orm";
import path from "path";

const sqlite = new Database(path.join(process.cwd(), "data.db"));
export const db = drizzle(sqlite);

// Create table
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
    created_at INTEGER
  )
`);

export interface IStorage {
  createSearch(data: InsertSearch): Search;
  getSearch(id: number): Search | undefined;
  updateSearch(id: number, data: Partial<Search>): Search | undefined;
  listSearches(): Search[];
}

export class Storage implements IStorage {
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
}

export const storage = new Storage();
