import { nanoid } from "nanoid";
import { getDb, mutate } from "./db/store";
import type { Item, Look, Offer, Closet, DibsClaim } from "./db/types";
import { MAX_DIBS_QUEUE } from "./constants";
import type { Category, ItemStatus, ItemType, OfferStatus } from "./constants";

/**
 * The only module that touches the data store. Pages and server actions call
 * these functions; swapping the JSON store for a real database means
 * reimplementing this file and nothing else.
 */

// ---------- closet ----------

export async function getCloset(slug: string): Promise<Closet | null> {
  const db = await getDb();
  return db.closets.find((c) => c.slug === slug) ?? null;
}

export async function getPrimaryCloset(): Promise<Closet> {
  const db = await getDb();
  return db.closets[0];
}

export type ClosetStats = {
  pieces: number;
  available: number;
  looks: number;
  claimed: number;
  friends: number;
};

export async function getClosetStats(slug: string): Promise<ClosetStats> {
  const db = await getDb();
  const items = db.items.filter((i) => i.closetSlug === slug);
  const claimants = new Set<string>();
  for (const i of items) for (const c of i.queue) claimants.add(c.name.toLowerCase());
  for (const o of db.offers) claimants.add(o.name.toLowerCase());
  return {
    pieces: items.length,
    available: items.filter((i) => i.status === "AVAILABLE").length,
    looks: db.looks.filter((l) => l.closetSlug === slug).length,
    claimed: items.filter((i) => i.status !== "AVAILABLE").length,
    friends: claimants.size,
  };
}

// ---------- items ----------

export type ItemFilter = {
  type?: ItemType | "ALL";
  category?: Category | "ALL";
  status?: ItemStatus | "ALL";
  sort?: "curated" | "newest" | "price-asc" | "price-desc";
};

const STATUS_RANK: Record<ItemStatus, number> = { AVAILABLE: 0, DIBSED: 1, SOLD: 2, GIVEN: 3 };

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return base || `piece-${nanoid(6)}`;
}

export async function listItems(slug: string, filter: ItemFilter = {}): Promise<Item[]> {
  const db = await getDb();
  let items = db.items.filter((i) => i.closetSlug === slug);

  if (filter.type && filter.type !== "ALL") items = items.filter((i) => i.type === filter.type);
  if (filter.category && filter.category !== "ALL") items = items.filter((i) => i.category === filter.category);
  if (filter.status && filter.status !== "ALL") items = items.filter((i) => i.status === filter.status);

  const sort = filter.sort ?? "curated";
  items = [...items].sort((a, b) => {
    if (sort === "newest") return +new Date(b.createdAt) - +new Date(a.createdAt);
    if (sort === "price-asc") return (a.priceCents ?? 0) - (b.priceCents ?? 0);
    if (sort === "price-desc") return (b.priceCents ?? 0) - (a.priceCents ?? 0);
    // curated: available first, then owner's sortIndex
    const s = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    return s !== 0 ? s : a.sortIndex - b.sortIndex;
  });
  return items;
}

export async function getItemBySlug(closetSlug: string, itemSlug: string): Promise<Item | null> {
  const db = await getDb();
  return db.items.find((i) => i.closetSlug === closetSlug && i.slug === itemSlug) ?? null;
}

export async function getItemById(id: string): Promise<Item | null> {
  const db = await getDb();
  return db.items.find((i) => i.id === id) ?? null;
}

export async function getCategoriesInUse(slug: string): Promise<Category[]> {
  const db = await getDb();
  const set = new Set<Category>();
  for (const i of db.items) if (i.closetSlug === slug) set.add(i.category);
  return [...set];
}

// ---------- looks ----------

export async function listLooks(slug: string): Promise<Look[]> {
  const db = await getDb();
  return db.looks
    .filter((l) => l.closetSlug === slug)
    .sort((a, b) => a.sortIndex - b.sortIndex);
}

export async function getLookBySlug(closetSlug: string, lookSlug: string): Promise<Look | null> {
  const db = await getDb();
  return db.looks.find((l) => l.closetSlug === closetSlug && l.slug === lookSlug) ?? null;
}

export async function getLookItems(look: Look): Promise<Item[]> {
  const db = await getDb();
  return look.itemIds
    .map((id) => db.items.find((i) => i.id === id))
    .filter((i): i is Item => Boolean(i));
}

export async function getLookById(id: string): Promise<Look | null> {
  const db = await getDb();
  return db.looks.find((l) => l.id === id) ?? null;
}

// ---------- admin: looks ----------

export type LookDraft = {
  id?: string;
  title: string;
  caption?: string | null;
  photo?: Look["photo"];
  itemIds?: string[];
};

