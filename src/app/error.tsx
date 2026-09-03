"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="paper-grid flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-[family-name:var(--font-anton)] text-6xl text-[var(--color-tomato)] sm:text-8xl">
        WELL.
        <br />
        THAT BROKE.
      </p>
      <p className="mt-4 font-[family-name:var(--font-instrument-serif)] text-xl italic text-[var(--color-ink)]">
        Something fell off the rail. Give it another go.
      </p>
      <button
        onClick={reset}
        className="mt-6 bg-[var(--color-ink)] px-6 py-3 font-[family-name:var(--font-anton)] text-xl uppercase text-[var(--color-acid)]"
      >
        try again →
      </button>
    </div>
  );
}
