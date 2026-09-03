"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The "stickers" toggle from DIBS.dc.html — decorative chaos (stars, hearts,
 * dashed circles, scrawled notes) is opt-out. Nothing load-bearing lives in
 * here: turning stickers off must never hide a control or a piece of copy.
 */

type Ctx = { on: boolean; toggle: () => void; ready: boolean };
const StickerCtx = createContext<Ctx>({ on: true, toggle: () => {}, ready: false });

const KEY = "dibs:stickers";

export function StickerProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(KEY);
      if (v === "0") setOn(false);
    } catch {
      /* private mode / blocked storage — default on */
    }
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return <StickerCtx.Provider value={{ on, toggle, ready }}>{children}</StickerCtx.Provider>;
}

export function useStickers() {
  return useContext(StickerCtx);
}

/** Wrap decoration only. Children render (and animate in) only when stickers are on. */
export function Decor({ children, className }: { children: ReactNode; className?: string }) {
  const { on } = useStickers();
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none transition-opacity duration-300", on ? "opacity-100" : "opacity-0", className)}
    >
      {children}
    </span>
  );
}

export function StickerSwitch({ className }: { className?: string }) {
  const { on, toggle } = useStickers();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className={cn(
        "group inline-flex items-center gap-2 font-[family-name:var(--font-space-grotesk)] text-[0.62rem] font-bold uppercase tracking-[0.2em]",
        className,
      )}
    >
      <span aria-hidden className="relative h-4 w-7 rounded-full border-2 border-current">
        <span
          className={cn(
            "absolute top-[1px] h-2.5 w-2.5 rounded-full bg-current transition-all",
            on ? "left-[11px]" : "left-[1px]",
          )}
        />
      </span>
      stickers
    </button>
  );
}
