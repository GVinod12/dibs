import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Seeded } from "@/lib/seededRandom";

type Props = {
  children: ReactNode;
  seed?: string;
  color?: string;
  className?: string;
  style?: CSSProperties;
  size?: "sm" | "md" | "lg";
  tilt?: number;
};

const SIZE = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" };

/** A handwritten margin note in Caveat. The voice of the owner, off to one side. */
export function Scrawl({ children, seed = "scrawl", color = "var(--color-cobalt)", className, style, size = "md", tilt = 4 }: Props) {
  const deg = new Seeded(seed).range(-tilt, tilt).toFixed(1);
  return (
    <span
      className={cn("inline-block font-[family-name:var(--font-caveat)] font-semibold leading-tight", SIZE[size], className)}
      style={{ color, transform: `rotate(calc(${deg}deg * var(--tame,1)))`, ...style }}
    >
      {children}
    </span>
  );
}
