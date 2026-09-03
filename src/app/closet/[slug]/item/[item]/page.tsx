import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloset, getItemBySlug, listItems } from "@/lib/repo";
import { formatPrice } from "@/lib/format";
import { PhotoFrame, StatusLabel, Scrawl, Sticker } from "@/components/collage";
import { Decor } from "@/components/stickers";
import { DibsPanel } from "@/components/dibs/DibsPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/closet/[slug]/item/[item]">): Promise<Metadata> {
  const { slug, item } = await params;
  const it = await getItemBySlug(slug, item);
  if (!it) return { title: "Piece not found" };
  return {
    title: it.name,
    description: it.hook ?? it.description.slice(0, 150),
  };
}

export default async function ItemPage({ params }: PageProps<"/closet/[slug]/item/[item]">) {
  const { slug, item: itemSlug } = await params;
  const [closet, item, all] = await Promise.all([
    getCloset(slug),
    getItemBySlug(slug, itemSlug),
    listItems(slug, { sort: "curated" }),
  ]);
  if (!closet || !item) notFound();

  const idx = all.findIndex((i) => i.id === item.id);
  const next = all[(idx + 1) % all.length];
  const hero = item.photos[0];
  const secondary = item.photos[1];

  return (
    <div className="paper-grid min-h-dvh">
      {/* sub-bar */}
      <div className="flex items-center justify-between border-b-2 border-[var(--color-ink)] bg-[var(--color-paper)] px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--color-ink)] sm:px-6">
        <Link href={`/closet/${slug}`} className="font-[family-name:var(--font-anton)] text-sm tracking-normal hover:text-[var(--color-pink)]">
          ← closet
        </Link>
        <span className="text-[var(--color-fog)]">
          item {idx + 1} / {all.length}
        </span>
      </div>

      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,430px)_1fr] lg:gap-14">
        {/* photo column */}
        <div className="relative">
          {hero ? (
            <PhotoFrame
              src={hero.url}
              alt={hero.alt}
              width={hero.width}
              height={hero.height}
              treatment="shadow-tomato"
              seed={item.id}
              tilt={2}
              priority
              ratio={Math.min(1.15, Math.max(0.95, hero.width / hero.height))}
            />
          ) : null}

          {secondary ? (
            <div className="absolute -bottom-8 -right-4 w-2/5 sm:w-1/3">
              <PhotoFrame
                src={secondary.url}
                alt={secondary.alt}
                width={secondary.width}
                height={secondary.height}
                treatment="polaroid"
                seed={item.id + "b"}
                tilt={7}
                caption="on, out, once"
                sizes="30vw"
              />
            </div>
          ) : null}

          <Decor className="absolute -left-3 -top-3">
            <span className="text-4xl text-[var(--color-acid)]">✳</span>
          </Decor>
        </div>

        {/* detail column */}
        <div className="lg:pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusLabel status={item.status} outlined size="md" />
            <StatusLabel type={item.type} outlined size="md" />
            {item.queue.length > 1 && item.status === "DIBSED" ? (
              <span className="border-2 border-[var(--color-ink)] bg-[var(--color-lilac)] px-2 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--color-ink)]">
                {item.queue.length - 1} waiting
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[var(--color-fog)]">
            {[item.brand, item.size].filter(Boolean).join(" · ")}
          </p>
          <h1 className="mt-1.5 font-[family-name:var(--font-anton)] text-[13vw] leading-[0.82] tracking-tight text-[var(--color-ink)] [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">
            {item.name}
          </h1>

          {item.hook ? (
            <p className="mt-4 font-[family-name:var(--font-instrument-serif)] text-2xl italic leading-tight text-[var(--color-ink)]">
              {item.hook}
            </p>
          ) : null}

          <p className="mt-4 max-w-prose font-[family-name:var(--font-space-grotesk)] text-[0.95rem] leading-relaxed text-[var(--color-ink)]">
            {item.description}
          </p>

          <p className="mt-6 border-y-2 border-[var(--color-ink)] py-2.5 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[var(--color-ink)]">
            {[item.size, item.condition, item.color, item.brand].filter(Boolean).join(" · ")}
          </p>

          <div className="mt-6">
            <DibsPanel item={item} closetSlug={slug} ownerName={closet.ownerName} />
          </div>

          {item.story ? (
            <div className="mt-6 border-l-4 border-[var(--color-lilac)] pl-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--color-fog)]">the story</p>
              <p className="mt-1 font-[family-name:var(--font-instrument-serif)] text-lg italic leading-snug text-[var(--color-ink)]">
                {item.story}
              </p>
            </div>
          ) : null}

          {item.tags.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="border-[1.5px] border-[var(--color-ink)] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--color-ink)]"
                >
                  #{t}
                </span>
              ))}
            </div>
          ) : null}

          {item.aiGenerated ? (
            <p className="mt-5 font-[family-name:var(--font-caveat)] text-base text-[var(--color-fog)]">
              catalogued with a little help from AI · every word checked by {closet.ownerName.split(" ")[0]}
            </p>
          ) : null}
        </div>
      </div>

      {/* next */}
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Link
          href={`/closet/${slug}/item/${next.slug}`}
          className="group flex items-center justify-between border-t-2 border-[var(--color-ink)] pt-5"
        >
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--color-fog)]">next piece</span>
          <span className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-anton)] text-xl text-[var(--color-ink)] group-hover:text-[var(--color-pink)] sm:text-2xl">
              {next.name} →
            </span>
            <Sticker tone={next.type === "SELL" ? "cobalt" : "lilac"} seed={next.id}>
              {next.type === "SELL" ? formatPrice(next.priceCents, next.currency) : "gift"}
            </Sticker>
          </span>
        </Link>
      </div>
    </div>
  );
}
