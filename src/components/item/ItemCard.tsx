import Link from "next/link";
import type { Item } from "@/lib/db/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Seeded } from "@/lib/seededRandom";
import { PhotoFrame, StatusLabel, type FrameTreatment } from "@/components/collage";

const TREATMENTS: FrameTreatment[] = [
  "shadow-ink",
  "border-acid",
  "shadow-pink",
  "border-cobalt",
  "shadow-cobalt",
  "border-yellow",
  "shadow-tomato",
  "border-lilac",
];

type Props = {
  item: Item;
  closetSlug: string;
  priority?: boolean;
  className?: string;
};

export function ItemCard({ item, closetSlug, priority = false, className }: Props) {
  const rnd = new Seeded(item.id);
  const treatment = rnd.pick(TREATMENTS);
  const photo = item.photos[0];
  const gone = item.status === "SOLD" || item.status === "GIVEN";

  return (
    <Link
      href={`/closet/${closetSlug}/item/${item.slug}`}
      className={cn(
        "group relative block focus-visible:outline-offset-8",
        gone && "opacity-70",
        className,
      )}
    >
      <div className="relative transition-transform duration-200 ease-out group-hover:-translate-y-1 group-hover:rotate-0 motion-reduce:transform-none">
        {photo ? (
          <PhotoFrame
            src={photo.url}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            treatment={treatment}
            seed={item.id}
            tilt={2.5}
            priority={priority}
            sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 22vw"
          />
        ) : (
          <div className="aspect-[4/5] bg-[var(--color-paper-line)] shadow-ink" />
        )}

        <div className="pointer-events-none absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5">
          <StatusLabel status={item.status} outlined />
          {item.type === "SELL" && item.status === "AVAILABLE" ? (
            <StatusLabel type="SELL" outlined />
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-anton)] text-xl leading-[0.9] tracking-tight text-[var(--color-ink)] [overflow-wrap:anywhere] sm:text-2xl">
            {item.name}
          </h3>
          <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--color-fog)]">
            {[item.brand, item.size].filter(Boolean).join(" · ") || item.category}
          </p>
        </div>
        <span className="shrink-0 whitespace-nowrap font-[family-name:var(--font-anton)] text-lg text-[var(--color-ink)]">
          {item.type === "SELL" ? formatPrice(item.priceCents, item.currency) : "GIFT"}
        </span>
      </div>

      {item.hook ? (
        <p className="mt-1.5 font-[family-name:var(--font-caveat)] text-lg leading-tight text-[var(--color-cobalt)]">
          {item.hook}
        </p>
      ) : null}
    </Link>
  );
}
