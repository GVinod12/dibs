"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { StickerSwitch } from "@/components/stickers";

type Props = {
  slug: string;
  friends: number;
  /** dark chrome sits on light pages; on dark pages we still keep it black */
  compact?: boolean;
};

/**
 * The chrome. From DIBS.dc.html: always ink-black, always fixed, never rotates.
 * Active section carries an acid-green underline.
 */
export function Nav({ slug, friends, compact = false }: Props) {
  const pathname = usePathname();
  const base = `/closet/${slug}`;
  const links = [
    { href: `${base}/looks`, label: "LOOKS" },
    { href: base, label: "CLOSET", exact: true },
    { href: `${base}/dibs`, label: "DIBS" },
  ];

  return (
    <header
      className={cn(
        "on-dark sticky top-0 z-50 flex items-center justify-between gap-4 bg-[var(--color-ink)] px-4 text-[var(--color-paper)] sm:px-7",
        compact ? "h-14" : "h-16",
      )}
    >
      <Link href="/" className="shrink-0 font-[family-name:var(--font-anton)] text-xl tracking-[0.02em] text-[var(--color-paper)] hover:text-[var(--color-yellow)] sm:text-2xl">
        DIBS<span className="text-[var(--color-pink)]">.</span>
      </Link>

      <nav className="flex items-center gap-4 text-[0.7rem] font-bold tracking-[0.2em] sm:gap-7 sm:text-xs">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "pb-0.5 text-[var(--color-paper)] transition-colors hover:text-[var(--color-acid)]",
                active && "border-b-2 border-[var(--color-acid)] text-[var(--color-acid)]",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden shrink-0 items-center gap-4 md:flex">
        <StickerSwitch className="text-[var(--color-fog)]" />
        <span className="hidden font-[family-name:var(--font-caveat)] text-lg text-[var(--color-yellow)] lg:inline">
          {friends > 0 ? `only for you ${friends} ♡` : "only for you ♡"}
        </span>
      </div>
    </header>
  );
}
