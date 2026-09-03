"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Item, Photo } from "@/lib/db/types";
import { CATEGORIES, CONDITIONS, ITEM_STATUSES } from "@/lib/constants";
import {
  catalogueAction,
  saveItemAction,
  type CatalogueState,
  type SaveState,
} from "@/app/admin/actions";
import { cn } from "@/lib/cn";

const field =
  "w-full border-2 border-[var(--color-ink)] bg-white px-3 py-2 font-[family-name:var(--font-space-grotesk)] text-sm text-[var(--color-ink)]";
const label = "block text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[var(--color-fog)] mb-1";

type Draft = {
  name: string;
  category: string;
  brand: string;
  size: string;
  color: string;
  condition: string;
  type: "GIFT" | "SELL";
  price: string;
  hook: string;
  description: string;
  story: string;
  tags: string;
  status: string;
  altText: string;
  aiPriceLow: string;
  aiPriceHigh: string;
};

function fromItem(item?: Item): Draft {
  return {
    name: item?.name ?? "",
    category: item?.category ?? "Tops",
    brand: item?.brand ?? "",
    size: item?.size ?? "",
    color: item?.color ?? "",
    condition: item?.condition ?? "Loved",
    type: item?.type ?? "GIFT",
    price: item?.priceCents ? String(item.priceCents / 100) : "",
    hook: item?.hook ?? "",
    description: item?.description ?? "",
    story: item?.story ?? "",
    tags: item?.tags?.join(", ") ?? "",
    status: item?.status ?? "AVAILABLE",
    altText: item?.photos?.[0]?.alt ?? "",
    aiPriceLow: item?.aiPriceLowCents ? String(item.aiPriceLowCents / 100) : "",
    aiPriceHigh: item?.aiPriceHighCents ? String(item.aiPriceHighCents / 100) : "",
  };
}

