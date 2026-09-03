import type { Metadata } from "next";
import Link from "next/link";
import { getPrimaryCloset } from "@/lib/repo";
import { MarqueeBar, Sticker } from "@/components/collage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How DIBS works",
  description: "The idea behind DIBS — a shareable closet for gifting and selling clothes to friends before a move.",
};

export default async function AboutPage() {
  const closet = await getPrimaryCloset();
  return (
    <div className="min-h-dvh">
      <header className="on-dark flex h-16 items-center justify-between bg-[var(--color-ink)] px-4 text-[var(--color-paper)] sm:px-7">
        <Link href="/" className="font-[family-name:var(--font-anton)] text-xl sm:text-2xl">
          DIBS<span className="text-[var(--color-pink)]">.</span>
        </Link>
        <Link href={`/closet/${closet.slug}`} className="text-[0.7rem] font-bold uppercase tracking-[0.2em] hover:text-[var(--color-acid)]">
          the closet →
        </Link>
      </header>

      <div className="paper-grid">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <h1 className="font-[family-name:var(--font-anton)] text-5xl text-[var(--color-ink)] sm:text-7xl">
            WHAT IS
            <br />
            DIBS?
          </h1>
          <p className="mt-6 font-[family-name:var(--font-instrument-serif)] text-2xl italic normal-case leading-snug text-[var(--color-ink)]">
            A closet you can share with a link. Friends browse the pieces you&rsquo;re parting with and call dibs on
            what they want — instead of forty messages in a group chat and someone always missing out.
          </p>

          <div className="mt-10 space-y-6 text-[0.95rem] leading-relaxed text-[var(--color-ink)]">
            <p>
              <strong className="font-[family-name:var(--font-anton)] text-lg">GIFT</strong> — free pieces. A friend
              types their name, it&rsquo;s theirs, done. First dibs wins.
            </p>
            <p>
              <strong className="font-[family-name:var(--font-anton)] text-lg">SELL</strong> — the designer bits, the
              things worth something. There&rsquo;s a price; a friend can take it at asking or make an offer. You decide.
              No bidding wars.
            </p>
            <p>
              AI helps catalogue each piece from a photo — category, colour, a description in your voice, a suggested
              resale range. You review and edit everything before it goes live. Prices are estimates, not valuations.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            <Sticker tone="lilac" seed="a1">no accounts</Sticker>
            <Sticker tone="acid" seed="a2">no app</Sticker>
            <Sticker tone="pink" seed="a3">no group chat</Sticker>
          </div>

          <p className="mt-10 font-[family-name:var(--font-caveat)] text-xl text-[var(--color-fog)]">
            a portfolio piece — product thinking, creative direction, UX, AI, and Claude Code, in one small thing.
          </p>

          <Link
            href={`/closet/${closet.slug}`}
            className="mt-6 inline-block bg-[var(--color-pink)] px-6 py-3 font-[family-name:var(--font-anton)] text-xl uppercase text-white shadow-ink"
          >
            go see it →
          </Link>
        </div>
      </div>
      <MarqueeBar tone="ink" items={["FIRST DIBS WINS", "NO BIDDING WARS", "EVERYTHING MUST GO"]} />
    </div>
  );
}
