"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { claimGift, createOffer, getItemById } from "@/lib/repo";

export type DibsState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "claimed"; itemName: string; claimant: string };

const claimSchema = z.object({
  itemId: z.string().min(1),
  closetSlug: z.string().min(1),
  itemSlug: z.string().min(1),
  name: z.string().trim().min(1, "Pop your name in first.").max(60),
  note: z.string().trim().max(240).optional(),
});

export async function callDibsAction(_prev: DibsState, formData: FormData): Promise<DibsState> {
  const parsed = claimSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Something's off with that." };
  }
  const { itemId, closetSlug, itemSlug, name, note } = parsed.data;

  const result = await claimGift({ itemId, name, note });
  if (!result.ok) {
    const msg =
      result.reason === "not-available"
        ? "Ah — someone got there first. It's gone."
        : result.reason === "not-a-gift"
          ? "This one's for sale, not a gift."
          : "Couldn't find that piece.";
    return { status: "error", message: msg };
  }

  // NB: deliberately not revalidating this item page — the client panel owns
  // the celebratory "it's yours" state until the visitor navigates away.
  revalidatePath(`/closet/${closetSlug}`);
  revalidatePath(`/closet/${closetSlug}/looks`);
  revalidatePath(`/closet/${closetSlug}/dibs`);
  revalidatePath("/admin");
  void itemSlug;
  return { status: "claimed", itemName: result.item.name, claimant: name };
}

export type OfferState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; itemName: string; asking: boolean };

const offerSchema = z.object({
  itemId: z.string().min(1),
  closetSlug: z.string().min(1),
  itemSlug: z.string().min(1),
  name: z.string().trim().min(1, "Name, please.").max(60),
  contact: z.string().trim().min(3, "Leave a way to reach you — handle, number, anything.").max(120),
  mode: z.enum(["asking", "offer"]),
  amount: z.string().trim().optional(),
  message: z.string().trim().max(400).optional(),
});

export async function makeOfferAction(_prev: OfferState, formData: FormData): Promise<OfferState> {
  const parsed = offerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { itemId, closetSlug, itemSlug, name, contact, mode, amount, message } = parsed.data;

  let amountCents: number | null = null;
  if (mode === "offer") {
    const n = Number(String(amount).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(n) || n <= 0) {
      return { status: "error", message: "Put a number on it." };
    }
    amountCents = Math.round(n * 100);
  }

  const item = await getItemById(itemId);
  const result = await createOffer({ itemId, name, contact, amountCents, message });
  if (!result.ok) {
    const msg =
      result.reason === "not-available"
        ? "Too late — this one's already sold."
        : result.reason === "not-for-sale"
          ? "This one's a gift. Just call dibs."
          : "Couldn't find that piece.";
    return { status: "error", message: msg };
  }

  revalidatePath(`/closet/${closetSlug}/dibs`);
  revalidatePath("/admin");
  void itemSlug;
  return { status: "sent", itemName: item?.name ?? "it", asking: mode === "asking" };
}
