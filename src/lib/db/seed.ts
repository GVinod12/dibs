import type { Database } from "./types";
import initial from "../../../data/initial.json";

/**
 * The canonical starting state of the closet, committed as `data/initial.json`.
 *
 * - first local run copies it to `data/db.json`
 * - first prod run inserts it into Postgres
 * - `resetDb()` restores it
 *
 * After that, the live store (JSON file or Postgres) is the source of truth and
 * real pieces are managed through /admin. To change the closet name / intro or
 * pre-load pieces, edit `data/initial.json`.
 */
export function seedDatabase(): Database {
  return JSON.parse(JSON.stringify(initial)) as Database;
}
