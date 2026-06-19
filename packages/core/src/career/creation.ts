/**
 * Character creation (GAME_DESIGN.md §4.1).
 *
 * Eight stats on a 1–10 scale via point-buy, plus a background trait that
 * modifies stats (and later, demographic affinities and unique actions).
 */
import type { CandidateStats, Candidate, PartyId, IssueId } from "../models/types.js";

export type StatKey = keyof CandidateStats;

export const STAT_KEYS: StatKey[] = [
  "charisma",
  "intelligence",
  "stamina",
  "fundraising",
  "composure",
  "integrity",
  "mediaSavvy",
  "negotiation",
];

/** Point-buy budget: 8 stats, baseline 5 each → 40 points to distribute. */
export const POINT_BUY_TOTAL = 40;
export const STAT_MIN = 1;
export const STAT_MAX = 10;

export interface BackgroundTrait {
  id: string;
  name: string;
  description: string;
  /** Stat modifiers applied after point-buy (clamped to 1–10). */
  modifiers: Partial<Record<StatKey, number>>;
}

export const BACKGROUND_TRAITS: BackgroundTrait[] = [
  { id: "war_hero", name: "War Hero", description: "Service record and steel.", modifiers: { composure: 2, charisma: 1, negotiation: -1 } },
  { id: "business_mogul", name: "Business Mogul", description: "Deep pockets, sharp elbows.", modifiers: { fundraising: 3, negotiation: 1, integrity: -1 } },
  { id: "academic", name: "Academic", description: "Wonkish and credible.", modifiers: { intelligence: 3, charisma: -1, mediaSavvy: -1 } },
  { id: "machine_boss", name: "Machine Boss", description: "The party owes you.", modifiers: { negotiation: 3, fundraising: 1, integrity: -2 } },
  { id: "outsider", name: "Outsider", description: "Runs against the system.", modifiers: { charisma: 2, mediaSavvy: 1, negotiation: -2 } },
  { id: "reformer", name: "Reformer", description: "Clean hands, big promises.", modifiers: { integrity: 3, composure: 1, fundraising: -1 } },
  { id: "celebrity", name: "Celebrity", description: "Famous before politics.", modifiers: { charisma: 2, mediaSavvy: 3, intelligence: -1 } },
  { id: "prosecutor", name: "Prosecutor", description: "Tough, disciplined record.", modifiers: { composure: 2, intelligence: 1, charisma: -1 } },
];

export function traitById(id: string): BackgroundTrait | undefined {
  return BACKGROUND_TRAITS.find((t) => t.id === id);
}

const clampStat = (n: number): number =>
  n < STAT_MIN ? STAT_MIN : n > STAT_MAX ? STAT_MAX : n;

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** Validate a point-buy allocation (before trait modifiers). */
export function validatePointBuy(stats: CandidateStats): ValidationResult {
  const errors: string[] = [];
  let total = 0;
  for (const key of STAT_KEYS) {
    const v = stats[key];
    if (!Number.isInteger(v)) errors.push(`${key} must be an integer`);
    if (v < STAT_MIN || v > STAT_MAX) errors.push(`${key} must be ${STAT_MIN}–${STAT_MAX}`);
    total += v;
  }
  if (total !== POINT_BUY_TOTAL) {
    errors.push(`stats must total ${POINT_BUY_TOTAL} points (got ${total})`);
  }
  return { ok: errors.length === 0, errors };
}

/** Apply a background trait's modifiers to a stat block (clamped). */
export function applyTrait(stats: CandidateStats, trait: BackgroundTrait): CandidateStats {
  const out = { ...stats };
  for (const key of STAT_KEYS) {
    const mod = trait.modifiers[key];
    if (mod) out[key] = clampStat(out[key] + mod);
  }
  return out;
}

export interface CreateCharacterInput {
  id: string;
  name: string;
  party: PartyId;
  stats: CandidateStats;
  traitId: string;
  positions: Record<IssueId, number>;
}

/** Build a Candidate from a validated point-buy + trait choice. */
export function createCharacter(input: CreateCharacterInput): Candidate {
  const validation = validatePointBuy(input.stats);
  if (!validation.ok) {
    throw new Error(`Invalid character: ${validation.errors.join("; ")}`);
  }
  const trait = traitById(input.traitId);
  if (!trait) throw new Error(`Unknown background trait '${input.traitId}'`);
  return {
    id: input.id,
    name: input.name,
    party: input.party,
    stats: applyTrait(input.stats, trait),
    positions: { ...input.positions },
  };
}

/** A balanced default allocation (5 across the board) for quick starts/tests. */
export function balancedStats(): CandidateStats {
  return {
    charisma: 5,
    intelligence: 5,
    stamina: 5,
    fundraising: 5,
    composure: 5,
    integrity: 5,
    mediaSavvy: 5,
    negotiation: 5,
  };
}
