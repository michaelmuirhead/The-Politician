/**
 * Support computation — the shared engine (GAME_DESIGN.md §5.2).
 *
 * For each unit, support sums over demographic groups (group share × affinity).
 * Identical at every tier; only the data (units, issues, demographics) changes.
 *
 *   affinity = w_issues·issueScore + w_identity·identityFit + w_lean·leanFit
 *            + w_campaign·campaignPressure   // CAMPAIGN: decaying ad/rally effects
 *            + w_record·recordEffect          // GOVERN: your track record
 *            + noise
 */
import type { Candidate, Demographic, Party, Unit } from "../models/types.js";
import type { Rng } from "../rng.js";

/** Affinity term weights. The first three form the [0,1] baseline (sum ≈ 1); */
/** campaign and record are additive modifiers. */
export interface AffinityWeights {
  issues: number;
  identity: number;
  lean: number;
  campaign: number;
  record: number;
}

export const DEFAULT_WEIGHTS: AffinityWeights = {
  issues: 0.5,
  identity: 0.2,
  lean: 0.3,
  campaign: 0.3,
  record: 0.35,
};

export interface AffinityContext {
  weights?: AffinityWeights;
  /** Accumulated campaign pressure for this candidate in this unit (≥ 0). */
  pressure?: number;
  /** Govern record effect for this candidate, −1 … +1. */
  record?: number;
  rng?: Rng;
  /** Symmetric noise amplitude (0 = fully deterministic). */
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

/** Saturating transform so stacked campaign pressure has diminishing returns. */
export function pressureTerm(pressure: number): number {
  return pressure > 0 ? pressure / (pressure + 1) : 0;
}

/**
 * Overall affinity of a group (in a unit) for a candidate — a non-negative
 * relative score (≥ 0) feeding the vote-share denominator. The baseline
 * (issues+identity+lean) lives in [0,1]; campaign and record are additive
 * modifiers and may push the score above 1, so investing in a campaign always
 * advantages the investor rather than compressing the field against a [0,1] cap.
 */
export function affinity(
  group: Demographic,
  candidate: Candidate,
  party: Party,
  unit: Unit,
  ctx: AffinityContext = {},
): number {
  const w = ctx.weights ?? DEFAULT_WEIGHTS;
  const base =
    w.issues * issueScore(group, candidate) +
    w.identity * identityFit(candidate) +
    w.lean * leanFit(party, unit);
  const campaign = w.campaign * pressureTerm(ctx.pressure ?? 0);
  const record = w.record * (ctx.record ?? 0);
  const jitter = ctx.rng && ctx.noise ? ctx.rng.noise(ctx.noise) : 0;
  return Math.max(0, base + campaign + record + jitter);
}
