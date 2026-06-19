/**
 * Election tally (GAME_DESIGN.md §5.2 / §5.3).
 *
 * Per unit: each demographic casts turnout-weighted votes split across
 * candidates in proportion to affinity. Seats are awarded winner-take-all by
 * default. Pure function of (scenario, candidates, pressure, record, seed).
 */
import type { Candidate, Party, Scenario, Unit } from "../models/types.js";
import { affinity, DEFAULT_WEIGHTS, type AffinityWeights } from "./support.js";
import { turnout } from "./turnout.js";
import { makeRng, hashSeed, type Rng } from "../rng.js";

export interface SupportConfig {
  weights?: AffinityWeights;
  /** Symmetric noise amplitude applied to affinity (0 = fully deterministic). */
  noise?: number;
}

export interface UnitResult {
  unitId: string;
  shares: Record<string, number>;
  votes: Record<string, number>;
  winnerId: string;
  seats: number;
}

export interface ElectionResult {
  byUnit: UnitResult[];
  seatsByCandidate: Record<string, number>;
  votesByCandidate: Record<string, number>;
}

/** Per-candidate campaign pressure within a single unit. */
export type UnitPressure = Record<string, number>;
/** Per-candidate govern record effect, −1 … +1 (unit-independent in M1). */
export type RecordMap = Record<string, number>;

function partyOf(scenario: Scenario, candidate: Candidate): Party {
  const party = scenario.parties.find((p) => p.id === candidate.party);
  if (!party) throw new Error(`Unknown party '${candidate.party}' for ${candidate.id}`);
  return party;
}

export function tallyUnit(
  scenario: Scenario,
  unit: Unit,
  candidates: Candidate[],
  opts: { config?: SupportConfig; pressure?: UnitPressure; record?: RecordMap; rng?: Rng } = {},
): UnitResult {
  const weights = opts.config?.weights ?? DEFAULT_WEIGHTS;
  const noise = opts.config?.noise ?? 0;
  const votes: Record<string, number> = {};
  for (const c of candidates) votes[c.id] = 0;

  for (const demo of scenario.demographics) {
    const share = unit.mix[demo.id] ?? 0;
    if (share <= 0) continue;
    const voters = unit.population * share * turnout(demo);

    const affinities = candidates.map((c) =>
      affinity(demo, c, partyOf(scenario, c), unit, {
        weights,
        noise,
        ...(opts.rng ? { rng: opts.rng } : {}),
        pressure: opts.pressure?.[c.id] ?? 0,
        record: opts.record?.[c.id] ?? 0,
      }),
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

export function runElection(
  scenario: Scenario,
  candidates: Candidate[],
  opts: {
    seed?: number | string;
    units?: Unit[];
    config?: SupportConfig;
    /** Campaign pressure by unit id → candidate id → pressure. */
    pressureByUnit?: Record<string, UnitPressure>;
    record?: RecordMap;
  } = {},
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
    const rng = makeRng(hashSeed(unit.id) ^ seed);
    const result = tallyUnit(scenario, unit, candidates, {
      config,
      rng,
      ...(opts.pressureByUnit?.[unit.id] ? { pressure: opts.pressureByUnit[unit.id] } : {}),
      ...(opts.record ? { record: opts.record } : {}),
    });
    byUnit.push(result);
    seatsByCandidate[result.winnerId] = (seatsByCandidate[result.winnerId] ?? 0) + result.seats;
    for (const c of candidates) {
      votesByCandidate[c.id] = (votesByCandidate[c.id] as number) + (result.votes[c.id] as number);
    }
  }

  return { byUnit, seatsByCandidate, votesByCandidate };
}
