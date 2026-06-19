/**
 * Support computation — the shared engine (GAME_DESIGN.md §5.2).
 *
 * For each unit, support sums over demographic groups (group share × affinity).
 * Identical at every tier; only the data (units, issues, demographics) changes.
 *
 * For M0 the record and campaign-pressure terms are zero (no govern record or
 * campaign yet); they slot into `affinity` later without changing the shape.
 */
import type {
  Candidate,
  Demographic,
  Party,
  Unit,
} from "../models/types.js";
import type { Rng } from "../rng.js";

/** Affinity term weights (sum to 1). */
export interface AffinityWeights {
  issues: number;
  identity: number;
  lean: number;
}

export const DEFAULT_WEIGHTS: AffinityWeights = {
  issues: 0.5,
  identity: 0.2,
  lean: 0.3,
};

export interface SupportConfig {
  weights?: AffinityWeights;
  /** Symmetric noise amplitude applied to affinity (0 = fully deterministic). */
  noise?: number;
}

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * Issue alignment of a group with a candidate, 0 … 1.
 * Σ salience[issue] × (1 − |candidatePos − groupIdeal| / 2)
 */
export function issueScore(group: Demographic, candidate: Candidate): number {
  let score = 0;
  let totalSalience = 0;
  for (const [issue, salience] of Object.entries(group.salience)) {
    const ideal = group.ideals[issue] ?? 0;
    const pos = candidate.positions[issue] ?? 0;
    score += salience * (1 - Math.abs(pos - ideal) / 2);
    totalSalience += salience;
  }
  // Normalize by total salience so weighting is stable even if it doesn't sum to 1.
  return totalSalience > 0 ? clamp01(score / totalSalience) : 0;
}

/** Identity fit — M0: charisma-driven, 0 … 1. Traits/demographics fold in later. */
export function identityFit(candidate: Candidate): number {
  return clamp01(candidate.stats.charisma / 10);
}

/** Partisan-lean fit between a candidate's party and a unit's current lean, 0 … 1. */
export function leanFit(party: Party, unit: Unit): number {
  return clamp01(1 - Math.abs(party.lean - unit.currentLean) / 2);
}

/** Overall affinity of a group (in a unit) for a candidate, 0 … 1. */
export function affinity(
  group: Demographic,
  candidate: Candidate,
  party: Party,
  unit: Unit,
  weights: AffinityWeights = DEFAULT_WEIGHTS,
  rng?: Rng,
  noise = 0,
): number {
  const base =
    weights.issues * issueScore(group, candidate) +
    weights.identity * identityFit(candidate) +
    weights.lean * leanFit(party, unit);
  const jitter = rng && noise > 0 ? rng.noise(noise) : 0;
  return clamp01(base + jitter);
}
