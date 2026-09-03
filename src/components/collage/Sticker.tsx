import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Seeded } from "@/lib/seededRandom";

type StickerTone = "pink" | "cobalt" | "acid" | "tomato" | "yellow" | "lilac" | "ink" | "paper";

const TONE: Record<StickerTone, { bg: string; fg: string }> = {
  pink: { bg: "var(--color-pink)", fg: "#fff" },
  cobalt: { bg: "var(--color-cobalt)", fg: "#fff" },
  acid: { bg: "var(--color-acid)", fg: "var(--color-ink)" },
  tomato: { bg: "var(--color-tomato)", fg: "#fff" },
  yellow: { bg: "var(--color-yellow)", fg: "var(--color-ink)" },
  lilac: { bg: "var(--color-lilac)", fg: "var(--color-ink)" },
  ink: { bg: "var(--color-ink)", fg: "var(--color-acid)" },
  paper: { bg: "var(--color-paper)", fg: "var(--color-ink)" },
};

type Props = {
  children: ReactNode;
  tone?: StickerTone;
  seed?: string;
  className?: string;
  style?: CSSProperties;
  as?: "span" | "div";
  /** slap a hard ink shadow on it */
  raised?: boolean;
};

/**
 * A small pressed label — categories, counts, "NEW IN", little asides.
 * Rotation is decorative; the text stays readable.
 */
export function Sticker({
  children,
  tone = "pink",
  seed = "sticker",
  className,
  style,
  as = "span",
  raised = false,
}: Props) {
  const t = TONE[tone];
  const deg = new Seeded(seed).range(-4, 4).toFixed(1);
  const Tag = as;
  return (
    <Tag
      className={cn(
        "inline-flex select-none items-center justify-center gap-1 px-3 py-1.5",
        "font-[family-name:var(--font-space-grotesk)] text-[0.7rem] font-bold uppercase leading-none tracking-[0.16em]",
        raised && "shadow-ink-sm",
        className,
      )}
      style={{
        background: t.bg,
        color: t.fg,
        transform: `rotate(calc(${deg}deg * var(--tame,1)))`,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
