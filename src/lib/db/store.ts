import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database } from "./types";
import { seedDatabase } from "./seed";
import { normalizeDb } from "./normalize";

/**
 * The whole store is one small JSON document (closets / items / looks / offers).
 * Two backends, chosen by env:
 *
 *   - DATABASE_URL / POSTGRES_URL set  →  Postgres (Neon). One JSON row, guarded
 *     by an optimistic version column so concurrent "call dibs" writes from
 *     different serverless instances can't clobber each other. Use this in prod.
 *
 *   - neither set                      →  a JSON file at data/db.json. Zero
 *     setup, perfect for local dev.
 *
 * Everything above this file goes through the repository layer (lib/repo.ts),
 * so nothing else in the app knows or cares which backend is live.
 */

const PG_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const USE_PG = PG_URL.length > 0;

// ----------------------------------------------------------------------------
// shared
// ----------------------------------------------------------------------------

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

// ----------------------------------------------------------------------------
// file backend
// ----------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

type Cache = { db: Database | null; loading: Promise<Database> | null; writeChain: Promise<unknown> };
const globalForDb = globalThis as unknown as { __dibsDb?: Cache };
const cache: Cache =
  globalForDb.__dibsDb ?? (globalForDb.__dibsDb = { db: null, loading: null, writeChain: Promise.resolve() });

async function fileRead(): Promise<Database> {
  try {
    return normalizeDb(JSON.parse(await fs.readFile(DB_PATH, "utf8")) as Database);
  } catch {
    const fresh = seedDatabase();
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(fresh, null, 2), "utf8");
    return fresh;
  }
}

async function fileGetDb(): Promise<Database> {
  if (cache.db) return cache.db;
  if (!cache.loading) cache.loading = fileRead().then((db) => ((cache.db = db), db));
  return cache.loading;
}

async function fileMutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = cache.writeChain.then(async () => {
    const db = await fileGetDb();
    const result = await fn(db);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
    return result;
  });
  cache.writeChain = run.catch(() => undefined);
  return run;
}

async function fileReset(): Promise<void> {
  const fresh = seedDatabase();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(fresh, null, 2), "utf8");
  cache.db = fresh;
  cache.loading = Promise.resolve(fresh);
}

// ----------------------------------------------------------------------------
// postgres backend (Neon serverless)
// ----------------------------------------------------------------------------

type Row = { doc: Database; version: string };
let pgReady: Promise<void> | null = null;

async function pgSql() {
  const { neon } = await import("@neondatabase/serverless");
  return neon(PG_URL);
}

async function pgEnsureSchema(): Promise<void> {
  if (!pgReady) {
    pgReady = (async () => {
      const sql = await pgSql();
      await sql`
        CREATE TABLE IF NOT EXISTS dibs_store (
          id         text PRIMARY KEY,
          doc        jsonb NOT NULL,
          version    bigint NOT NULL DEFAULT 0,
          updated_at timestamptz NOT NULL DEFAULT now()
        )`;
    })().catch((e) => {
      pgReady = null;
      throw e;
    });
  }
  return pgReady;
}

async function pgLoadRow(): Promise<Row> {
  await pgEnsureSchema();
  const sql = await pgSql();
  const row = (rows: Row[], version: string | number): Row => ({
    doc: normalizeDb(rows[0].doc),
    version: String(version),
  });

  const rows = (await sql`SELECT doc, version FROM dibs_store WHERE id = 'main'`) as Row[];
  if (rows.length) return row(rows, rows[0].version);

  // first boot: seed. RETURNING tells us if our insert won the race.
  const seed = seedDatabase();
  const inserted = (await sql`
    INSERT INTO dibs_store (id, doc, version) VALUES ('main', ${JSON.stringify(seed)}::jsonb, 0)
    ON CONFLICT (id) DO NOTHING
    RETURNING doc, version`) as Row[];
  if (inserted.length) return row(inserted, inserted[0].version);

  // another instance seeded concurrently — read theirs
  const again = (await sql`SELECT doc, version FROM dibs_store WHERE id = 'main'`) as Row[];
  if (again.length) return row(again, again[0].version);

  // last resort (e.g. DB unreachable mid-build) — serve the seed, don't crash
  return { doc: normalizeDb(seed), version: "0" };
}

async function pgGetDb(): Promise<Database> {
  return (await pgLoadRow()).doc;
}

async function pgMutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const sql = await pgSql();
  let lastErr: unknown;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { doc, version } = await pgLoadRow();
    const draft = clone(doc);
    const result = await fn(draft);
    const updated = (await sql`
      UPDATE dibs_store
         SET doc = ${JSON.stringify(draft)}::jsonb, version = version + 1, updated_at = now()
       WHERE id = 'main' AND version = ${version}::bigint
       RETURNING version`) as unknown[];
    if (updated.length === 1) return result;
    lastErr = new Error("write conflict");
    await new Promise((r) => setTimeout(r, 40 * (attempt + 1)));
  }
  throw lastErr ?? new Error("dibs store: mutate failed");
}

async function pgReset(): Promise<void> {
  await pgEnsureSchema();
  const sql = await pgSql();
  const seed = seedDatabase();
  await sql`
    INSERT INTO dibs_store (id, doc, version) VALUES ('main', ${JSON.stringify(seed)}::jsonb, 0)
    ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc, version = dibs_store.version + 1, updated_at = now()`;
}

// ----------------------------------------------------------------------------
// public API
// ----------------------------------------------------------------------------

export async function getDb(): Promise<Database> {
  return USE_PG ? pgGetDb() : fileGetDb();
}

export async function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  return USE_PG ? pgMutate(fn) : fileMutate(fn);
}

export async function resetDb(): Promise<void> {
  return USE_PG ? pgReset() : fileReset();
}

export const STORE_BACKEND = USE_PG ? "postgres" : "file";
