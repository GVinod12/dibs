/**
 * Deterministic pseudo-randomness so collage layouts (rotation, tape position,
 * sticker choice) stay identical between server render and client hydration and
 * don't jitter on every navigation.
 */

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Seeded {
  private rng: () => number;

  constructor(seed: string | number) {
    this.rng = mulberry32(typeof seed === "string" ? hashString(seed) : seed);
  }

  /** float in [min, max) */
  range(min: number, max: number): number {
    return min + this.rng() * (max - min);
  }

  /** integer in [min, max] */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.rng() * arr.length)];
  }

  bool(probability = 0.5): boolean {
    return this.rng() < probability;
  }

  /** small rotation in degrees, tamed on mobile via the caller */
  tilt(magnitude = 3): number {
    return Number(this.range(-magnitude, magnitude).toFixed(2));
  }
}

export function seededTilt(seed: string, magnitude = 3): number {
  return new Seeded(seed).tilt(magnitude);
}
