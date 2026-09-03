"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { ADMIN_COOKIE, checkPassword, isAdmin } from "@/lib/admin-auth";
import { catalogueFromImage } from "@/lib/ai/catalogue";
import type { CatalogueDraft } from "@/lib/ai/prompt";
import { saveImage } from "@/lib/storage";
import {
  deleteItem,
  finalizeItem,
  getPrimaryCloset,
  ownerRemoveClaim,
  respondToOffer,
  setItemStatus,
  slugify,
  upsertItem,
} from "@/lib/repo";
import type { Photo } from "@/lib/db/types";
import { CATEGORIES, CONDITIONS, type Category, type Condition, type ItemStatus } from "@/lib/constants";

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised.");
}

// ---------- auth ----------

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const token = checkPassword(password);
  if (!token) return { error: "Wrong password." };
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect("/admin");
}

export async function logoutAction() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin");
}

// ---------- item status / offers ----------

export async function setStatusAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("itemId"));
  const status = String(formData.get("status")) as ItemStatus;
  await setItemStatus(id, status);
  revalidatePath("/admin");
  revalidatePath("/closet", "layout");
}

/** Owner hands the piece over — SOLD or GIVEN, waitlist cleared. */
export async function finalizeItemAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("itemId"));
  const outcome = String(formData.get("outcome")) === "SOLD" ? "SOLD" : "GIVEN";
  await finalizeItem(id, outcome);
  revalidatePath("/admin");
  revalidatePath("/closet", "layout");
}

/** Owner drops someone from the line (e.g. #1 went quiet) — next person moves up. */
export async function bumpClaimAction(formData: FormData) {
  await assertAdmin();
  await ownerRemoveClaim(String(formData.get("itemId")), String(formData.get("claimId")));
  revalidatePath("/admin");
  revalidatePath("/closet", "layout");
}

export async function respondOfferAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("offerId"));
  const decision = String(formData.get("decision")) as "ACCEPTED" | "DECLINED";
  await respondToOffer(id, decision);
  revalidatePath("/admin");
  revalidatePath("/closet", "layout");
}

export async function deleteItemAction(formData: FormData) {
  await assertAdmin();
  await deleteItem(String(formData.get("itemId")));
  revalidatePath("/admin");
  revalidatePath("/closet", "layout");
}

// ---------- AI catalogue ----------

export type CatalogueState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; draft: CatalogueDraft; model: string; photoUrl: string; photoW: number; photoH: number };

export async function catalogueAction(_prev: CatalogueState, formData: FormData): Promise<CatalogueState> {
  await assertAdmin();
  const file = formData.get("photo");
  const intent = (String(formData.get("intent")) === "SELL" ? "SELL" : "GIFT") as "GIFT" | "SELL";
  const notes = String(formData.get("notes") ?? "").slice(0, 500) || undefined;
  const w = Number(formData.get("photoW")) || 1000;
  const h = Number(formData.get("photoH")) || 1250;

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Pick a photo first." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { status: "error", message: "That photo's over 8 MB — shrink it a touch." };
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const saved = await saveImage(bytes, file.type);

  const outcome = await catalogueFromImage({ base64, mediaType: file.type, intent, notes });
  if (!outcome.ok) {
    // photo is still saved so the owner can catalogue it by hand
    return {
      status: "error",
      message: outcome.message,
    };
  }
  return {
    status: "done",
    draft: outcome.draft,
    model: outcome.model,
    photoUrl: saved.url,
    photoW: w,
    photoH: h,
  };
}

// ---------- save item ----------

export type SaveState = { status: "idle" } | { status: "error"; message: string } | { status: "saved"; slug: string };

const saveSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "It needs a name."),
  category: z.enum(CATEGORIES as unknown as [Category, ...Category[]]),
  brand: z.string().trim().optional(),
  size: z.string().trim().optional(),
  color: z.string().trim().optional(),
  condition: z.enum(CONDITIONS as unknown as [Condition, ...Condition[]]),
  type: z.enum(["GIFT", "SELL"]),
  price: z.string().trim().optional(),
  hook: z.string().trim().optional(),
  description: z.string().trim().optional(),
  story: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  status: z.enum(["AVAILABLE", "DIBSED", "SOLD", "GIVEN"]),
  altText: z.string().trim().optional(),
  aiPriceLow: z.string().trim().optional(),
  aiPriceHigh: z.string().trim().optional(),
  aiGenerated: z.string().optional(),
  photosJson: z.string().optional(),
});

function toCents(v?: string): number | null {
  if (!v) return null;
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

export async function saveItemAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await assertAdmin();
  const parsed = saveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const d = parsed.data;
  const closet = await getPrimaryCloset();

  // photos: either from a fresh upload or an existing JSON blob
  let photos: Photo[] = [];
  try {
    photos = d.photosJson ? (JSON.parse(d.photosJson) as Photo[]) : [];
  } catch {
    photos = [];
  }
  const upload = formData.get("newPhoto");
  if (upload instanceof File && upload.size > 0) {
    const bytes = await upload.arrayBuffer();
    const saved = await saveImage(bytes, upload.type);
    photos = [
      {
        url: saved.url,
        alt: d.altText || d.name,
        width: Number(formData.get("newPhotoW")) || 1000,
        height: Number(formData.get("newPhotoH")) || 1250,
      },
      ...photos,
    ];
  }
  if (photos.length && d.altText) photos[0].alt = d.altText;

  const item = await upsertItem(closet.slug, {
    id: d.id || undefined,
    name: d.name,
    slug: d.id ? undefined : slugify(d.name),
    category: d.category,
    brand: d.brand || null,
    size: d.size || null,
    color: d.color || null,
    condition: d.condition,
    type: d.type,
    priceCents: d.type === "SELL" ? toCents(d.price) : null,
    hook: d.hook || null,
    description: d.description || "",
    story: d.story || null,
    tags: (d.tags ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
    status: d.status,
    photos,
    aiGenerated: d.aiGenerated === "on" || d.aiGenerated === "true",
    aiPriceLowCents: toCents(d.aiPriceLow),
    aiPriceHighCents: toCents(d.aiPriceHigh),
  });

  revalidatePath("/admin");
  revalidatePath("/closet", "layout");
  return { status: "saved", slug: item.slug };
}