export async function upsertLook(closetSlug: string, draft: LookDraft): Promise<Look> {
  return mutate((db) => {
    if (draft.id) {
      const existing = db.looks.find((l) => l.id === draft.id);
      if (existing) {
        existing.title = draft.title;
        existing.caption = draft.caption ?? null;
        existing.itemIds = draft.itemIds ?? existing.itemIds;
        if (draft.photo) existing.photo = draft.photo;
        return existing;
      }
    }
    const maxSort = db.looks.reduce((m, l) => Math.max(m, l.sortIndex), -1);
    const look: Look = {
      id: `look_${nanoid(10)}`,
      closetSlug,
      slug: slugify(draft.title),
      title: draft.title,
      caption: draft.caption ?? null,
      photo: draft.photo ?? { url: "", alt: draft.title, width: 1000, height: 1250 },
      itemIds: draft.itemIds ?? [],
      sortIndex: maxSort + 1,
      createdAt: new Date().toISOString(),
    };
    db.looks.push(look);
    return look;
  });
}

export async function deleteLook(lookId: string): Promise<{ ok: boolean }> {
  return mutate((db) => {
    const before = db.looks.length;
    db.looks = db.looks.filter((l) => l.id !== lookId);
    return { ok: db.looks.length < before };
  });
}

// ---------- the dibs queue ----------

export type CallDibsResult =
  | { ok: true; item: Item; claimId: string; position: number }
  | {
      ok: false;
      reason: "not-found" | "gone" | "queue-full" | "already-in-line" | "make-an-offer";
    };

/**
 * Join the line for a piece. Works for GIFT and for SELL "at asking price".
 * The queue holds up to MAX_DIBS_QUEUE people; queue[0] holds the piece, the
 * rest are the waitlist and move up if someone ahead drops out.
 */
export async function callDibs(input: {
  itemId: string;
  name: string;
  contact: string;
  note?: string | null;
  /** for SELL: only "asking" joins the queue; a lower number must go via createOffer */
  atAsking?: boolean;
}): Promise<CallDibsResult> {
  return mutate((db) => {
    const item = db.items.find((i) => i.id === input.itemId);
    if (!item) return { ok: false as const, reason: "not-found" as const };
    if (item.status === "SOLD" || item.status === "GIVEN") {
      return { ok: false as const, reason: "gone" as const };
    }
    if (item.type === "SELL" && input.atAsking === false) {
      return { ok: false as const, reason: "make-an-offer" as const };
    }
    if (item.queue.length >= MAX_DIBS_QUEUE) {
      return { ok: false as const, reason: "queue-full" as const };
    }
    const name = input.name.trim().slice(0, 60);
    const contact = input.contact.trim().slice(0, 120);
    if (item.queue.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false as const, reason: "already-in-line" as const };
    }
    const claim: DibsClaim = {
      id: `clm_${nanoid(10)}`,
      name,
      contact,
      note: input.note?.trim().slice(0, 240) || null,
      amountCents: item.type === "SELL" ? item.priceCents : null,
      source: "dibs",
      at: new Date().toISOString(),
    };
    item.queue.push(claim);
    item.status = "DIBSED";
    return { ok: true as const, item, claimId: claim.id, position: item.queue.length };
  });
}

export type ReleaseResult =
  | { ok: true; item: Item; promotedName: string | null; nowAvailable: boolean }
  | { ok: false; reason: "not-found" | "not-in-queue" };

/** A person drops their spot. Whoever's behind them moves up. */
export async function releaseDibs(input: {
  itemId: string;
  claimId: string;
}): Promise<ReleaseResult> {
  return mutate((db) => {
    const item = db.items.find((i) => i.id === input.itemId);
    if (!item) return { ok: false as const, reason: "not-found" as const };
    const idx = item.queue.findIndex((c) => c.id === input.claimId);
    if (idx === -1) return { ok: false as const, reason: "not-in-queue" as const };
    const wasHolder = idx === 0;
    item.queue.splice(idx, 1);
    if (item.queue.length === 0 && item.status === "DIBSED") item.status = "AVAILABLE";
    return {
      ok: true as const,
      item,
      promotedName: wasHolder && item.queue.length > 0 ? item.queue[0].name : null,
      nowAvailable: item.queue.length === 0,
    };
  });
}

/** Owner: kick a specific person out of the line (same effect as them releasing). */
export async function ownerRemoveClaim(itemId: string, claimId: string): Promise<{ ok: boolean }> {
  const r = await releaseDibs({ itemId, claimId });
  return { ok: r.ok };
}

/** Owner: hand the piece over — freezes it to the current holder, drops the waitlist. */
export async function finalizeItem(
  itemId: string,
  outcome: "SOLD" | "GIVEN",
): Promise<{ ok: boolean }> {
  return mutate((db) => {
    const item = db.items.find((i) => i.id === itemId);
    if (!item) return { ok: false };
    item.status = outcome;
    item.queue = item.queue.slice(0, 1);
    return { ok: true };
  });
}

// ---------- offers (sales) ----------

export type OfferResult =
  | { ok: true; offer: Offer; item: Item }
  | { ok: false; reason: "not-found" | "not-available" | "not-for-sale" };