export function ItemEditor({ item, aiOn }: { item?: Item; aiOn: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => fromItem(item));
  const [photos, setPhotos] = useState<Photo[]>(item?.photos ?? []);
  const [aiUsed, setAiUsed] = useState(item?.aiGenerated ?? false);
  const [newPhotoDims, setNewPhotoDims] = useState<{ w: number; h: number } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const newPhotoRef = useRef<HTMLInputElement>(null);

  const [catState, runCatalogue, cataloguing] = useActionState<CatalogueState, FormData>(catalogueAction, {
    status: "idle",
  });
  const [saveState, runSave, saving] = useActionState<SaveState, FormData>(saveItemAction, { status: "idle" });

  // apply AI draft when it lands
  useEffect(() => {
    if (catState.status !== "done") return;
    const d = catState.draft;
    setDraft((prev) => ({
      ...prev,
      name: d.name || prev.name,
      category: CATEGORIES.includes(d.category as never) ? d.category : prev.category,
      color: d.color || prev.color,
      brand: d.brandGuess || prev.brand,
      condition: CONDITIONS.includes(d.condition as never) ? d.condition : prev.condition,
      hook: d.hook || prev.hook,
      description: d.description || prev.description,
      tags: d.tags?.join(", ") || prev.tags,
      altText: d.altText || prev.altText,
      aiPriceLow: d.priceLowCents ? String(d.priceLowCents / 100) : prev.aiPriceLow,
      aiPriceHigh: d.priceHighCents ? String(d.priceHighCents / 100) : prev.aiPriceHigh,
    }));
    setPhotos([{ url: catState.photoUrl, alt: catState.draft.altText, width: catState.photoW, height: catState.photoH }]);
    setAiUsed(true);
  }, [catState]);

  useEffect(() => {
    if (saveState.status === "saved") {
      router.push("/admin");
      router.refresh();
    }
  }, [saveState, router]);

  function readDims(file: File, cb: (w: number, h: number) => void) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      cb(img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDraft((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-[family-name:var(--font-anton)] text-4xl text-[var(--color-ink)] sm:text-5xl">
        {item ? "EDIT PIECE" : "NEW PIECE"}
      </h1>

      {/* ---- AI catalogue ---- */}
      {!item ? (
        <form
          action={runCatalogue}
          className="mt-6 border-2 border-[var(--color-cobalt)] bg-white p-4"
          onSubmit={(e) => {
            const f = (e.currentTarget.elements.namedItem("photo") as HTMLInputElement)?.files?.[0];
            if (f) {
              readDims(f, (w, h) => {
                (e.currentTarget.elements.namedItem("photoW") as HTMLInputElement).value = String(w);
                (e.currentTarget.elements.namedItem("photoH") as HTMLInputElement).value = String(h);
              });
            }
          }}
        >
          <p className="font-[family-name:var(--font-anton)] text-lg text-[var(--color-cobalt)]">
            catalogue with AI
          </p>
          {!aiOn ? (
            <p className="mt-2 text-sm text-[var(--color-ink)]">
              AI is off. Add <code className="text-xs">ANTHROPIC_API_KEY</code> to <code>.env.local</code> and restart —
              until then, fill the form by hand below. Nothing here is faked.
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--color-fog)]">
              Upload one clear photo. AI drafts the fields — you check and edit every one before publishing.
            </p>
          )}
          <input type="hidden" name="photoW" />
          <input type="hidden" name="photoH" />
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            required
            disabled={!aiOn}
            className="mt-3 block w-full text-sm file:mr-3 file:border-2 file:border-[var(--color-ink)] file:bg-[var(--color-acid)] file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="mt-3 max-h-48 border-2 border-[var(--color-ink)] object-contain" />
          ) : null}
          <div className="mt-3 flex gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input type="radio" name="intent" value="GIFT" defaultChecked /> gift
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" name="intent" value="SELL" /> for sale
            </label>
          </div>
          <input name="notes" placeholder="anything AI can't see — brand, flaws, size" className={cn(field, "mt-3")} />
          {catState.status === "error" ? (
            <p className="mt-3 border-2 border-[var(--color-tomato)] bg-[var(--color-tomato)]/10 p-2 text-sm text-[var(--color-tomato)]">
              {catState.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!aiOn || cataloguing}
            className="mt-3 bg-[var(--color-cobalt)] px-4 py-2 font-[family-name:var(--font-anton)] text-lg uppercase text-white disabled:opacity-50"
          >
            {cataloguing ? "looking…" : "ask AI →"}
          </button>
        </form>
      ) : null}

      {aiUsed ? (
        <p className="mt-4 border-l-4 border-[var(--color-pink)] bg-[var(--color-pink)]/10 px-3 py-2 text-sm text-[var(--color-ink)]">
          {catState.status === "done" ? `Drafted by ${catState.model}. ` : "AI-drafted. "}
          Read every field — the price is an <strong>estimate</strong>, not a valuation.
        </p>
      ) : null}

      {/* ---- form ---- */}
      <form action={runSave} className="mt-6 space-y-4">
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <input type="hidden" name="photosJson" value={JSON.stringify(photos)} />
        <input type="hidden" name="aiGenerated" value={aiUsed ? "true" : "false"} />
        <input type="hidden" name="newPhotoW" value={newPhotoDims?.w ?? ""} />
        <input type="hidden" name="newPhotoH" value={newPhotoDims?.h ?? ""} />

        {photos[0] ? (
          <div>
            <span className={label}>current photo</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0].url} alt="" className="max-h-56 border-2 border-[var(--color-ink)] object-contain" />
          </div>
        ) : null}

        {!photos.length || item ? (
          <div>
            <label className={label} htmlFor="newPhoto">
              {photos.length ? "replace photo" : "photo"}
            </label>
            <input
              ref={newPhotoRef}
              id="newPhoto"
              type="file"
              name="newPhoto"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm file:mr-3 file:border-2 file:border-[var(--color-ink)] file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readDims(f, (w, h) => setNewPhotoDims({ w, h }));
              }}
            />
          </div>
        ) : null}

        <div>
          <label className={label} htmlFor="name">name</label>
          <input id="name" name="name" required value={draft.name} onChange={set("name")} className={field} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="category">category</label>
            <select id="category" name="category" value={draft.category} onChange={set("category")} className={field}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="condition">condition</label>
            <select id="condition" name="condition" value={draft.condition} onChange={set("condition")} className={field}>
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="brand">brand</label>
            <input id="brand" name="brand" value={draft.brand} onChange={set("brand")} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="size">size</label>
            <input id="size" name="size" value={draft.size} onChange={set("size")} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="color">colour</label>
            <input id="color" name="color" value={draft.color} onChange={set("color")} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="status">status</label>
            <select id="status" name="status" value={draft.status} onChange={set("status")} className={field}>
              {ITEM_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="grid grid-cols-3 gap-3">
          <div>
            <label className={label} htmlFor="type">type</label>
            <select id="type" name="type" value={draft.type} onChange={set("type")} className={field}>
              <option value="GIFT">GIFT</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          {draft.type === "SELL" ? (
            <>
              <div>
                <label className={label} htmlFor="price">price €</label>
                <input id="price" name="price" inputMode="decimal" value={draft.price} onChange={set("price")} className={field} />
              </div>
              <div>
                <label className={label}>AI est. €</label>
                <div className="flex gap-1">
                  <input name="aiPriceLow" placeholder="low" value={draft.aiPriceLow} onChange={set("aiPriceLow")} className={cn(field, "px-2")} />
                  <input name="aiPriceHigh" placeholder="high" value={draft.aiPriceHigh} onChange={set("aiPriceHigh")} className={cn(field, "px-2")} />
                </div>
              </div>
            </>
          ) : (
            <>
              <input type="hidden" name="price" value="" />
              <input type="hidden" name="aiPriceLow" value="" />
              <input type="hidden" name="aiPriceHigh" value="" />
            </>
          )}
        </fieldset>

        <div>
          <label className={label} htmlFor="hook">hook <span className="normal-case">— one spicy line</span></label>
          <input id="hook" name="hook" value={draft.hook} onChange={set("hook")} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="description">description</label>
          <textarea id="description" name="description" rows={3} value={draft.description} onChange={set("description")} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="story">story <span className="normal-case">(optional)</span></label>
          <textarea id="story" name="story" rows={2} value={draft.story} onChange={set("story")} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="tags">tags <span className="normal-case">(comma separated)</span></label>
          <input id="tags" name="tags" value={draft.tags} onChange={set("tags")} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="altText">alt text <span className="normal-case">— for screen readers</span></label>
          <input id="altText" name="altText" value={draft.altText} onChange={set("altText")} className={field} />
        </div>

        {saveState.status === "error" ? (
          <p className="border-2 border-[var(--color-tomato)] bg-[var(--color-tomato)]/10 p-2 text-sm font-semibold text-[var(--color-tomato)]">
            {saveState.message}
          </p>
        ) : null}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-[var(--color-ink)] px-6 py-3 font-[family-name:var(--font-anton)] text-xl uppercase text-[var(--color-acid)] disabled:opacity-60"
          >
            {saving ? "saving…" : "publish →"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="border-2 border-[var(--color-ink)] px-4 py-3 text-sm font-bold uppercase"
          >
            cancel
          </button>
        </div>
      </form>
    </div>
  );
}
