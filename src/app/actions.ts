"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { callDibs, releaseDibs, createOffer, getItemById } from "@/lib/repo";

function revalidateCloset(slug: string) {
  revalidatePath(`/closet/${slug}`);
  revalidatePath(`/closet/${slug}/looks`);
  revalidatePath(`/closet/${slug}/dibs`);
  revalidatePath("/admin");
}

// ---------------------------------------------------------------- call dibs

export type DibsState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "in-line";
      itemName: string;
      claimant: string;
      claimId: string;
      /** 1 = holds it now, 2/3 = on the waitlist */
      position: number;
    };

const claimSchema = z.object({
  itemId: z.string().min(1),
  closetSlug: z.string().min(1),
  itemSlug: z.string().min(1),
  name: z.string().trim().min(1, "Pop your name in first.").max(60),
  contact: z.string().trim().min(3, "Leave a way to reach you — handle, number, anything.").max(120),
  note: z.string().trim().max(240).optional(),
  atAsking: z.enum(["yes", "no"]).optional(),
});

export async function callDibsAction(_prev: DibsState, formData: FormData): Promise<DibsState> {
  const parsed = claimSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Something's off with that." };
  }
  const { itemId, closetSlug, itemSlug, name, contact, note, atAsking } = parsed.data;

  const result = await callDibs({
    itemId,
    name,
    contact,
    note,
    atAsking: atAsking === "no" ? false : true,
  });
  if (!result.ok) {
    const msg = {
      "not-found": "Couldn't find that piece.",
      gone: "Too late — this one's already gone to its new home.",
      "queue-full": "The line's full — three people are already on it. Try another piece.",
      "already-in-line": "You're already in line for this one.",
      "make-an-offer": "This one's for sale — make an offer instead.",
    }[result.reason];
    return { status: "error", message: msg };
  }

  revalidateCloset(closetSlug);
  void itemSlug; // this item page's panel owns the celebratory state until navigation
  return {
    status: "in-line",
    itemName: result.item.name,
    claimant: name,
    claimId: result.claimId,
    position: result.position,
  };
}

// ---------------------------------------------------------------- release

export type ReleaseState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "released"; promotedName: string | null };

const releaseSchema = z.object({
  itemId: z.string().min(1),
  claimId: z.string().min(1),
  closetSlug: z.string().min(1),
  itemSlug: z.string().min(1),
});

export async function releaseDibsAction(_prev: ReleaseState, formData: FormData): Promise<ReleaseState> {
  const parsed = releaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Couldn't do that." };
  const { itemId, claimId, closetSlug, itemSlug } = parsed.data;

  const result = await releaseDibs({ itemId, claimId });
  if (!result.ok) {
    return {
      status: "error",
      message: result.reason === "not-in-queue" ? "You're not in line for this one." : "Couldn't find that piece.",
    };
  }
  revalidateCloset(closetSlug);
  revalidatePath(`/closet/${closetSlug}/item/${itemSlug}`);
  return { status: "released", promotedName: result.promotedName };
}

// ---------------------------------------------------------------- offers

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
  amount: z.string().trim().optional(),
  message: z.string().trim().max(400).optional(),
});

export async function makeOfferAction(_prev: OfferState, formData: FormData): Promise<OfferState> {
  const parsed = offerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { itemId, closetSlug, itemSlug, name, contact, amount, message } = parsed.data;

  const n = Number(String(amount).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) {
    return { status: "error", message: "Put a number on it." };
  }
  const amountCents = Math.round(n * 100);

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
  return { status: "sent", itemName: item?.name ?? "it", asking: false };
}
