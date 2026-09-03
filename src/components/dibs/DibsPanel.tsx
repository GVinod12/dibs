"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Item } from "@/lib/db/types";
import { formatPrice, firstName } from "@/lib/format";
import { MAX_DIBS_QUEUE, queueOrdinal } from "@/lib/constants";
import {
  callDibsAction,
  releaseDibsAction,
  makeOfferAction,
  type DibsState,
  type ReleaseState,
  type OfferState,
} from "@/app/actions";
import { Stamp, Scrawl } from "@/components/collage";
import { Confetti } from "./Confetti";
import { cn } from "@/lib/cn";

type Props = { item: Item; closetSlug: string; ownerName: string };

const field =
  "w-full border-2 border-[var(--color-ink)] bg-white px-3 py-2.5 font-[family-name:var(--font-space-grotesk)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-fog)]";
const labelCls = "block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--color-fog)]";
const errCls =
  "border-2 border-[var(--color-tomato)] bg-[var(--color-tomato)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-tomato)]";

/* ---------------- local memory of "I'm in this line" ---------------- */

type StoredClaim = { claimId: string; name: string };
const LS_KEY = "dibs:claims";

function readClaims(): Record<string, StoredClaim> {
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeClaim(itemId: string, claim: StoredClaim | null) {
  try {
    const all = readClaims();
    if (claim) all[itemId] = claim;
    else delete all[itemId];
    window.localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/* =================================================================== */

export function DibsPanel({ item, closetSlug, ownerName }: Props) {
  const [mine, setMine] = useState<StoredClaim | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);

  const [dibs, dibsAction, dibsPending] = useActionState<DibsState, FormData>(callDibsAction, { status: "idle" });
  const [rel, relAction, relPending] = useActionState<ReleaseState, FormData>(releaseDibsAction, { status: "idle" });
  const [offer, offerAction, offerPending] = useActionState<OfferState, FormData>(makeOfferAction, { status: "idle" });

  // forget a stored claim that's no longer in the queue (e.g. owner removed it)
  useEffect(() => {
    const stored = readClaims()[item.id] ?? null;
    setMine(stored && item.queue.some((c) => c.id === stored.claimId) ? stored : null);
    if (stored && !item.queue.some((c) => c.id === stored.claimId)) writeClaim(item.id, null);
  }, [item.id, item.queue]);

  // on a fresh successful dibs, remember it + play the moment
  useEffect(() => {
    if (dibs.status === "in-line") {
      writeClaim(item.id, { claimId: dibs.claimId, name: dibs.claimant });
      setMine({ claimId: dibs.claimId, name: dibs.claimant });
      setCelebrate(true);
      setShowForm(false);
    }
  }, [dibs, item.id]);

  useEffect(() => {
    if (rel.status === "released") {
      writeClaim(item.id, null);
      setMine(null);
      setConfirmRelease(false);
    }
  }, [rel, item.id]);

  const dismissCelebrate = useCallback(() => setCelebrate(false), []);

  if (item.status === "SOLD" || item.status === "GIVEN") {
    return <ClosedPanel item={item} />;
  }

  const myPos = mine ? item.queue.findIndex((c) => c.id === mine.claimId) + 1 : 0;
  const price = formatPrice(item.priceCents, item.currency);

  /* ---- the moment, right after you call dibs ---- */
  if (celebrate && dibs.status === "in-line") {
    const holder = dibs.position === 1;
    return (
      <div
        className={cn(
          "relative overflow-hidden border-2 border-[var(--color-ink)] p-6 text-center shadow-ink",
          holder ? "bg-[var(--color-acid)]" : "bg-[var(--color-lilac)]",
        )}
      >
        {holder ? <Confetti /> : null}
        <p className="font-[family-name:var(--font-anton)] text-4xl uppercase leading-[0.85] text-[var(--color-ink)] sm:text-5xl">
          {holder ? (
            <>
              it&rsquo;s
              <br />
              yours
            </>
          ) : (
            <>
              {queueOrdinal(dibs.position)}
              <br />
              in line
            </>
          )}
        </p>
        <div className="mt-4 flex justify-center">
          <Stamp color={holder ? "var(--color-tomato)" : "var(--color-cobalt)"} seed="joined" animateIn size="md">
            {holder ? "dibsed ♡" : "on the list"}
          </Stamp>
        </div>
        <p className="mt-4 font-[family-name:var(--font-instrument-serif)] text-lg italic text-[var(--color-ink)]">
          {holder ? (
            <>
              {dibs.claimant}, the <strong className="not-italic">{dibs.itemName}</strong> is yours.{" "}
              {firstName(ownerName)} will be in touch.
            </>
          ) : (
            <>
              {dibs.claimant}, you&rsquo;re behind {item.queue[0]?.name}. If they pass, {firstName(ownerName)} messages
              you and it&rsquo;s yours.
            </>
          )}
        </p>
        <Scrawl seed="joined-note" color="var(--color-ink)" className="mt-2 block" size="md">
          {holder ? "i’ll bring it saturday. wear it badly." : "no need to hover. i’ll find you."}
        </Scrawl>
        <button
          type="button"
          onClick={dismissCelebrate}
          className="mt-5 bg-[var(--color-ink)] px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--color-acid)]"
        >
          got it →
        </button>
      </div>
    );
  }

  /* ---- your standing ticket ---- */
  if (mine && myPos > 0) {
    const holder = myPos === 1;
    const ahead = item.queue.slice(0, myPos - 1).map((c) => c.name);
    return (
      <div
        className={cn(
          "border-2 border-[var(--color-ink)] p-6 text-center shadow-ink-sm",
          holder ? "bg-[var(--color-acid)]" : "bg-[var(--color-lilac)]",
        )}
      >
        <Stamp color={holder ? "var(--color-tomato)" : "var(--color-cobalt)"} seed={mine.claimId} size="md">
          {holder ? "dibsed ♡" : `you're ${queueOrdinal(myPos)}`}
        </Stamp>
        <p className="mt-4 font-[family-name:var(--font-instrument-serif)] text-lg italic leading-snug text-[var(--color-ink)]">
          {holder ? (
            <>
              The <strong className="not-italic">{item.name}</strong> is yours — {firstName(ownerName)} will be in touch.
            </>
          ) : (
            <>
              You&rsquo;re behind {ahead.join(" and ")}. If they fall through, it&rsquo;s yours and{" "}
              {firstName(ownerName)} will message you.
            </>
          )}
        </p>

        <div className="mt-5">
          {!confirmRelease ? (
            <button
              type="button"
              onClick={() => setConfirmRelease(true)}
              className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--color-ink)] underline decoration-2 underline-offset-4 hover:text-[var(--color-tomato)]"
            >
              {holder ? "actually — I'll pass" : "drop out of the line"}
            </button>
          ) : (
            <form action={relAction} className="flex flex-col items-center gap-2">
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="claimId" value={mine.claimId} />
              <input type="hidden" name="closetSlug" value={closetSlug} />
              <input type="hidden" name="itemSlug" value={item.slug} />
              <p className="text-sm text-[var(--color-ink)]">
                {holder && item.queue.length > 1
                  ? `Sure? It passes to ${item.queue[1].name}.`
                  : "Sure? This gives up your spot."}
              </p>
              {rel.status === "error" ? <p className={errCls}>{rel.message}</p> : null}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={relPending}
                  className="bg-[var(--color-ink)] px-4 py-2 text-xs font-bold uppercase text-[var(--color-acid)] disabled:opacity-60"
                >
                  {relPending ? "…" : "yes, pass it on"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRelease(false)}
                  className="border-2 border-[var(--color-ink)] px-4 py-2 text-xs font-bold uppercase"
                >
                  keep it
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.16em]">
          <span className="bg-[var(--color-ink)] px-3 py-2 text-[var(--color-acid)]">message {firstName(ownerName)} →</span>
          <Link href={`/closet/${closetSlug}`} className="border-2 border-[var(--color-ink)] px-3 py-2 text-[var(--color-ink)]">
            keep browsing ♡
          </Link>
        </div>
      </div>
    );
  }

  /* ---- offer sent ---- */
  if (offer.status === "sent") {
    return (
      <div className="border-2 border-[var(--color-ink)] bg-[var(--color-acid)] p-6 text-center shadow-ink-sm">
        <Stamp color="var(--color-ink)" seed="offer-sent" animateIn size="md">
          offer in ♡
        </Stamp>
        <p className="mt-4 font-[family-name:var(--font-instrument-serif)] text-xl italic text-[var(--color-ink)]">
          {firstName(ownerName)} will get back to you.
        </p>
        <Scrawl seed="offer-note" color="var(--color-cobalt)" className="mt-2 block">
          no bidding wars. it&rsquo;s a closet, not an auction house.
        </Scrawl>
      </div>
    );
  }

  /* ---- join / waitlist ---- */
  const spotsLeft = MAX_DIBS_QUEUE - item.queue.length;
  const isFull = spotsLeft <= 0;
  const holderName = item.queue[0]?.name;

  return (
    <div className="border-2 border-[var(--color-ink)] bg-white p-5 shadow-ink-sm">
      {item.queue.length === 0 ? (
        <p className={labelCls}>{item.type === "GIFT" ? "this one's a gift" : `for sale — ${price}`}</p>
      ) : (
        <div>
          <p className={labelCls}>
            {holderName} called dibs
            {item.queue.length > 1 ? ` · ${item.queue.length - 1} more in line` : ""}
          </p>
          <p className="mt-1 font-[family-name:var(--font-instrument-serif)] text-lg italic text-[var(--color-ink)]">
            {isFull
              ? "The line's full — three people deep."
              : `Get in line — you'd be ${queueOrdinal(item.queue.length + 1)}. If someone ahead drops out, you move up.`}
          </p>
        </div>
      )}

      {!showForm && !showOffer ? (
        <div className="mt-3 space-y-2">
          {!isFull ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={cn(
                "w-full px-6 py-4 text-center font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide shadow-ink-sm transition-transform hover:-translate-y-0.5 motion-reduce:transform-none",
                item.queue.length === 0
                  ? "bg-[var(--color-acid)] text-[var(--color-ink)]"
                  : "bg-[var(--color-lilac)] text-[var(--color-ink)]",
              )}
            >
              {item.queue.length === 0
                ? item.type === "GIFT"
                  ? "Call dibs →"
                  : `Call dibs at ${price} →`
                : "Get in line →"}
            </button>
          ) : null}

          {item.type === "SELL" ? (
            <button
              type="button"
              onClick={() => setShowOffer(true)}
              className="w-full border-2 border-[var(--color-ink)] px-5 py-3 text-center font-[family-name:var(--font-anton)] text-lg uppercase text-[var(--color-ink)]"
            >
              Make an offer →
            </button>
          ) : null}

          {item.queue.length === 0 ? (
            <Scrawl seed={item.id + "n"} className="block pt-1">
              first come, first served — up to three deep, then the line closes.
            </Scrawl>
          ) : null}
          {item.aiPriceLowCents && item.type === "SELL" ? (
            <p className="pt-1 text-[0.68rem] text-[var(--color-fog)]">
              AI reckoned {formatPrice(item.aiPriceLowCents, item.currency)}–
              {formatPrice(item.aiPriceHighCents, item.currency)} — an estimate, not gospel.
            </p>
          ) : null}
        </div>
      ) : null}

      {showForm ? (
        <form action={dibsAction} className="mt-3 space-y-3">
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="closetSlug" value={closetSlug} />
          <input type="hidden" name="itemSlug" value={item.slug} />
          <input type="hidden" name="atAsking" value="yes" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="d-name">
                your name
              </label>
              <input id="d-name" name="name" required autoFocus className={field} />
            </div>
            <div>
              <label className={labelCls} htmlFor="d-contact">
                reach you at
              </label>
              <input id="d-contact" name="contact" required className={field} placeholder="@handle / number" />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="d-note">
              note for {firstName(ownerName)} <span className="normal-case">(optional)</span>
            </label>
            <input id="d-note" name="note" className={field} placeholder="i can pick it up saturday" />
          </div>
          {dibs.status === "error" ? <p className={errCls}>{dibs.message}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={dibsPending}
              className="flex-1 bg-[var(--color-ink)] px-4 py-3 font-[family-name:var(--font-anton)] text-xl uppercase text-[var(--color-acid)] disabled:opacity-60"
            >
              {dibsPending ? "…" : item.queue.length === 0 ? "it’s mine →" : "join the line →"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border-2 border-[var(--color-ink)] px-4 py-3 text-sm font-bold uppercase"
            >
              back
            </button>
          </div>
        </form>
      ) : null}

      {showOffer ? (
        <form action={offerAction} className="mt-3 space-y-3">
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="closetSlug" value={closetSlug} />
          <input type="hidden" name="itemSlug" value={item.slug} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="o-name">
                name
              </label>
              <input id="o-name" name="name" required autoFocus className={field} />
            </div>
            <div>
              <label className={labelCls} htmlFor="o-contact">
                reach you at
              </label>
              <input id="o-contact" name="contact" required className={field} placeholder="@handle / number" />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="o-amount">
              your offer
            </label>
            <input
              id="o-amount"
              name="amount"
              inputMode="decimal"
              required
              className={field}
              placeholder={`under ${price}, be reasonable`}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="o-msg">
              message <span className="normal-case">(optional)</span>
            </label>
            <textarea id="o-msg" name="message" rows={2} className={cn(field, "resize-none")} />
          </div>
          {offer.status === "error" ? <p className={errCls}>{offer.message}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={offerPending}
              className="flex-1 bg-[var(--color-ink)] px-4 py-3 font-[family-name:var(--font-anton)] text-xl uppercase text-[var(--color-acid)] disabled:opacity-60"
            >
              {offerPending ? "…" : "send offer →"}
            </button>
            <button
              type="button"
              onClick={() => setShowOffer(false)}
              className="border-2 border-[var(--color-ink)] px-4 py-3 text-sm font-bold uppercase"
            >
              back
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

/* ---------------- terminal state ---------------- */

function ClosedPanel({ item }: { item: Item }) {
  return (
    <div className="border-2 border-[var(--color-ink)] bg-[var(--color-tomato)]/12 p-6 text-center shadow-ink-sm">
      <Stamp color="var(--color-tomato)" seed={item.id + "g"} size="sm">
        {item.status === "SOLD" ? "sold" : "gone to a good home"}
      </Stamp>
      <p className="mt-3 font-[family-name:var(--font-instrument-serif)] text-lg italic text-[var(--color-ink)]">
        {item.queue[0] ? `${item.queue[0].name} has it now.` : "This one's off to its new life."}
      </p>
    </div>
  );
}
