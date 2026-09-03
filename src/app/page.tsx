import Link from "next/link";
import { getPrimaryCloset, getClosetStats, listItems, listLooks } from "@/lib/repo";
import { PhotoFrame, Sticker, Scrawl, MarqueeBar } from "@/components/collage";
import { StickerProvider, Decor, StickerSwitch } from "@/components/stickers";
import { ItemCard } from "@/components/item/ItemCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const closet = await getPrimaryCloset();
  const slug = closet.slug;
  const [stats, items, looks] = await Promise.all([
    getClosetStats(slug),
    listItems(slug, { sort: "curated" }),
    listLooks(slug),
  ]);
  const peek = items.filter((i) => i.status === "AVAILABLE").slice(0, 8);
  const heroShots = items.slice(0, 4);

  return (
    <StickerProvider>
      <div className="flex min-h-dvh flex-col">
        {/* chrome */}
        <header className="on-dark sticky top-0 z-50 flex h-16 items-center justify-between gap-4 bg-[var(--color-ink)] px-4 text-[var(--color-paper)] sm:px-7">
          <span className="font-[family-name:var(--font-anton)] text-xl tracking-[0.02em] sm:text-2xl">
            DIBS<span className="text-[var(--color-pink)]">.</span>
          </span>
          <nav className="flex items-center gap-4 text-[0.7rem] font-bold tracking-[0.2em] sm:gap-7 sm:text-xs">
            <Link href={`/closet/${slug}/looks`} className="hover:text-[var(--color-acid)]">
              LOOKS
            </Link>
            <Link href={`/closet/${slug}`} className="hover:text-[var(--color-acid)]">
              CLOSET
            </Link>
            <Link href={`/closet/${slug}/dibs`} className="hover:text-[var(--color-acid)]">
              DIBS
            </Link>
          </nav>
          <div className="hidden shrink-0 items-center gap-4 md:flex">
            <StickerSwitch className="text-[var(--color-fog)]" />
            <span className="hidden font-[family-name:var(--font-caveat)] text-lg text-[var(--color-yellow)] lg:inline">
              {stats.friends > 0 ? `only for you ${stats.friends} ♡` : "only for you ♡"}
            </span>
          </div>
        </header>

        {/* ══ HERO ══ */}
        <section className="paper-grid bleed-clip relative">
          <div className="pointer-events-none relative z-0 -mb-[3vw] mt-1 select-none overflow-hidden">
            <span className="block whitespace-nowrap font-[family-name:var(--font-anton)] text-[26vw] leading-[0.74] tracking-[-0.05em] text-[var(--color-pink)] stroke-ink">
              DIBS.
            </span>
          </div>

          <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-4 pb-20 pt-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
            {/* copy */}
            <div className="relative z-20 self-center">
              <h1 className="max-w-md font-[family-name:var(--font-instrument-serif)] text-[8vw] italic normal-case leading-[1.02] tracking-normal text-[var(--color-ink)] sm:text-[3.2rem]">
                {closet.tagline}
              </h1>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  href={`/closet/${slug}`}
                  className="bg-[var(--color-ink)] px-7 py-4 font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wide text-[var(--color-acid)] shadow-pink transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
                >
                  Enter the closet →
                </Link>
                <Scrawl seed="hero-note" color="var(--color-tomato)" size="lg">
                  no pressure. some pressure.
                </Scrawl>
              </div>
              <div className="mt-9 flex flex-wrap gap-2">
                <Sticker tone="pink" seed="h1">
                  {stats.pieces} pieces
                </Sticker>
                {stats.looks > 0 ? (
                  <Sticker tone="cobalt" seed="h2">
                    {stats.looks} looks
                  </Sticker>
                ) : null}
                {stats.friends > 0 ? (
                  <Sticker tone="acid" seed="h3">
                    {stats.friends} friends
                  </Sticker>
                ) : null}
              </div>
            </div>

            {/* collage */}
            <div className="relative z-10 min-h-[440px] sm:min-h-[560px]">
              {heroShots[0] ? (
                <div className="absolute left-0 top-0 w-[54%] sm:left-[8%]">
                  <PhotoFrame
                    src={heroShots[0].photos[0].url}
                    alt={heroShots[0].photos[0].alt}
                    width={heroShots[0].photos[0].width}
                    height={heroShots[0].photos[0].height}
                    treatment="shadow-ink"
                    seed="hero-a"
                    tilt={3}
                    priority
                    sizes="40vw"
                  />
                </div>
              ) : null}
              {heroShots[1] ? (
                <div className="absolute right-0 top-[30%] w-[48%] sm:top-[14%] sm:w-[46%]">
                  <PhotoFrame
                    src={heroShots[1].photos[0].url}
                    alt={heroShots[1].photos[0].alt}
                    width={heroShots[1].photos[0].width}
                    height={heroShots[1].photos[0].height}
                    treatment="polaroid"
                    seed="hero-b"
                    tilt={-5}
                    caption={heroShots[1].name.toLowerCase()}
                    sizes="40vw"
                  />
                </div>
              ) : null}
              {heroShots[2] ? (
                <div className="absolute bottom-[6%] left-0 hidden w-[42%] sm:block">
                  <PhotoFrame
                    src={heroShots[2].photos[0].url}
                    alt={heroShots[2].photos[0].alt}
                    width={heroShots[2].photos[0].width}
                    height={heroShots[2].photos[0].height}
                    treatment="border-acid"
                    seed="hero-c"
                    tilt={6}
                    sizes="35vw"
                  />
                </div>
              ) : null}
              {heroShots[3] ? (
                <div className="absolute bottom-0 left-[16%] w-[42%] sm:left-auto sm:right-[6%] sm:w-[40%]">
                  <PhotoFrame
                    src={heroShots[3].photos[0].url}
                    alt={heroShots[3].photos[0].alt}
                    width={heroShots[3].photos[0].width}
                    height={heroShots[3].photos[0].height}
                    treatment="shadow-cobalt"
                    seed="hero-d"
                    tilt={-3}
                    sizes="35vw"
                  />
                </div>
              ) : null}
              <Decor className="absolute left-[45%] top-[6%]">
                <span className="text-5xl text-[var(--color-yellow)]">★</span>
              </Decor>
              <Decor className="absolute bottom-[2%] left-[36%]">
                <Scrawl seed="scroll" color="var(--color-cobalt)" size="lg">
                  scroll, it gets better ↓
                </Scrawl>
              </Decor>
            </div>
          </div>
        </section>

        <MarqueeBar
          tone="pink"
          items={["GIFT IT", "SELL IT", "CALL DIBS", "BEFORE THE GROUP CHAT DOES", "EVERYTHING MUST GO"]}
        />

        {/* ══ HOW IT WORKS ══ */}
        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <h2 className="font-[family-name:var(--font-anton)] text-4xl text-[var(--color-ink)] sm:text-6xl">
            How this works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "I photograph the closet",
                d: "Every piece I'm parting with — vintage, everyday, the designer bits I'm scared of. AI helps me catalogue and price; I write the descriptions.",
                tone: "lilac" as const,
              },
              {
                n: "02",
                t: "You browse the link",
                d: "No app, no account. Filter gifts and for-sale, open a piece, read the story, see the size.",
                tone: "acid" as const,
              },
              {
                n: "03",
                t: "You call dibs",
                d: "Type your name. It's yours. Gifts are free; for-sale pieces take an offer. First dibs wins — no bidding wars.",
                tone: "pink" as const,
              },
            ].map((step) => (
              <div key={step.n} className="border-2 border-[var(--color-ink)] bg-white p-5 shadow-ink-sm">
                <Sticker tone={step.tone} seed={step.n}>
                  {step.n}
                </Sticker>
                <h3 className="mt-3 font-[family-name:var(--font-anton)] text-2xl leading-[0.9] text-[var(--color-ink)]">
                  {step.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]">{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ PEEK ══ */}
        <section className="paper-grid border-y-2 border-[var(--color-ink)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex items-end justify-between">
              <h2 className="font-[family-name:var(--font-anton)] text-4xl text-[var(--color-ink)] sm:text-6xl">
                A look inside
              </h2>
              <Link
                href={`/closet/${slug}`}
                className="pb-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--color-cobalt)] hover:text-[var(--color-pink)]"
              >
                see all {stats.pieces} →
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {peek.map((item, i) => (
                <ItemCard key={item.id} item={item} closetSlug={slug} priority={i < 2} />
              ))}
            </div>
          </div>
        </section>

        {/* ══ LOOKS TEASER ══ */}
        {looks.length ? (
          <section className="bg-[var(--color-cobalt)] px-4 py-16 text-[var(--color-paper)] sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-end justify-between">
                <h2 className="font-[family-name:var(--font-anton)] text-4xl text-[var(--color-acid)] sm:text-6xl">
                  Seen on me
                </h2>
                <Link
                  href={`/closet/${slug}/looks`}
                  className="pb-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--color-paper)] hover:text-[var(--color-acid)]"
                >
                  the lookbook →
                </Link>
              </div>
              <div className="mt-8 flex gap-5 overflow-x-auto pb-4">
                {looks.map((look) => (
                  <Link
                    key={look.id}
                    href={`/closet/${slug}/looks/${look.slug}`}
                    className="w-56 shrink-0"
                  >
                    <PhotoFrame
                      src={look.photo.url}
                      alt={look.photo.alt}
                      width={look.photo.width}
                      height={look.photo.height}
                      treatment="border-paper"
                      seed={look.id}
                      tilt={3}
                      sizes="224px"
                    />
                    <p className="mt-2 font-[family-name:var(--font-anton)] text-lg text-[var(--color-acid)]">
                      {look.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ══ CTA ══ */}
        <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <p className="font-[family-name:var(--font-instrument-serif)] text-3xl italic leading-tight text-[var(--color-ink)] sm:text-4xl">
            The van comes at the end of the month. Whatever hasn&rsquo;t been claimed goes to the charity shop on the corner.
          </p>
          <Link
            href={`/closet/${slug}`}
            className="mt-8 inline-block bg-[var(--color-pink)] px-8 py-4 font-[family-name:var(--font-anton)] text-2xl uppercase text-white shadow-ink transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
          >
            Call dibs first →
          </Link>
        </section>

        <footer className="on-dark bg-[var(--color-ink)] px-6 py-10 text-[var(--color-fog)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-[family-name:var(--font-anton)] text-2xl text-[var(--color-paper)]">
              DIBS<span className="text-[var(--color-pink)]">.</span>
            </span>
            <span className="font-[family-name:var(--font-caveat)] text-lg">
              built with claude code — visual chaos, perfect ux
            </span>
          </div>
        </footer>
      </div>
    </StickerProvider>
  );
}
