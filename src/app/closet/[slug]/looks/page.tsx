import type { Metadata } from "next";
import Link from "next/link";
import { getCloset, listLooks } from "@/lib/repo";
import { PhotoFrame, Scrawl, type FrameTreatment } from "@/components/collage";
import { Decor } from "@/components/stickers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Lookbook" };

const TREATMENTS: FrameTreatment[] = ["shadow-ink", "border-yellow", "shadow-pink", "border-paper", "shadow-cobalt"];

export default async function LooksPage({ params }: PageProps<"/closet/[slug]/looks">) {
  const { slug } = await params;
  const [closet, looks] = await Promise.all([getCloset(slug), listLooks(slug)]);
  if (!closet) return null;

  return (
    <div className="on-dark min-h-dvh bg-[var(--color-cobalt)] text-[var(--color-paper)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <header className="relative">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[var(--color-paper)]/70">
            {looks.length} look{looks.length === 1 ? "" : "s"} · a personal archive
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-anton)] text-[22vw] leading-[0.78] tracking-tight text-[var(--color-acid)] sm:text-[9rem]">
            LOOK
            <br />
            BOOK
          </h1>
          <Decor className="absolute right-2 top-4">
            <span className="text-5xl text-[var(--color-pink)]">★</span>
          </Decor>
          <Scrawl seed="looks-note" color="var(--color-yellow)" size="lg" className="mt-3 block">
            tap anything you want →
          </Scrawl>
        </header>

        {looks.length === 0 ? (
          <p className="mt-16 max-w-md font-[family-name:var(--font-instrument-serif)] text-2xl italic normal-case text-[var(--color-paper)]/80">
            No looks up yet — just the closet for now.{" "}
            <a href={`/closet/${slug}`} className="text-[var(--color-acid)] underline">
              Go browse the pieces →
            </a>
          </p>
        ) : null}

        <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {looks.map((look, i) => (
            <Link key={look.id} href={`/closet/${slug}/looks/${look.slug}`} className="group block">
              <div className="transition-transform duration-200 group-hover:-translate-y-1 group-hover:rotate-0 motion-reduce:transform-none">
                <PhotoFrame
                  src={look.photo.url}
                  alt={look.photo.alt}
                  width={look.photo.width}
                  height={look.photo.height}
                  treatment={TREATMENTS[i % TREATMENTS.length]}
                  seed={look.id}
                  tilt={3}
                  priority={i < 3}
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                />
              </div>
              <h2 className="mt-4 font-[family-name:var(--font-anton)] text-2xl leading-[0.9] text-[var(--color-yellow)] sm:text-3xl">
                {look.title}
              </h2>
              {look.caption ? (
                <p className="mt-1 font-[family-name:var(--font-caveat)] text-lg leading-tight text-[var(--color-paper)]">
                  {look.caption}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
