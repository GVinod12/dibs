import { nanoid } from "nanoid";

export function slugify(input: string): string {
  const base = (input ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return base || `piece-${nanoid(6)}`;
}

/** slugify, then add -2, -3 … until it doesn't collide with `taken` */
export function uniqueSlug(input: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = slugify(input);
  if (!used.has(base)) return base;
  for (let n = 2; n < 200; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${nanoid(6)}`;
}
