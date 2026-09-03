import Link from "next/link";
import type { Item } from "@/lib/db/types";
import { formatPrice, relativeTime } from "@/lib/format";
import { StatusLabel } from "@/components/collage";
import {
  setStatusAction,
  deleteItemAction,
  bumpClaimAction,
  finalizeItemAction,
} from "@/app/admin/actions";
import { ITEM_STATUSES } from "@/lib/constants";

export function AdminItemRow({ item, closetSlug }: { item: Item; closetSlug: string }) {
  const finalised = item.status === "SOLD" || item.status === "GIVEN";

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden border-2 border-[var(--color-ink)]">
          {item.photos[0] ? (
            <img src={item.photos[0].url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[var(--color-fog)]">?</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/items/${item.id}`}
            className="font-[family-name:var(--font-anton)] text-lg leading-none text-[var(--color-ink)] hover:text-[var(--color-pink)]"
          >
            {item.name}
          </Link>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-fog)]">
            <StatusLabel status={item.status} />
            <span>{item.type === "SELL" ? formatPrice(item.priceCents, item.currency) : "gift"}</span>
          </p>
        </div>

        <form action={setStatusAction} className="flex items-center gap-1">
          <input type="hidden" name="itemId" value={item.id} />
          <select
            name="status"
            defaultValue={item.status}
            className="border-2 border-[var(--color-ink)] bg-white px-1.5 py-1 text-[0.62rem] font-bold uppercase"
          >
            {ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="bg-[var(--color-ink)] px-2 py-1 text-[0.62rem] font-bold uppercase text-[var(--color-acid)]">
            set
          </button>
        </form>

        <form action={deleteItemAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <button
            className="border-2 border-[var(--color-tomato)] px-2 py-1 text-[0.62rem] font-bold uppercase text-[var(--color-tomato)] hover:bg-[var(--color-tomato)] hover:text-white"
            aria-label={`Delete ${item.name}`}
          >
            ✕
          </button>
        </form>
      </div>

      {/* the line */}
      {item.queue.length > 0 ? (
        <div className="mt-2 ml-[3.75rem] border-l-2 border-[var(--color-ink)] pl-3">
          <ol className="space-y-1.5">
            {item.queue.map((c, i) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink)]">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center bg-[var(--color-ink)] text-[0.6rem] font-bold text-[var(--color-paper)]"
                  title={i === 0 ? "has it" : `waitlist #${i}`}
                >
                  {i + 1}
                </span>
                <span className="font-[family-name:var(--font-anton)] text-sm">{c.name}</span>
                {c.contact ? <span className="text-[var(--color-fog)]">· {c.contact}</span> : null}
                {c.amountCents ? (
                  <span className="font-bold">· {formatPrice(c.amountCents, item.currency)}</span>
                ) : null}
                {c.source === "offer" ? (
                  <span className="text-[0.6rem] uppercase tracking-[0.14em] text-[var(--color-cobalt)]">offer</span>
                ) : null}
                <span className="text-[0.6rem] uppercase tracking-[0.12em] text-[var(--color-fog)]">
                  {relativeTime(c.at)}
                </span>
                {c.note ? (
                  <span className="basis-full pl-7 italic text-[var(--color-fog)]">&ldquo;{c.note}&rdquo;</span>
                ) : null}
                {!finalised ? (
                  <form action={bumpClaimAction} className="ml-auto">
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="claimId" value={c.id} />
                    <button
                      className="border border-[var(--color-tomato)] px-1.5 py-0.5 text-[0.58rem] font-bold uppercase text-[var(--color-tomato)] hover:bg-[var(--color-tomato)] hover:text-white"
                      title={i === 0 ? "drop them, next person moves up" : "remove from waitlist"}
                    >
                      {i === 0 ? "fell through →" : "drop"}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ol>

          {!finalised ? (
            <div className="mt-2 flex gap-2">
              <form action={finalizeItemAction}>
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="outcome" value={item.type === "SELL" ? "SOLD" : "GIVEN"} />
                <button className="bg-[var(--color-acid)] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--color-ink)]">
                  {item.type === "SELL" ? "mark sold" : "mark given"} → {item.queue[0].name}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
