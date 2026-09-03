import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/constants";

type Props = {
  basePath: string;
  categories: Category[];
  current: { type: string; category: string; sort: string };
};

function chipHref(basePath: string, current: Props["current"], patch: Partial<Props["current"]>) {
  const next = { ...current, ...patch };
  const qs = new URLSearchParams();
  if (next.type && next.type !== "ALL") qs.set("type", next.type);
  if (next.category && next.category !== "ALL") qs.set("category", next.category);
  if (next.sort && next.sort !== "curated") qs.set("sort", next.sort);
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

const SORTS = [
  { key: "curated", label: "how much i'll miss it" },
  { key: "newest", label: "just added" },
  { key: "price-asc", label: "price ↑" },
  { key: "price-desc", label: "price ↓" },
];

export function FilterBar({ basePath, categories, current }: Props) {
  const typeChips = [
    { key: "ALL", label: "Everything" },
    { key: "GIFT", label: "Gifts" },
    { key: "SELL", label: "For sale" },
  ];

  return (
    <div className="flex flex-col gap-4 border-y-2 border-[var(--color-ink)] py-4">
      <div className="flex flex-wrap items-center gap-2">
        {typeChips.map((c) => {
          const active = current.type === c.key;
          return (
            <Link
              key={c.key}
              href={chipHref(basePath, current, { type: c.key })}
              className={cn(
                "border-2 border-[var(--color-ink)] px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] transition-colors",
                active
                  ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-yellow)]",
              )}
            >
              {c.label}
            </Link>
          );
        })}
        <span className="mx-1 h-5 w-px bg-[var(--color-ink)]" aria-hidden />
        {categories.map((cat) => {
          const active = current.category === cat;
          return (
            <Link
              key={cat}
              href={chipHref(basePath, current, { category: active ? "ALL" : cat })}
              className={cn(
                "border-2 border-[var(--color-ink)] px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] transition-colors",
                active
                  ? "bg-[var(--color-pink)] text-white"
                  : "text-[var(--color-ink)] hover:bg-[var(--color-lilac)]",
              )}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-caveat)] text-lg text-[var(--color-ink)]">
        <span className="text-[var(--color-fog)]">sorted by:</span>
        {SORTS.map((s, i) => {
          const active = current.sort === s.key;
          return (
            <span key={s.key} className="flex items-center gap-2">
              <Link
                href={chipHref(basePath, current, { sort: s.key })}
                className={cn(
                  "hover:text-[var(--color-pink)]",
                  active ? "text-[var(--color-pink)] underline decoration-2 underline-offset-4" : "text-[var(--color-cobalt)]",
                )}
              >
                {s.label}
              </Link>
              {i < SORTS.length - 1 ? <span className="text-[var(--color-fog)]">/</span> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}
