import type { CSSProperties, ReactNode } from "react";
import { seededTilt } from "@/lib/seededRandom";
import { cn } from "@/lib/cn";

type Props = {
  /** stable string so the tilt never changes between renders */
  seed: string;
  /** max degrees of tilt in either direction */
  magnitude?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Wraps a scrap of the collage and gives it a small, deterministic rotation.
 * Rotation scales by `--tame` (< 1 on small screens) so the layout calms down
 * on mobile without changing the markup. Never wrap text a reader must parse.
 */
export function RotateWrap({ seed, magnitude = 3, className, style, children }: Props) {
  const deg = seededTilt(seed, magnitude);
  return (
    <div
      className={cn("[transform:rotate(var(--r))]", className)}
      style={{ "--r": `calc(${deg}deg * var(--tame, 1))`, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}
