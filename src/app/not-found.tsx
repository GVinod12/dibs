import Link from "next/link";

export default function NotFound() {
  return (
    <div className="paper-grid flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-[family-name:var(--font-anton)] text-[28vw] leading-none text-[var(--color-pink)] stroke-ink sm:text-[12rem]">
        404
      </p>
      <p className="mt-4 font-[family-name:var(--font-instrument-serif)] text-2xl italic text-[var(--color-ink)]">
        Gone. Claimed. Never existed. Who&rsquo;s to say.
      </p>
      <Link
        href="/"
        className="mt-6 bg-[var(--color-ink)] px-6 py-3 font-[family-name:var(--font-anton)] text-xl uppercase text-[var(--color-acid)]"
      >
        back to the closet →
      </Link>
    </div>
  );
}
