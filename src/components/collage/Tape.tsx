import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { Seeded } from "@/lib/seededRandom";

type TapeTone = "yellow" | "lilac" | "acid" | "pink" | "paper";

const TONES: Record<TapeTone, string> = {
  yellow: "rgba(255,216,77,0.78)",
  lilac: "rgba(201,167,255,0.8)",
  acid: "rgba(198,240,0,0.7)",
  pink: "rgba(255,45,139,0.6)",
  paper: "rgba(244,238,228,0.9)",
};

type Props = {
  seed?: string;
  tone?: TapeTone;
  className?: string;
  style?: CSSProperties;
  width?: number | string;
  height?: number;
};

/** A strip of washi tape. Position it with `className` (absolute + placement). */
export function Tape({ seed = "tape", tone, className, style, width = 110, height = 32 }: Props) {
  const rnd = new Seeded(seed);
  const resolved: TapeTone = tone ?? rnd.pick(["yellow", "lilac", "acid", "pink"] as const);
  const deg = rnd.range(-14, 14).toFixed(1);
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute block", className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: `${height}px`,
        background: TONES[resolved],
        transform: `rotate(calc(${deg}deg * var(--tame,1)))`,
        boxShadow: "0 1px 2px rgba(20,17,15,0.16)",
        ...style,
      }}
    />
  );
}
