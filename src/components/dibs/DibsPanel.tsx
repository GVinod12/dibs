"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { Item } from "@/lib/db/types";
import { formatPrice } from "@/lib/format";
import { firstName } from "@/lib/format";
import { callDibsAction, makeOfferAction, type DibsState, type OfferState } from "@/app/actions";
import { Stamp, Scrawl } from "@/components/collage";
import { Confetti } from "./Confetti";
import { cn } from "@/lib/cn";

type Props = {
  item: Item;
  closetSlug: string;
  ownerName: string;
};

const fieldCls =
  "w-full border-2 border-[var(--color-ink)] bg-white px-3 py-2.5 font-[family-name:var(--font-space-grotesk)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-fog)] focus-visible:outline-[var(--color-cobalt)]";
const labelCls = "block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--color-fog)]";

export function DibsPanel({ item, closetSlug, ownerName }: Props) {
  if (item.status === "SOLD" || item.status === "GIVEN") {
    return <ClosedPanel item={item} />;
  }
  return item.type === "GIFT" ? (
    <GiftPanel item={item} closetSlug={closetSlug} ownerName={ownerName} />
  ) : (
    <SellPanel item={item} closetSlug={closetSlug} ownerName={ownerName} />
  );
}

/* ---------- GIFT ---------- */

