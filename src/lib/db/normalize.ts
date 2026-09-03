import { nanoid } from "nanoid";
import type { Database, Item } from "./types";

/**
 * Bring a loaded database up to the current shape. Runs on every read, so old
 * rows (single `claimantName` instead of a `queue`) are upgraded transparently
 * and persisted on the next write. Safe to run repeatedly.
 */
export function normalizeDb(db: Database): Database {
  for (const item of db.items) normalizeItem(item);
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