export async function createOffer(input: {
  itemId: string;
  name: string;
  contact: string;
  amountCents: number | null;
  message?: string | null;
}): Promise<OfferResult> {
  return mutate((db) => {
    const item = db.items.find((i) => i.id === input.itemId);
    if (!item) return { ok: false as const, reason: "not-found" as const };
    if (item.type !== "SELL") return { ok: false as const, reason: "not-for-sale" as const };
    if (item.status === "SOLD" || item.status === "GIVEN") {
      return { ok: false as const, reason: "not-available" as const };
    }
    const offer: Offer = {
      id: `off_${nanoid(10)}`,
      itemId: item.id,
      name: input.name.trim().slice(0, 60),
      contact: input.contact.trim().slice(0, 120),
      amountCents: input.amountCents,
      message: input.message?.trim().slice(0, 400) || null,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    db.offers.unshift(offer);
    return { ok: true as const, offer, item };
  });
}

export type OfferWithItem = Offer & { item: Item | null };

export async function listOffers(slug: string, status?: OfferStatus): Promise<OfferWithItem[]> {
  const db = await getDb();
  return db.offers
    .filter((o) => {
      const item = db.items.find((i) => i.id === o.itemId);
      return item?.closetSlug === slug && (!status || o.status === status);
    })
    .map((o) => ({ ...o, item: db.items.find((i) => i.id === o.itemId) ?? null }))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function respondToOffer(
  offerId: string,
  decision: "ACCEPTED" | "DECLINED",
): Promise<{ ok: boolean }> {
  return mutate((db) => {
    const offer = db.offers.find((o) => o.id === offerId);
    if (!offer) return { ok: false };
    offer.status = decision;
    if (decision === "ACCEPTED") {
      const item = db.items.find((i) => i.id === offer.itemId);
      if (
        item &&
        item.status !== "SOLD" &&
        item.status !== "GIVEN" &&
        item.queue.length < MAX_DIBS_QUEUE &&
        !item.queue.some((c) => c.name.toLowerCase() === offer.name.toLowerCase())
      ) {
        item.queue.push({
          id: `clm_${nanoid(10)}`,
          name: offer.name,
          contact: offer.contact,
          note: offer.message,
          amountCents: offer.amountCents ?? item.priceCents,
          source: "offer",
          at: new Date().toISOString(),
        });
        item.status = "DIBSED";
      }
      // decline the sibling offers
      for (const o of db.offers) {
        if (o.itemId === offer.itemId && o.id !== offer.id && o.status === "PENDING") {
          o.status = "DECLINED";
        }
      }
    }
    return { ok: true };
  });
}

// ---------- admin: items ----------

export type ItemDraft = Partial<Omit<Item, "id" | "closetSlug" | "createdAt">> & {
  name: string;
};

export async function upsertItem(
  closetSlug: string,
  draft: ItemDraft & { id?: string },
): Promise<Item> {
  return mutate((db) => {
    if (draft.id) {
      const existing = db.items.find((i) => i.id === draft.id);
      if (existing) {
        Object.assign(existing, draft);
        return existing;
      }
    }
    const maxSort = db.items.reduce((m, i) => Math.max(m, i.sortIndex), -1);
    const item: Item = {
      id: draft.id ?? `itm_${nanoid(10)}`,
      closetSlug,
      slug: draft.slug ?? slugify(draft.name),
      name: draft.name,
      category: draft.category ?? "Tops",
      brand: draft.brand ?? null,
      size: draft.size ?? null,
      color: draft.color ?? null,
      condition: draft.condition ?? "Loved",
      description: draft.description ?? "",
      hook: draft.hook ?? null,
      tags: draft.tags ?? [],
      type: draft.type ?? "GIFT",
      priceCents: draft.priceCents ?? null,
      currency: draft.currency ?? "EUR",
      status: draft.status ?? "AVAILABLE",
      queue: draft.queue ?? [],
      photos: draft.photos ?? [],
      story: draft.story ?? null,
      aiGenerated: draft.aiGenerated ?? false,
      aiPriceLowCents: draft.aiPriceLowCents ?? null,
      aiPriceHighCents: draft.aiPriceHighCents ?? null,
      sortIndex: draft.sortIndex ?? maxSort + 1,
      createdAt: new Date().toISOString(),
    };
    db.items.push(item);
    return item;
  });
}

export async function setItemStatus(itemId: string, status: ItemStatus): Promise<{ ok: boolean }> {
  return mutate((db) => {
    const item = db.items.find((i) => i.id === itemId);
    if (!item) return { ok: false };
    item.status = status;
    if (status === "AVAILABLE") item.queue = [];
    if (status === "SOLD" || status === "GIVEN") item.queue = item.queue.slice(0, 1);
    return { ok: true };
  });
}

export async function deleteItem(itemId: string): Promise<{ ok: boolean }> {
  return mutate((db) => {
    const before = db.items.length;
    db.items = db.items.filter((i) => i.id !== itemId);
    db.offers = db.offers.filter((o) => o.itemId !== itemId);
    for (const look of db.looks) look.itemIds = look.itemIds.filter((id) => id !== itemId);
    return { ok: db.items.length < before };
  });
}
