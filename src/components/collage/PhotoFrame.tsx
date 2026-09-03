import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Seeded } from "@/lib/seededRandom";

export type FrameTreatment =
  | "shadow-ink"
  | "shadow-pink"
  | "shadow-cobalt"
  | "shadow-tomato"
  | "shadow-soft"
  | "border-acid"
  | "border-yellow"
  | "border-cobalt"
  | "border-pink"
  | "border-lilac"
  | "border-paper"
  | "polaroid";

const BORDER: Partial<Record<FrameTreatment, string>> = {
  "border-acid": "var(--color-acid)",
  "border-yellow": "var(--color-yellow)",
  "border-cobalt": "var(--color-cobalt)",
  "border-pink": "var(--color-pink)",
  "border-lilac": "var(--color-lilac)",
  "border-paper": "var(--color-paper)",
};

const SHADOW_CLASS: Partial<Record<FrameTreatment, string>> = {
  "shadow-ink": "shadow-ink",
  "shadow-pink": "shadow-pink",
  "shadow-cobalt": "shadow-cobalt",
  "shadow-tomato": "shadow-tomato",
  "shadow-soft": "shadow-soft",
};

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  treatment?: FrameTreatment;
  caption?: ReactNode;
  seed?: string;
  tilt?: number;
  priority?: boolean;
  /** kept for API compatibility; native img sizing is used */
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  ratio?: number;
};

/**
 * A photo stuck to the board. Treatments mirror DIBS.dc.html: hard offset
 * shadow, a fat coloured border, or a white polaroid pad with a handwritten
 * caption. Rotation is deterministic and decorative.
 *
 * Uses a native <img> — images ship pre-sized and `next.config` runs the
 * optimizer off, so next/image would only add a lazy-load wrapper that
 * misbehaves inside CSS `columns` masonry.
 */
export function PhotoFrame({
  src,
  alt,
  width,
  height,
  treatment = "shadow-ink",
  caption,
  seed = src,
  tilt = 3,
  priority = false,
  className,
  style,
  ratio,
}: Props) {
  const deg = new Seeded(seed).tilt(tilt);
  // clamp very tall / very wide source photos so collage tiles stay in a sane band
  const aspect = ratio ?? Math.min(1.4, Math.max(0.76, width / height));
  const isPolaroid = treatment === "polaroid";
  const border = BORDER[treatment];

  const img = (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className="block h-full w-full object-cover [filter:saturate(1.06)_contrast(1.03)]"
    />
  );

  if (isPolaroid) {
    return (
      <figure
        className={cn("bg-white p-3 pb-0 shadow-soft", className)}
        style={{ transform: `rotate(calc(${deg}deg * var(--tame,1)))`, ...style }}
      >
        <div className="w-full overflow-hidden bg-[var(--color-paper-line)]" style={{ aspectRatio: String(aspect) }}>
          {img}
        </div>
        <figcaption className="flex min-h-[2.75rem] items-center px-1 py-2 font-[family-name:var(--font-caveat)] text-[1.35rem] leading-tight text-[var(--color-ink)]">
          {caption}
        </figcaption>
      </figure>
    );
  }

  return (
    <div
      className={cn("w-full overflow-hidden bg-[var(--color-paper-line)]", SHADOW_CLASS[treatment], className)}
      style={{
        aspectRatio: String(aspect),
        transform: `rotate(calc(${deg}deg * var(--tame,1)))`,
        border: border ? `5px solid ${border}` : undefined,
        ...style,
      }}
    >
      {img}
    </div>
  );
}
