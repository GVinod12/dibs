"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "var(--color-pink)",
  "var(--color-acid)",
  "var(--color-cobalt)",
  "var(--color-yellow)",
  "var(--color-tomato)",
  "var(--color-lilac)",
];

type Bit = { id: number; left: number; delay: number; dur: number; color: string; heart: boolean; size: number };

/** A quick scribble-burst of confetti. Self-clears; respects reduced motion. */
export function Confetti({ count = 26 }: { count?: number }) {
  const [bits, setBits] = useState<Bit[]>([]);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setBits(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        dur: 0.9 + Math.random() * 0.9,
        color: COLORS[i % COLORS.length],
        heart: Math.random() > 0.65,
        size: 8 + Math.random() * 10,
      })),
    );
    const t = setTimeout(() => setBits([]), 2600);
    return () => clearTimeout(t);
  }, [count]);

  if (!bits.length) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.id}
          style={{
            position: "absolute",
            top: -20,
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            color: b.color,
            background: b.heart ? "transparent" : b.color,
            fontSize: b.size + 4,
            lineHeight: 1,
            animation: `confetti-fall ${b.dur}s cubic-bezier(0.3,0.7,0.5,1) ${b.delay}s forwards`,
          }}
        >
          {b.heart ? "♥" : ""}
        </span>
      ))}
    </div>
  );
}