function GiftPanel({ item, closetSlug, ownerName }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<DibsState, FormData>(callDibsAction, {
    status: "idle",
  });

  if (state.status === "claimed") {
    return <DibsMoment itemName={state.itemName} claimant={state.claimant} ownerName={ownerName} />;
  }
  if (item.status === "DIBSED") {
    return <DibsedPanel item={item} ownerName={ownerName} />;
  }

  return (
    <div className="border-2 border-[var(--color-ink)] bg-white p-5 shadow-ink-sm">
      <p className={labelCls}>this one&rsquo;s a gift</p>
      {!open ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 w-full bg-[var(--color-acid)] px-6 py-4 text-center font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide text-[var(--color-ink)] shadow-ink-sm transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
          >
            Call dibs →
          </button>
          <Scrawl seed="gift-note" className="mt-3 block" size="md">
            first come, first served. i don&rsquo;t do bidding wars.
          </Scrawl>
        </>
      ) : (
        <form action={formAction} className="mt-3 space-y-3">
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="closetSlug" value={closetSlug} />
          <input type="hidden" name="itemSlug" value={item.slug} />
          <div>
            <label className={labelCls} htmlFor="dibs-name">
              your name
            </label>
            <input id="dibs-name" name="name" required autoFocus className={fieldCls} placeholder="who&rsquo;s claiming it" />
          </div>
          <div>
            <label className={labelCls} htmlFor="dibs-note">
              a note for {firstName(ownerName)} <span className="normal-case">(optional)</span>
            </label>
            <input id="dibs-note" name="note" className={fieldCls} placeholder="i&rsquo;ll pick it up saturday" />
          </div>
          {state.status === "error" ? (
            <p className="border-2 border-[var(--color-tomato)] bg-[var(--color-tomato)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-tomato)]">
              {state.message}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 bg-[var(--color-ink)] px-4 py-3 font-[family-name:var(--font-anton)] text-xl uppercase text-[var(--color-acid)] disabled:opacity-60"
            >
              {pending ? "claiming…" : "it’s mine →"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border-2 border-[var(--color-ink)] px-4 py-3 text-sm font-bold uppercase tracking-wide"
            >
              back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ---------- SELL ---------- */

function SellPanel({ item, closetSlug, ownerName }: Props) {
  const [mode, setMode] = useState<null | "asking" | "offer">(null);
  const [state, formAction, pending] = useActionState<OfferState, FormData>(makeOfferAction, {
    status: "idle",
  });

  if (state.status !== "sent" && item.status === "DIBSED") {
    return <DibsedPanel item={item} ownerName={ownerName} />;
  }

  if (state.status === "sent") {
    return (
      <div className="border-2 border-[var(--color-ink)] bg-[var(--color-acid)] p-6 text-center shadow-ink-sm">
        <Stamp color="var(--color-ink)" seed="offer-sent" animateIn size="md">
          offer in ♡
        </Stamp>
        <p className="mt-4 font-[family-name:var(--font-instrument-serif)] text-xl italic text-[var(--color-ink)]">
          {state.asking
            ? `${firstName(ownerName)} will confirm and message you.`
            : `${firstName(ownerName)} will get back to you on your offer.`}
        </p>
        <Scrawl seed="offer-note" color="var(--color-cobalt)" className="mt-2 block">
          no bidding wars. it&rsquo;s a closet, not an auction house.
        </Scrawl>
      </div>
    );
  }

  return (
    <div className="border-2 border-[var(--color-ink)] bg-white p-5 shadow-ink-sm">
      <div className="flex items-baseline justify-between">
        <p className={labelCls}>for sale</p>
        <p className="font-[family-name:var(--font-anton)] text-3xl text-[var(--color-ink)]">
          {formatPrice(item.priceCents, item.currency)}
        </p>
      </div>

      {mode === null ? (
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => setMode("asking")}
            className="w-full bg-[var(--color-pink)] px-5 py-3.5 text-center font-[family-name:var(--font-anton)] text-xl uppercase text-white shadow-ink-sm transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
          >
            Call dibs at {formatPrice(item.priceCents, item.currency)} →
          </button>
          <button
            type="button"
            onClick={() => setMode("offer")}
            className="w-full border-2 border-[var(--color-ink)] px-5 py-3 text-center font-[family-name:var(--font-anton)] text-lg uppercase text-[var(--color-ink)]"
          >
            Make an offer →
          </button>
          {item.aiPriceLowCents ? (
            <p className="pt-1 text-[0.68rem] text-[var(--color-fog)]">
              AI reckoned {formatPrice(item.aiPriceLowCents, item.currency)}–
              {formatPrice(item.aiPriceHighCents, item.currency)} — an estimate, not gospel.
            </p>
          ) : null}
        </div>
      ) : (
        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="closetSlug" value={closetSlug} />
          <input type="hidden" name="itemSlug" value={item.slug} />
          <input type="hidden" name="mode" value={mode} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="offer-name">
                name
              </label>
              <input id="offer-name" name="name" required autoFocus className={fieldCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="offer-contact">
                reach you at
              </label>
              <input id="offer-contact" name="contact" required className={fieldCls} placeholder="@handle / number" />
            </div>
          </div>
          {mode === "offer" ? (
            <div>
              <label className={labelCls} htmlFor="offer-amount">
                your offer
              </label>
              <input
                id="offer-amount"
                name="amount"
                inputMode="decimal"
                required
                className={fieldCls}
                placeholder={`under ${formatPrice(item.priceCents, item.currency)}, be reasonable`}
              />
            </div>
          ) : null}
          <div>
            <label className={labelCls} htmlFor="offer-message">
              message <span className="normal-case">(optional)</span>
            </label>
            <textarea id="offer-message" name="message" rows={2} className={cn(fieldCls, "resize-none")} />
          </div>
          {state.status === "error" ? (
            <p className="border-2 border-[var(--color-tomato)] bg-[var(--color-tomato)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-tomato)]">
              {state.message}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 bg-[var(--color-ink)] px-4 py-3 font-[family-name:var(--font-anton)] text-xl uppercase text-[var(--color-acid)] disabled:opacity-60"
            >
              {pending ? "sending…" : mode === "asking" ? "send it →" : "make offer →"}
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="border-2 border-[var(--color-ink)] px-4 py-3 text-sm font-bold uppercase tracking-wide"
            >
              back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ---------- states ---------- */

function DibsedPanel({ item, ownerName }: { item: Item; ownerName: string }) {
  return (
    <div className="relative border-2 border-[var(--color-ink)] bg-[var(--color-pink)]/12 p-6 text-center shadow-ink-sm">
      <Stamp color="var(--color-pink)" seed={item.id + "d"} size="md">
        dibsed ♡
      </Stamp>
      <p className="mt-4 font-[family-name:var(--font-instrument-serif)] text-xl italic text-[var(--color-ink)]">
        {item.claimantName ? `${item.claimantName} got there first.` : "Someone got there first."}
      </p>
      {item.claimantNote ? (
        <Scrawl seed={item.id + "n"} className="mt-1 block">
          &ldquo;{item.claimantNote}&rdquo;
        </Scrawl>
      ) : null}
      <p className="mt-3 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-fog)]">
        keep browsing — {firstName(ownerName)} has other things
      </p>
    </div>
  );
}

function ClosedPanel({ item }: { item: Item }) {
  return (
    <div className="border-2 border-[var(--color-ink)] bg-[var(--color-tomato)]/12 p-6 text-center shadow-ink-sm">
      <Stamp color="var(--color-tomato)" seed={item.id + "g"} size="sm">
        {item.status === "SOLD" ? "sold" : "gone to a good home"}
      </Stamp>
      <p className="mt-3 font-[family-name:var(--font-instrument-serif)] text-lg italic text-[var(--color-ink)]">
        This one&rsquo;s off to its new life.
      </p>
    </div>
  );
}

function DibsMoment({
  itemName,
  claimant,
  ownerName,
}: {
  itemName: string;
  claimant: string;
  ownerName: string;
}) {
  return (
    <div className="relative overflow-hidden border-2 border-[var(--color-ink)] bg-[var(--color-acid)] p-6 text-center shadow-ink">
      <Confetti />
      <p className="font-[family-name:var(--font-anton)] text-4xl uppercase leading-[0.85] text-[var(--color-ink)] sm:text-5xl">
        it&rsquo;s
        <br />
        yours
      </p>
      <div className="mt-4 flex justify-center">
        <Stamp color="var(--color-tomato)" seed="moment" animateIn size="md">
          dibsed ♡
        </Stamp>
      </div>
      <p className="mt-4 font-[family-name:var(--font-instrument-serif)] text-lg italic text-[var(--color-ink)]">
        {claimant}, the <strong className="not-italic">{itemName}</strong> is yours.
      </p>
      <Scrawl seed="moment-note" color="var(--color-ink)" className="mt-1 block" size="lg">
        i&rsquo;ll bring it saturday. wear it badly.
      </Scrawl>
      <div className="mt-5 flex flex-wrap justify-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.16em]">
        <span className="bg-[var(--color-ink)] px-3 py-2 text-[var(--color-acid)]">
          message {firstName(ownerName)} →
        </span>
        <Link href="../" className="border-2 border-[var(--color-ink)] px-3 py-2 text-[var(--color-ink)]">
          back to the closet ♡
        </Link>
      </div>
    </div>
  );
}
