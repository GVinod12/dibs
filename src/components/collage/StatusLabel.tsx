import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { STATUS_STYLE, TYPE_STYLE, type ItemStatus, type ItemType } from "@/lib/constants";

type Props = {
  status?: ItemStatus;
  type?: ItemType;
  className?: string;
  style?: CSSProperties;
  size?: "sm" | "md";
  /** thin ink keyline around the label */
  outlined?: boolean;
};

/**
 * The single source of truth for showing state. State is ALWAYS a coloured
 * label with a word — never a bare colour swatch (DIBS.dc.html principle).
 */
export function StatusLabel({ status, type, className, style, size = "sm", outlined = false }: Props) {
  const s = status ? STATUS_STYLE[status] : type ? TYPE_STYLE[type] : null;
  if (!s) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center font-[family-name:var(--font-space-grotesk)] font-bold uppercase leading-none tracking-[0.14em]",
        size === "sm" ? "px-2 py-1.5 text-[0.62rem]" : "px-3 py-2 text-xs",
        className,
      )}
      style={{
        background: s.bg,
        color: s.fg,
        border: outlined ? "2px solid var(--color-ink)" : undefined,
        ...style,
      }}
    >
      {s.label}
    </span>
  );
}
