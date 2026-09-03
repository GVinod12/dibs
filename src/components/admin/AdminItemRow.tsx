import Link from "next/link";
import type { Item } from "@/lib/db/types";
import { formatPrice } from "@/lib/format";
import { StatusLabel } from "@/components/collage";
import { setStatusAction, deleteItemAction } from "@/app/admin/actions";
import { ITEM_STATUSES } from "@/lib/constants";

export function AdminItemRow({ item, closetSlug }: { item: Item; closetSlug: string }) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden border-2 border-[var(--color-ink)]">
        {item.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
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
          {item.claimantName ? <span>· {item.claimantName}</span> : null}
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
    </li>
  );
}
