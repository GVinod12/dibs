import type { Metadata } from "next";
import { getCloset, getClosetStats, listItems, getCategoriesInUse, type ItemFilter } from "@/lib/repo";
import { CATEGORIES, type Category, type ItemType } from "@/lib/constants";
import { ItemCard } from "@/components/item/ItemCard";
import { FilterBar } from "@/components/closet/FilterBar";
import { Sticker } from "@/components/collage";
import { Decor } from "@/components/stickers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/closet/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const closet = await getCloset(slug);
  return { title: closet ? `${closet.title} — the closet` : "Closet" };
}

function coerceType(v?: string): ItemFilter["type"] {
  return v === "GIFT" || v === "SELL" ? (v as ItemType) : "ALL";
}
function coerceCategory(v?: string): ItemFilter["category"] {
  return CATEGORIES.includes(v as Category) ? (v as Category) : "ALL";
}
function coerceSort(v?: string): ItemFilter["sort"] {
  return v === "newest" || v === "price-asc" || v === "price-desc" ? v : "curated";
}

export default async function ClosetPage({ params, searchParams }: PageProps<"/closet/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const first = (x: string | string[] | undefined) => (Array.isArray(x) ? x[0] : x);

  const filter: ItemFilter = {
    type: coerceType(first(sp.type)),
    category: coerceCategory(first(sp.category)),
    sort: coerceSort(first(sp.sort)),
  };

  const [closet, stats, items, categories] = await Promise.all([
    getCloset(slug),
    getClosetStats(slug),
    listItems(slug, filter),
    getCategoriesInUse(slug),
  ]);
  if (!closet) return null;

  const orderedCats = CATEGORIES.filter((c) => categories.includes(c));

  return (
    <div className="paper-grid">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <header className="relative mb-6">
          <p className="label text-[0.7rem] text-[var(--color-fog)]">
            {stats.pieces} pieces · {stats.available} still up for dibs
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-anton)] text-[18vw] leading-[0.8] tracking-tight text-[var(--color-ink)] sm:text-[7rem]">
            THE CLOSET
          </h1>
          <p className="mt-3 max-w-lg font-[family-name:var(--font-instrument-serif)] text-xl italic leading-snug text-[var(--color-ink)] sm:text-2xl">
            {closet.intro}
          </p>
          <Decor className="absolute -right-1 top-0 hidden sm:block">
            <span className="text-5xl text-[var(--color-yellow)]">★</span>
          </Decor>
        </header>

        <FilterBar
          basePath={`/closet/${slug}`}
          categories={orderedCats}
          current={{
            type: String(filter.type),
            category: String(filter.category),
            sort: String(filter.sort),
          }}
        />

        {items.length === 0 ? (
          <p className="py-24 text-center font-[family-name:var(--font-instrument-serif)] text-2xl italic text-[var(--color-fog)]">
            Nothing here matches that. Loosen up a little.
          </p>
        ) : (
          <div className="mt-10 gap-x-6 gap-y-12 [column-fill:_balance] sm:columns-2 lg:columns-3 xl:columns-4">
            {items.map((item, i) => (
              <div key={item.id} className="mb-12 break-inside-avoid">
                <ItemCard item={item} closetSlug={slug} priority={i < 4} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 flex flex-wrap items-center gap-3">
          <Sticker tone="pink" seed="closet-a">
            {stats.available} available
          </Sticker>
          <Sticker tone="cobalt" seed="closet-b">
            {stats.claimed} spoken for
          </Sticker>
          {stats.looks > 0 ? (
            <Sticker tone="acid" seed="closet-c">
              {stats.looks} looks
            </Sticker>
          ) : null}
        </div>
      </div>
    </div>
  );
}
