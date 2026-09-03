import Link from "next/link";
import type { OfferWithItem } from "@/lib/repo";
import { formatPrice, relativeTime } from "@/lib/format";
import { respondOfferAction } from "@/app/admin/actions";

export function OfferRow({ offer }: { offer: OfferWithItem }) {
  const currency = offer.item?.currency ?? "EUR";
  return (
    <li className="border-2 border-[var(--color-cobalt)] bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-[family-name:var(--font-anton)] text-lg text-[var(--color-ink)]">{offer.name}</span>
        <span className="text-sm text-[var(--color-ink)]">
          {offer.amountCents ? (
            <>
              offered <strong>{formatPrice(offer.amountCents, currency)}</strong>
            </>
          ) : (
            <>
              wants it at <strong>asking ({formatPrice(offer.item?.priceCents, currency)})</strong>
            </>
          )}{" "}
          on
        </span>
        {offer.item ? (
          <Link
            href={`/admin/items/${offer.item.id}`}
            className="font-[family-name:var(--font-anton)] text-base text-[var(--color-ink)] hover:text-[var(--color-pink)]"
          >
            {offer.item.name}
          </Link>
        ) : (
          <span className="text-[var(--color-fog)]">deleted item</span>
        )}
        <span className="ml-auto text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-fog)]">
          {relativeTime(offer.createdAt)}
        </span>
      </div>

      <p className="mt-1.5 text-sm text-[var(--color-ink)]">
        <span className="text-[var(--color-fog)]">reach at</span> {offer.contact}
      </p>
      {offer.message ? (
        <p className="mt-1 text-sm italic text-[var(--color-ink)]">&ldquo;{offer.message}&rdquo;</p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <form action={respondOfferAction}>
          <input type="hidden" name="offerId" value={offer.id} />
          <input type="hidden" name="decision" value="ACCEPTED" />
          <button className="bg-[var(--color-acid)] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--color-ink)]">
            accept → mark dibsed
          </button>
        </form>
        <form action={respondOfferAction}>
          <input type="hidden" name="offerId" value={offer.id} />
          <input type="hidden" name="decision" value="DECLINED" />
          <button className="border-2 border-[var(--color-ink)] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--color-ink)]">
            decline
          </button>
        </form>
      </div>
    </li>
  );
}
