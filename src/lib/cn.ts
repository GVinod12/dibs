type ClassValue = string | number | null | undefined | false | ClassValue[];

/** tiny classnames joiner — no dependency needed */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (Array.isArray(v)) out.push(cn(...v));
    else out.push(String(v));
  }
  return out.join(" ");
}
