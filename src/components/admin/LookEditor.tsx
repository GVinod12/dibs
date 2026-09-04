"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Look } from "@/lib/db/types";
import { saveLookAction, type LookSaveState } from "@/app/admin/actions";
import { cn } from "@/lib/cn";

const field =
  "w-full border-2 border-[var(--color-ink)] bg-white px-3 py-2 font-[family-name:var(--font-space-grotesk)] text-sm text-[var(--color-ink)]";
const label = "block text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[var(--color-fog)] mb-1";

type ItemLite = { id: string; name: string; photoUrl: string | null };

export function LookEditor({ look, items }: { look?: Look; items: ItemLite[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<LookSaveState, FormData>(saveLookAction, { status: "idle" });
  const [preview, setPreview] = useState<string | null>(look?.photo.url ?? null);
  const [dims, setDims] = useState<{ w: number; h: number }>({
    w: look?.photo.width ?? 1000,
    h: look?.photo.height ?? 1250,
  });
  const [picked, setPicked] = useState<Set<string>>(new Set(look?.itemIds ?? []));

  useEffect(() => {
    if (state.status === "saved") {
      router.push("/admin");
      router.refresh();
    }
  }, [state, router]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-[family-name:var(--font-anton)] text-4xl text-[var(--color-ink)] sm:text-5xl">
        {look ? "EDIT LOOK" : "NEW LOOK"}
      </h1>

      <form action={action} className="mt-6 space-y-4">
        {look ? <input type="hidden" name="id" value={look.id} /> : null}
        {look ? <input type="hidden" name="photoUrl" value={look.photo.url} /> : null}
        <input type="hidden" name="photoW" value={dims.w} />
        <input type="hidden" name="photoH" value={dims.h} />
        <input type="hidden" name="itemIds" value={[...picked].join(",")} />

        <div>
          <label className={label} htmlFor="photo">
            {look ? "replace photo" : "photo"} <span className="normal-case">— mirror selfie, outfit shot, a detail</span>
          </label>
          <input
            id="photo"
            type="file"
            name="photo"
            accept="image/*,.heic,.heif"
            onChange={onFile}
            className="block w-full text-sm file:mr-3 file:border-2 file:border-[var(--color-ink)] file:bg-[var(--color-acid)] file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase"
          />
          {preview ? (
            <img
              src={preview}
              alt=""
              className="mt-3 max-h-64 border-2 border-[var(--color-ink)] object-contain"
            />
          ) : null}
        </div>

        <div>
          <label className={label} htmlFor="title">title</label>
          <input
            id="title"
            name="title"
            required
            defaultValue={look?.title}
            placeholder="Good Vibes, Bad Decisions"
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="caption">caption <span className="normal-case">(optional)</span></label>
          <textarea
            id="caption"
            name="caption"
            rows={2}
            defaultValue={look?.caption ?? ""}
            placeholder="striped wide-legs, the red bag that started three arguments. peak 1am energy."
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="altText">alt text <span className="normal-case">— for screen readers</span></label>
          <input id="altText" name="altText" defaultValue={look?.photo.alt ?? ""} className={field} />
        </div>

        <fieldset>
          <legend className={label}>in this look <span className="normal-case">— pick pieces so friends can call dibs</span></legend>
          {items.length === 0 ? (
            <p className="text-sm text-[var(--color-fog)]">No pieces in the closet yet.</p>
          ) : (
            <div className="mt-1 grid max-h-64 grid-cols-2 gap-1 overflow-y-auto border-2 border-[var(--color-ink)] p-2 sm:grid-cols-3">
              {items.map((it) => {
                const on = picked.has(it.id);
                return (
                  <button
                    type="button"
                    key={it.id}
                    onClick={() => toggle(it.id)}
                    className={cn(
                      "flex items-center gap-1.5 border-2 p-1 text-left text-xs",
                      on ? "border-[var(--color-pink)] bg-[var(--color-pink)]/10" : "border-transparent hover:border-[var(--color-ink)]",
                    )}
                  >
                    {it.photoUrl ? (
                      <img src={it.photoUrl} alt="" className="h-8 w-8 shrink-0 border border-[var(--color-ink)] object-cover" />
                    ) : (
                      <span className="h-8 w-8 shrink-0 border border-[var(--color-ink)]" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{it.name}</span>
                    {on ? <span className="text-[var(--color-pink)]">✓</span> : null}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>

        {state.status === "error" ? (
          <p className="border-2 border-[var(--color-tomato)] bg-[var(--color-tomato)]/10 p-2 text-sm font-semibold text-[var(--color-tomato)]">
            {state.message}
          </p>
        ) : null}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="bg-[var(--color-ink)] px-6 py-3 font-[family-name:var(--font-anton)] text-xl uppercase text-[var(--color-acid)] disabled:opacity-60"
          >
            {pending ? "saving…" : "publish look →"}
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
