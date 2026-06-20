/**
 * AI objective function (GAME_DESIGN.md §10.2).
 *
 * Each AI scores moves against a trait-weighted objective derived from its
 * Character. In M2 the campaign-phase actor is dominated by `survive`
 * (winning the election); the remaining weights are wired in for governing and
 * later milestones.
 */
import type { Candidate } from "../models/types.js";

export interface ObjectiveWeights {
  survive: number; // re-election odds
  agenda: number; // moving the world toward its positions
  climb: number; // name recognition / eligibility
  party: number; // standing with party & factions
  war: number; // money + capital banked
  ego: number; // notoriety / spotlight (firebrands value it)
}

export const BASELINE_WEIGHTS: ObjectiveWeights = {
  survive: 1,
  agenda: 0.4,
  climb: 0.3,
  party: 0.3,
  war: 0.2,
  ego: 0.1,
};

/** Derive an AI's weights from its stats & (later) traits. */
export function weightsForCandidate(candidate: Candidate): ObjectiveWeights {
  const w = { ...BASELINE_WEIGHTS };
  // Low integrity + high negotiation → more willing to go negative (ego/attack).
  if (candidate.stats.integrity <= 4) w.ego += 0.2;
  if (candidate.stats.negotiation >= 7) w.party += 0.2;
  if (candidate.stats.fundraising <= 4) w.war += 0.2; // must husband money
  return w;
}
