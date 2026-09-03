import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin, passwordConfigured } from "@/lib/admin-auth";
import { aiConfigured } from "@/lib/ai/catalogue";
import { getPrimaryCloset, getClosetStats, listItems, listOffers, listLooks } from "@/lib/repo";
import { STORE_BACKEND } from "@/lib/db/store";
import { STORAGE_BACKEND } from "@/lib/storage";
import { formatPrice, relativeTime } from "@/lib/format";
import { LoginForm } from "@/components/admin/LoginForm";
import { AdminItemRow } from "@/components/admin/AdminItemRow";
import { OfferRow } from "@/components/admin/OfferRow";
import { logoutAction, deleteLookAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Owner", robots: { index: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <div className="paper-grid min-h-dvh">
        <LoginForm configured={passwordConfigured()} />
      </div>
    );
  }

  const closet = await getPrimaryCloset();
  const [stats, items, offers, looks] = await Promise.all([
    getClosetStats(closet.slug),
    listItems(closet.slug),
    listOffers(closet.slug),
    listLooks(closet.slug),
  ]);
  const pendingOffers = offers.filter((o) => o.status === "PENDING");

  return (
    <div className="paper-grid min-h-dvh">
      <header className="on-dark flex items-center justify-between bg-[var(--color-ink)] px-4 py-3 text-[var(--color-paper)] sm:px-6">
        <span className="font-[family-name:var(--font-anton)] text-xl">
          DIBS<span className="text-[var(--color-pink)]">.</span> / owner
        </span>
        <form action={logoutAction}>
          <button className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--color-fog)] hover:text-[var(--color-acid)]">
            sign out
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="font-[family-name:var(--font-anton)] text-5xl text-[var(--color-ink)] sm:text-7xl">
          THE BACK
          <br />
          ROOM
        </h1>
        <div className="mt-4 flex flex-wrap gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em]">
          <span className="bg-[var(--color-ink)] px-2 py-1.5 text-[var(--color-paper)]">{stats.pieces} pieces</span>
          <span className="bg-[var(--color-acid)] px-2 py-1.5 text-[var(--color-ink)]">{stats.available} available</span>
          <span className="bg-[var(--color-pink)] px-2 py-1.5 text-white">{stats.claimed} spoken for</span>
          <span
            className={`px-2 py-1.5 ${aiConfigured() ? "bg-[var(--color-cobalt)] text-white" : "bg-white text-[var(--color-fog)] ring-2 ring-inset ring-[var(--color-fog)]"}`}
          >
            AI {aiConfigured() ? "on" : "off"}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/items/new"
            className="bg-[var(--color-ink)] px-5 py-3 font-[family-name:var(--font-anton)] text-lg uppercase text-[var(--color-acid)]"
          >
            + add a piece
          </Link>
          <Link
            href="/admin/looks/new"
            className="bg-[var(--color-cobalt)] px-5 py-3 font-[family-name:var(--font-anton)] text-lg uppercase text-white"
          >
            + add a look
          </Link>
          <Link
            href={`/closet/${closet.slug}`}
            className="border-2 border-[var(--color-ink)] px-5 py-3 font-[family-name:var(--font-anton)] text-lg uppercase text-[var(--color-ink)]"
          >
            view closet →
          </Link>
        </div>

        {/* offers */}
        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-anton)] text-2xl text-[var(--color-ink)]">
            Offers {pendingOffers.length ? `(${pendingOffers.length})` : ""}
          </h2>
          {pendingOffers.length === 0 ? (
            <p className="mt-3 text-sm italic text-[var(--color-fog)]">Nothing waiting on you.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pendingOffers.map((o) => (
                <OfferRow key={o.id} offer={o} />
              ))}
            </ul>
          )}
        </section>

        {/* looks */}
        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-anton)] text-2xl text-[var(--color-ink)]">
            The lookbook {looks.length ? `(${looks.length})` : ""}
          </h2>
          {looks.length === 0 ? (
            <p className="mt-3 text-sm italic text-[var(--color-fog)]">
              No looks yet — <Link href="/admin/looks/new" className="underline">add one</Link>.
            </p>
          ) : (
            <ul className="mt-4 divide-y-2 divide-[var(--color-ink)] border-y-2 border-[var(--color-ink)]">
              {looks.map((lk) => (
                <li key={lk.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden border-2 border-[var(--color-ink)]">
                    {lk.photo.url ? <img src={lk.photo.url} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/looks/${lk.id}`}
                      className="font-[family-name:var(--font-anton)] text-lg leading-none text-[var(--color-ink)] hover:text-[var(--color-pink)]"
                    >
                      {lk.title}
                    </Link>
                    <p className="mt-1 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-fog)]">
                      {lk.itemIds.length} piece{lk.itemIds.length === 1 ? "" : "s"} linked · {relativeTime(lk.createdAt)}
                    </p>
                  </div>
                  <Link
                    href={`/admin/looks/${lk.id}`}
                    className="border-2 border-[var(--color-ink)] px-2 py-1 text-[0.62rem] font-bold uppercase"
                  >
                    edit
                  </Link>
                  <form action={deleteLookAction}>
                    <input type="hidden" name="lookId" value={lk.id} />
                    <button
                      className="border-2 border-[var(--color-tomato)] px-2 py-1 text-[0.62rem] font-bold uppercase text-[var(--color-tomato)] hover:bg-[var(--color-tomato)] hover:text-white"
                      aria-label={`Delete ${lk.title}`}
                    >
                      ✕
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* items */}
        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-anton)] text-2xl text-[var(--color-ink)]">The inventory</h2>
          <ul className="mt-4 divide-y-2 divide-[var(--color-ink)] border-y-2 border-[var(--color-ink)]">
            {items.map((it) => (
              <AdminItemRow key={it.id} item={it} closetSlug={closet.slug} />
            ))}
          </ul>
        </section>

        <p className="mt-10 font-[family-name:var(--font-caveat)] text-lg text-[var(--color-fog)]">
          store: <code className="font-[family-name:var(--font-space-grotesk)] text-xs">{STORE_BACKEND}</code> · images:{" "}
          <code className="font-[family-name:var(--font-space-grotesk)] text-xs">{STORAGE_BACKEND}</code>
        </p>
      </div>
    </div>
  );
}
