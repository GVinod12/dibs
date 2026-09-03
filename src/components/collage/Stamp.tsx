import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Seeded } from "@/lib/seededRandom";

type Props = {
  children: ReactNode;
  color?: string;
  seed?: string;
  className?: string;
  style?: CSSProperties;
  /** plays the slam-in keyframes on mount */
  animateIn?: boolean;
  /** gentle infinite wobble (the "DIBSED ♡" hero stamp) */
  wobble?: boolean;
  size?: "sm" | "md" | "lg";
  double?: boolean;
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-lg px-3 py-1.5 border-[3px]",
  md: "text-3xl px-4 py-2 border-4",
  lg: "text-5xl px-6 py-3 border-[6px]",
};

/**
 * A rubber stamp in Anton. Used for the DIBS moment and item status overlays.
 * From DIBS.dc.html: double or solid coloured border, translucent paper fill,
 * rotated ~ -13deg, optional wobble.
 */
export function Stamp({
  children,
  color = "var(--color-tomato)",
  seed = "stamp",
  className,
  style,
  animateIn = false,
  wobble = false,
  size = "md",
  double = true,
}: Props) {
  const deg = new Seeded(seed + "r").range(-15, -9).toFixed(1);
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap font-[family-name:var(--font-anton)] uppercase leading-none tracking-[0.02em]",
        SIZE[size],
        animateIn && "animate-stamp-slam",
        wobble && !animateIn && "animate-wob",
        className,
      )}
      style={{
        color,
        borderColor: color,
        borderStyle: double ? "double" : "solid",
        background: "rgba(244,238,228,0.55)",
        transform: animateIn || wobble ? undefined : `rotate(calc(${deg}deg * var(--tame,1)))`,
        ["--wob-a" as string]: `${Number(deg) - 3}deg`,
        ["--wob-b" as string]: `${Number(deg) + 3}deg`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
