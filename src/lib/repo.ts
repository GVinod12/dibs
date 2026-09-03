import { nanoid } from "nanoid";
import { getDb, mutate } from "./db/store";
import type { Item, Look, Offer, Closet } from "./db/types";
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
  for (const i of items) if (i.claimantName) claimants.add(i.claimantName.toLowerCase());
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

// ---------- claiming (gifts) ----------

export type ClaimResult =
  | { ok: true; item: Item }
  | { ok: false; reason: "not-found" | "not-available" | "not-a-gift" };

export async function claimGift(input: {
  itemId: string;
  name: string;
  note?: string | null;
}): Promise<ClaimResult> {
  return mutate((db) => {
    const item = db.items.find((i) => i.id === input.itemId);
    if (!item) return { ok: false as const, reason: "not-found" as const };
    if (item.type !== "GIFT") return { ok: false as const, reason: "not-a-gift" as const };
    if (item.status !== "AVAILABLE") return { ok: false as const, reason: "not-available" as const };
    item.status = "DIBSED";
    item.claimantName = input.name.trim().slice(0, 60);
    item.claimantNote = input.note?.trim().slice(0, 240) || null;
    item.claimedAt = new Date().toISOString();
    return { ok: true as const, item };
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
      if (item && item.status === "AVAILABLE") {
        item.status = "DIBSED";
        item.claimantName = offer.name;
        item.claimantNote = offer.message;
        item.claimedAt = new Date().toISOString();
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
      claimantName: draft.claimantName ?? null,
      claimantNote: draft.claimantNote ?? null,
      claimedAt: draft.claimedAt ?? null,
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

export async function setItemStatus(
  itemId: string,
  status: ItemStatus,
  claimantName?: string | null,
): Promise<{ ok: boolean }> {
  return mutate((db) => {
    const item = db.items.find((i) => i.id === itemId);
    if (!item) return { ok: false };
    item.status = status;
    if (status === "AVAILABLE") {
      item.claimantName = null;
      item.claimantNote = null;
      item.claimedAt = null;
    } else if (claimantName !== undefined) {
      item.claimantName = claimantName;
      item.claimedAt = item.claimedAt ?? new Date().toISOString();
    }
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
