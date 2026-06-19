/**
 * Election tally (GAME_DESIGN.md §5.2 / §5.3).
 *
 * Per unit: each demographic casts turnout-weighted votes split across
 * candidates in proportion to affinity (softmax-normalized). Seats are awarded
 * winner-take-all by default. The whole pass is a pure function of (scenario,
 * candidate set, seed) so results are reproducible.
 */
import type { Candidate, Party, Scenario, Unit } from "../models/types.js";
import { affinity, DEFAULT_WEIGHTS, type SupportConfig } from "./support.js";
import { turnout } from "./turnout.js";
import { makeRng, hashSeed, type Rng } from "../rng.js";

export interface UnitResult {
  unitId: string;
  /** Vote share per candidate id, sums to ≈ 1. */
  shares: Record<string, number>;
  /** Turnout-weighted vote count per candidate id. */
  votes: Record<string, number>;
  winnerId: string;
  seats: number;
}

export interface ElectionResult {
  byUnit: UnitResult[];
  /** Total seats won per candidate id. */
  seatsByCandidate: Record<string, number>;
  /** Total votes per candidate id across all units. */
  votesByCandidate: Record<string, number>;
}

function partyOf(scenario: Scenario, candidate: Candidate): Party {
  const party = scenario.parties.find((p) => p.id === candidate.party);
  if (!party) throw new Error(`Unknown party '${candidate.party}' for ${candidate.id}`);
  return party;
}

/** Vote shares for a single unit (turnout-weighted, affinity-proportional). */
export function tallyUnit(
  scenario: Scenario,
  unit: Unit,
  candidates: Candidate[],
  config: SupportConfig = {},
  rng?: Rng,
): UnitResult {
  const weights = config.weights ?? DEFAULT_WEIGHTS;
  const noise = config.noise ?? 0;
  const votes: Record<string, number> = {};
  for (const c of candidates) votes[c.id] = 0;

  for (const demo of scenario.demographics) {
    const share = unit.mix[demo.id] ?? 0;
    if (share <= 0) continue;
    const voters = unit.population * share * turnout(demo);

    // Affinity per candidate, then normalize into a vote split for this group.
    const affinities = candidates.map((c) =>
      affinity(demo, c, partyOf(scenario, c), unit, weights, rng, noise),
    );
    const total = affinities.reduce((a, b) => a + b, 0);
    candidates.forEach((c, i) => {
      const frac = total > 0 ? (affinities[i] as number) / total : 1 / candidates.length;
      votes[c.id] = (votes[c.id] as number) + voters * frac;
    });
  }

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const shares: Record<string, number> = {};
  for (const c of candidates) {
    shares[c.id] = totalVotes > 0 ? (votes[c.id] as number) / totalVotes : 0;
  }

  let winnerId = candidates[0]?.id ?? "";
  for (const c of candidates) {
    if ((votes[c.id] as number) > (votes[winnerId] as number)) winnerId = c.id;
  }

  return { unitId: unit.id, shares, votes, winnerId, seats: unit.seats };
}

/** Run an election across a set of units (defaults to all city-tier units). */
export function runElection(
  scenario: Scenario,
  candidates: Candidate[],
  opts: { seed?: number | string; units?: Unit[]; config?: SupportConfig } = {},
): ElectionResult {
  const seed = typeof opts.seed === "string" ? hashSeed(opts.seed) : opts.seed ?? 1;
  const units = opts.units ?? scenario.units.filter((u) => u.kind === "ward");
  const config = opts.config ?? {};

  const byUnit: UnitResult[] = [];
  const seatsByCandidate: Record<string, number> = {};
  const votesByCandidate: Record<string, number> = {};
  for (const c of candidates) {
    seatsByCandidate[c.id] = 0;
    votesByCandidate[c.id] = 0;
  }

  for (const unit of units) {
    // Derive an independent, stable stream per unit so ordering never matters.
    const rng = makeRng(hashSeed(unit.id) ^ seed);
    const result = tallyUnit(scenario, unit, candidates, config, rng);
    byUnit.push(result);
    seatsByCandidate[result.winnerId] =
      (seatsByCandidate[result.winnerId] ?? 0) + result.seats;
    for (const c of candidates) {
      votesByCandidate[c.id] = (votesByCandidate[c.id] as number) + (result.votes[c.id] as number);
    }
  }

  return { byUnit, seatsByCandidate, votesByCandidate };
}
