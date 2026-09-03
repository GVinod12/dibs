import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

export type DoodleName =
  | "arrow"
  | "arrow-curl"
  | "star"
  | "sparkle"
  | "squiggle"
  | "circle"
  | "underline"
  | "heart"
  | "asterisk"
  | "loop";

type Props = {
  name: DoodleName;
  className?: string;
  style?: CSSProperties;
  color?: string;
  strokeWidth?: number;
  title?: string;
};

const PATHS: Record<DoodleName, { vb: string; el: React.ReactNode; fill?: boolean }> = {
  arrow: {
    vb: "0 0 64 40",
    el: (
      <>
        <path d="M3 20c14 6 30 6 54 0" />
        <path d="M44 6c8 5 12 9 13 14-5 2-10 5-13 12" />
      </>
    ),
  },
  "arrow-curl": {
    vb: "0 0 72 60",
    el: (
      <>
        <path d="M6 8c2 26 18 40 52 40" />
        <path d="M44 34c8 7 12 11 14 16-6 0-12 2-18 6" />
      </>
    ),
  },
  star: {
    vb: "0 0 48 48",
    fill: true,
    el: <path d="M24 3l6 13 14 2-10 10 3 14-13-7-13 7 3-14L4 18l14-2z" />,
  },
  sparkle: {
    vb: "0 0 48 48",
    fill: true,
    el: <path d="M24 2c2 12 8 18 20 22-12 4-18 10-20 22-2-12-8-18-20-22 12-4 18-10 20-22z" />,
  },
  squiggle: {
    vb: "0 0 90 24",
    el: <path d="M3 12c8-12 16 12 24 0s16 12 24 0 16 12 24 0" />,
  },
  circle: {
    vb: "0 0 100 70",
    el: <path d="M50 6C22 6 6 20 6 36s22 28 46 28 40-14 40-30S78 5 44 7" />,
  },
  underline: {
    vb: "0 0 120 20",
    el: <path d="M4 12c26 6 86 6 112-2M8 17c30 4 74 4 104-3" />,
  },
  heart: {
    vb: "0 0 48 44",
    fill: true,
    el: <path d="M24 42C8 30 3 20 6 12 9 5 18 4 24 12c6-8 15-7 18 0 3 8-2 18-18 30z" />,
  },
  asterisk: {
    vb: "0 0 40 40",
    el: (
      <>
        <path d="M20 4v32M6 12l28 16M34 12L6 28" />
      </>
    ),
  },
  loop: {
    vb: "0 0 80 48",
    el: <path d="M6 40c0-16 12-30 26-30s20 12 10 20-24 2-16-12 26-14 42 2" />,
  },
};

/** Hand-drawn marker doodles — arrows, stars, squiggles, circles-around-things. */
export function Doodle({ name, className, style, color = "currentColor", strokeWidth = 3, title }: Props) {
  const { vb, el, fill } = PATHS[name];
  return (
    <svg
      viewBox={vb}
      className={cn("pointer-events-none overflow-visible", className)}
      style={style}
      fill={fill ? color : "none"}
      stroke={fill ? "none" : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {el}
    </svg>
  );
}
