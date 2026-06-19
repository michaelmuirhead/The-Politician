/**
 * Seeded, deterministic RNG (mulberry32).
 *
 * The whole engine is deterministic: identical seed + identical inputs always
 * produce identical output, so games are reproducible and balance is testable
 * headlessly (GAME_DESIGN.md §5.4, §11).
 */
export interface Rng {
  /** Next float in [0, 1). */
  next(): number;
  /** Symmetric noise in [-amplitude, +amplitude). */
  noise(amplitude: number): number;
  /** A fresh, independent stream derived from this one (for sub-simulations). */
  fork(salt: number): Rng;
}

/** Hash a string to a 32-bit seed, so scenarios/units can derive stable streams. */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    noise: (amplitude: number) => (next() * 2 - 1) * amplitude,
    fork: (salt: number) => makeRng((seed ^ Math.imul(salt | 0, 0x9e3779b1)) >>> 0),
  };
}
