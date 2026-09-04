import { nanoid } from "nanoid";
import type { Database, Item } from "./types";
import { uniqueSlug } from "../slug";

/**
 * Bring a loaded database up to the current shape. Runs on every read, so old
 * rows are upgraded transparently and persisted on the next write. Safe to run
 * repeatedly.
 */
export function normalizeDb(db: Database): Database {
  for (const item of db.items) normalizeItem(item);
  repairSlugs(db.items, (i) => i.name);
  repairSlugs(db.looks, (l) => l.title);
  return db;
}

function normalizeItem(item: Item): void {
  if (!Array.isArray(item.queue)) {
    item.queue = [];
    if (item.claimantName) {
      item.queue.push({
        id: `clm_${nanoid(10)}`,
        name: item.claimantName,
        contact: "",
        note: item.claimantNote ?? null,
        amountCents: null,
        source: "dibs",
        at: item.claimedAt ?? new Date().toISOString(),
      });
    }
  }
  delete item.claimantName;
  delete item.claimantNote;
  delete item.claimedAt;

  // keep status coherent with the queue (finalised states are left alone)
  if (item.status === "AVAILABLE" && item.queue.length > 0) item.status = "DIBSED";
  if (item.status === "DIBSED" && item.queue.length === 0) item.status = "AVAILABLE";
  if (item.queue.length > 3) item.queue = item.queue.slice(0, 3);
}

/**
 * Self-heal URL slugs. A record whose slug went missing (an older edit could
 * blank it) or collides with another gets a fresh unique one derived from its
 * name — otherwise its page 404s.
 */
function repairSlugs<T extends { slug?: string | null }>(rows: T[], nameOf: (row: T) => string): void {
  const taken = new Set<string>();
  for (const row of rows) {
    const current = typeof row.slug === "string" ? row.slug.trim() : "";
    if (!current || current === "undefined" || current === "null" || taken.has(current)) {
      row.slug = uniqueSlug(nameOf(row), taken);
    }
    taken.add(row.slug as string);
  }
}
