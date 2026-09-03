import type { Category, Condition, ItemStatus, ItemType, OfferStatus } from "@/lib/constants";

export type Photo = {
  url: string;
  alt: string;
  /** intrinsic pixel size — needed by next/image for non-imported sources */
  width: number;
  height: number;
};

/** one person's spot in the line for a piece. queue[0] is the current holder. */
export type DibsClaim = {
  id: string;
  name: string;
  contact: string;
  note: string | null;
  /** null = gift; a number = the price they've committed to (asking, or an accepted offer) */
  amountCents: number | null;
  /** how they got in line */
  source: "dibs" | "offer";
  at: string;
};

export type Item = {
  id: string;
  closetSlug: string;
  slug: string;
  name: string;
  category: Category;
  brand: string | null;
  size: string | null;
  color: string | null;
  condition: Condition;
  /** short fashion-forward description in the owner's voice */
  description: string;
  /** a spicier one-liner shown on the card */
  hook: string | null;
  tags: string[];
  type: ItemType;
  priceCents: number | null;
  currency: string;
  status: ItemStatus;
  /** the line for this piece — ordered, max MAX_DIBS_QUEUE, [0] holds it */
  queue: DibsClaim[];
  /** legacy single-claim fields; normalised into `queue` on load */
  claimantName?: string | null;
  claimantNote?: string | null;
  claimedAt?: string | null;
  photos: Photo[];
  /** provenance / story field */
  story: string | null;
  aiGenerated: boolean;
  aiPriceLowCents: number | null;
  aiPriceHighCents: number | null;
  sortIndex: number;
  createdAt: string;
};

export type Look = {
  id: string;
  closetSlug: string;
  slug: string;
  title: string;
  caption: string | null;
  photo: Photo;
  /** item ids worn in this look */
  itemIds: string[];
  sortIndex: number;
  createdAt: string;
};

export type Offer = {
  id: string;
  itemId: string;
  name: string;
  contact: string;
  /** null = "call dibs at asking price", number = a counter-offer */
  amountCents: number | null;
  message: string | null;
  status: OfferStatus;
  createdAt: string;
};

export type Closet = {
  slug: string;
  title: string;
  ownerName: string;
  intro: string;
  /** the pinned line on the landing hero */
  tagline: string;
  createdAt: string;
};

export type Database = {
  closets: Closet[];
  items: Item[];
  looks: Look[];
  offers: Offer[];
};
