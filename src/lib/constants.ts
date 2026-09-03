export const CATEGORIES = [
  "Outerwear",
  "Knitwear",
  "Tops",
  "Dresses",
  "Bottoms",
  "Denim",
  "Shoes",
  "Bags",
  "Accessories",
  "Vintage",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CONDITIONS = [
  "New with tags",
  "Barely worn",
  "Loved",
  "Well loved",
  "Vintage character",
] as const;
export type Condition = (typeof CONDITIONS)[number];

export const ITEM_TYPES = ["GIFT", "SELL"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_STATUSES = ["AVAILABLE", "DIBSED", "SOLD", "GIVEN"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const OFFER_STATUSES = ["PENDING", "ACCEPTED", "DECLINED"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

/**
 * State is always shown as a coloured LABEL, never a colour alone.
 * `bg` / `fg` are CSS custom-property references from globals.css.
 */
type StateStyle = { label: string; bg: string; fg: string };

export const STATUS_STYLE: Record<ItemStatus, StateStyle> = {
  AVAILABLE: { label: "AVAILABLE", bg: "var(--color-acid)", fg: "var(--color-ink)" },
  DIBSED: { label: "DIBSED ♡", bg: "var(--color-pink)", fg: "#fff" },
  SOLD: { label: "SOLD", bg: "var(--color-tomato)", fg: "#fff" },
  GIVEN: { label: "GONE TO A GOOD HOME", bg: "var(--color-tomato)", fg: "#fff" },
};

export const TYPE_STYLE: Record<ItemType, StateStyle> = {
  GIFT: { label: "GIFT", bg: "var(--color-lilac)", fg: "var(--color-ink)" },
  SELL: { label: "FOR SALE", bg: "var(--color-cobalt)", fg: "#fff" },
};

/** an item is claimable while it is still AVAILABLE */
export function isClaimable(status: ItemStatus): boolean {
  return status === "AVAILABLE";
}

export const CURRENCY = "EUR";
export const DEFAULT_CLOSET_SLUG = "the-closet";
export const ADMIN_COOKIE = "dibs_admin";
