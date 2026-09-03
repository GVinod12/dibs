import Link from "next/link";
import { MarqueeBar } from "@/components/collage";

export function SiteFooter({ closetTitle, ownerName }: { closetTitle: string; ownerName: string }) {
  return (
    <footer className="on-dark mt-16 bg-[var(--color-ink)] text-[var(--color-paper)]">
      <MarqueeBar
        tone="ink"
        items={[
          "FIRST DIBS WINS",
          "NO BIDDING WARS",
          "EVERYTHING MUST GO",
          "WEAR IT BADLY",
          "SOME PRESSURE",
        ]}
        className="border-y border-[var(--color-ink-hair)]"
      />
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-[family-name:var(--font-anton)] text-3xl">
            DIBS<span className="text-[var(--color-pink)]">.</span>
          </div>
          <p className="mt-2 max-w-xs font-[family-name:var(--font-instrument-serif)] text-lg italic text-[var(--color-fog-dark)]">
            {closetTitle} — {ownerName}&rsquo;s closet, temporarily available to the public.
          </p>
        </div>
        <div className="flex gap-6 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--color-fog)]">
          <Link href="/" className="hover:text-[var(--color-acid)]">
            Home
          </Link>
          <Link href="/about" className="hover:text-[var(--color-acid)]">
            How it works
          </Link>
          <Link href="/admin" className="hover:text-[var(--color-acid)]">
            Owner
          </Link>
        </div>
      </div>
      <p className="px-6 pb-8 font-[family-name:var(--font-caveat)] text-lg text-[var(--color-fog)]">
        built with claude code · a portfolio piece · not a real shop (yet)
      </p>
    </footer>
  );
}
