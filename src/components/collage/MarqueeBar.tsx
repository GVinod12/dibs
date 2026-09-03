import { cn } from "@/lib/cn";

type Props = {
  items: string[];
  className?: string;
  tone?: "ink" | "pink" | "cobalt" | "acid";
  separator?: string;
};

const TONE = {
  ink: "bg-[var(--color-ink)] text-[var(--color-paper)]",
  pink: "bg-[var(--color-pink)] text-white",
  cobalt: "bg-[var(--color-cobalt)] text-white",
  acid: "bg-[var(--color-acid)] text-[var(--color-ink)]",
};

/** Infinite horizontal ticker. Pauses on hover, freezes under reduced-motion. */
export function MarqueeBar({ items, className, tone = "ink", separator = "✦" }: Props) {
  const run = [...items, ...items];
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden py-2.5 font-[family-name:var(--font-space-grotesk)] text-[0.7rem] font-bold uppercase tracking-[0.28em]",
        TONE[tone],
        className,
      )}
      aria-hidden
    >
      <div className="flex shrink-0 animate-marquee gap-6 pr-6 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {run.map((t, i) => (
          <span key={i} className="flex items-center gap-6 whitespace-nowrap">
            {t}
            <span className="opacity-55">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
