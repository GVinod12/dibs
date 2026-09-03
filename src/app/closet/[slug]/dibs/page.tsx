import type { Metadata } from "next";
import Link from "next/link";
import { getCloset, listItems, listOffers } from "@/lib/repo";
import { formatPrice, relativeTime, firstName } from "@/lib/format";
import { StatusLabel, Scrawl, Stamp } from "@/components/collage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Who's called dibs" };

export default async function DibsPage({ params }: PageProps<"/closet/[slug]/dibs">) {
  const { slug } = await params;
  const [closet, items, offers] = await Promise.all([
    getCloset(slug),
    listItems(slug),
    listOffers(slug, "PENDING"),
  ]);
  if (!closet) return null;

  const claimed = items
    .filter((i) => i.status !== "AVAILABLE" && i.claimantName)
    .sort((a, b) => +new Date(b.claimedAt ?? 0) - +new Date(a.claimedAt ?? 0));
  const available = items.filter((i) => i.status === "AVAILABLE").length;

  return (
    <div className="paper-grid min-h-dvh">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-[family-name:var(--font-anton)] text-[18vw] leading-[0.8] text-[var(--color-ink)] sm:text-[6rem]">
          THE DIBS
          <br />
          BOARD
        </h1>
        <p className="mt-3 font-[family-name:var(--font-instrument-serif)] text-xl italic normal-case text-[var(--color-ink)]">
          <span className="font-[family-name:var(--font-space-grotesk)] not-italic">{claimed.length}</span> claimed ·{" "}
          <span className="font-[family-name:var(--font-space-grotesk)] not-italic">{available}</span> still going ·
          everything else gets a bin bag.
        </p>

        {/* pending offers */}
        {offers.length ? (
          <section className="mt-10">
            <h2 className="font-[family-name:var(--font-anton)] text-2xl text-[var(--color-ink)]">
              Offers on the table
            </h2>
            <ul className="mt-4 space-y-3">
              {offers.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center gap-3 border-2 border-[var(--color-cobalt)] bg-white p-3"
                >
                  <span className="font-[family-name:var(--font-caveat)] text-xl text-[var(--color-cobalt)]">
                    {o.name}
                  </span>
                  <span className="text-sm text-[var(--color-ink)]">
                    offered{" "}
                    <strong>
                      {o.amountCents
                        ? formatPrice(o.amountCents, o.item?.currency ?? "EUR")
                        : `asking (${formatPrice(o.item?.priceCents, o.item?.currency ?? "EUR")})`}
                    </strong>{" "}
                    on
                  </span>
                  {o.item ? (
                    <Link
                      href={`/closet/${slug}/item/${o.item.slug}`}
                      className="font-[family-name:var(--font-anton)] text-lg text-[var(--color-ink)] hover:text-[var(--color-pink)]"
                    >
                      {o.item.name}
                    </Link>
                  ) : null}
                  <span className="ml-auto text-[0.62rem] uppercase tracking-[0.16em] text-[var(--color-fog)]">
                    {relativeTime(o.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[0.7rem] text-[var(--color-fog)]">
              {firstName(closet.ownerName)} decides. No bidding wars, no drama.
            </p>
          </section>
        ) : null}

        {/* claimed feed */}
        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-anton)] text-2xl text-[var(--color-ink)]">Spoken for</h2>
          {claimed.length === 0 ? (
            <p className="mt-4 font-[family-name:var(--font-instrument-serif)] text-xl italic text-[var(--color-fog)]">
              Nothing claimed yet. Be the reason someone else is annoyed.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {claimed.map((it) => (
                <li key={it.id} className="flex items-center gap-4 border-b-2 border-[var(--color-ink)] pb-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden border-2 border-[var(--color-ink)]">
                    {it.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.photos[0].url} alt={it.photos[0].alt} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/closet/${slug}/item/${it.slug}`}
                      className="font-[family-name:var(--font-anton)] text-xl leading-none text-[var(--color-ink)] hover:text-[var(--color-pink)]"
                    >
                      {it.name}
                    </Link>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusLabel status={it.status} />
                      <span className="font-[family-name:var(--font-caveat)] text-lg text-[var(--color-ink)]">
                        {it.status === "DIBSED" ? "♡ by" : "→"} {it.claimantName}
                      </span>
                    </p>
                    {it.claimantNote ? (
                      <p className="mt-1 text-sm italic text-[var(--color-fog)]">&ldquo;{it.claimantNote}&rdquo;</p>
                    ) : null}
                  </div>
                  {it.claimedAt ? (
                    <span className="hidden text-[0.62rem] uppercase tracking-[0.16em] text-[var(--color-fog)] sm:block">
                      {relativeTime(it.claimedAt)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-12 flex items-center gap-4">
          <Stamp color="var(--color-pink)" seed="dibs-board" size="sm">
            first dibs wins
          </Stamp>
          <Scrawl seed="dibs-board-note" color="var(--color-cobalt)">
            no take-backs. mostly.
          </Scrawl>
        </div>

        <Link
          href={`/closet/${slug}`}
          className="mt-8 inline-block bg-[var(--color-ink)] px-6 py-3 font-[family-name:var(--font-anton)] text-xl uppercase text-[var(--color-acid)]"
        >
          back to the closet →
        </Link>
      </div>
    </div>
  );
}
