const SYMBOL: Record<string, string> = { EUR: "€", GBP: "£", USD: "$" };

export function formatPrice(cents: number | null | undefined, currency = "EUR"): string {
  if (cents == null) return "—";
  const sym = SYMBOL[currency] ?? "";
  const whole = cents / 100;
  const str =
    whole % 1 === 0 ? String(whole) : whole.toFixed(2);
  return `${sym}${str}`;
}

export function formatPriceRange(
  low: number | null | undefined,
  high: number | null | undefined,
  currency = "EUR",
): string {
  if (low == null && high == null) return "—";
  if (low != null && high != null && low !== high) {
    return `${formatPrice(low, currency)}–${formatPrice(high, currency)}`;
  }
  return formatPrice(low ?? high, currency);
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
