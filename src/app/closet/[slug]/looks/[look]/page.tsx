import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloset, getLookBySlug, getLookItems, listLooks } from "@/lib/repo";
import { formatPrice } from "@/lib/format";
import { PhotoFrame, StatusLabel, Scrawl, Sticker } from "@/components/collage";
import { Decor } from "@/components/stickers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/closet/[slug]/looks/[look]">): Promise<Metadata> {
  const { slug, look } = await params;
  const l = await getLookBySlug(slug, look);
  return { title: l ? l.title : "Look" };
}

export default async function LookPage({ params }: PageProps<"/closet/[slug]/looks/[look]">) {
  const { slug, look: lookSlug } = await params;
  const [closet, look, looks] = await Promise.all([
    getCloset(slug),
    getLookBySlug(slug, lookSlug),
    listLooks(slug),
  ]);
  if (!closet || !look) notFound();
  const items = await getLookItems(look);
  const idx = looks.findIndex((l) => l.id === look.id);
  const next = looks[(idx + 1) % looks.length];

  return (
    <div className="on-dark min-h-dvh bg-[var(--color-cobalt)] text-[var(--color-paper)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
        {/* photo */}
        <div className="relative">
          <PhotoFrame
            src={look.photo.url}
            alt={look.photo.alt}
            width={look.photo.width}
            height={look.photo.height}
            treatment="shadow-ink"
            seed={look.id}
            tilt={-2}
            priority
            sizes="(max-width: 1024px) 92vw, 46vw"
          />
          <Decor className="absolute -left-3 -top-3">
            <span className="text-4xl text-[var(--color-pink)]">★</span>
          </Decor>
        </div>

        {/* detail */}
        <div className="lg:pt-6">
          <Link
            href={`/closet/${slug}/looks`}
            className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--color-paper)]/70 hover:text-[var(--color-acid)]"
          >
            ← lookbook
          </Link>
          <h1 className="mt-3 font-[family-name:var(--font-anton)] text-[13vw] leading-[0.82] text-[var(--color-yellow)] sm:text-6xl">
            {look.title}
          </h1>
          {look.caption ? (
            <p className="mt-4 font-[family-name:var(--font-instrument-serif)] text-2xl italic normal-case leading-snug text-[var(--color-paper)]">
              {look.caption}
            </p>
          ) : null}

          {items.length ? (
            <div className="mt-8">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--color-paper)]/70">
                in this look — call dibs
              </p>
              <ul className="mt-4 space-y-3">
                {items.map((it) => (
                  <li key={it.id}>
                    <Link
                      href={`/closet/${slug}/item/${it.slug}`}
                      className="group flex items-center gap-4 border-2 border-[var(--color-paper)] bg-[var(--color-cobalt)] p-2 transition-colors hover:bg-[var(--color-ink)]"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-[var(--color-paper)]">
                        {it.photos[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.photos[0].url} alt={it.photos[0].alt} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-[family-name:var(--font-anton)] text-lg text-[var(--color-paper)]">
                          {it.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <StatusLabel status={it.status} />
                          <span className="text-xs font-bold text-[var(--color-paper)]">
                            {it.type === "SELL" ? formatPrice(it.priceCents, it.currency) : "GIFT"}
                          </span>
                        </div>
                      </div>
                      <span className="pr-2 font-[family-name:var(--font-anton)] text-xl text-[var(--color-acid)]">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Scrawl seed="nolink" color="var(--color-yellow)" className="mt-8 block">
              these exact pieces aren&rsquo;t in the closet — but the vibe is.
            </Scrawl>
          )}

          <Link
            href={`/closet/${slug}/looks/${next.slug}`}
            className="mt-10 flex items-center justify-between border-t-2 border-[var(--color-paper)]/40 pt-4"
          >
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--color-paper)]/70">
              next look
            </span>
            <span className="font-[family-name:var(--font-anton)] text-xl text-[var(--color-acid)]">
              {next.title} →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
