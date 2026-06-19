/**
 * Campaign Mode state (GAME_DESIGN.md §6).
 *
 * Weekly turns: candidates spend resources (Action Points / Money / Political
 * Capital) on actions that build per-unit campaign pressure, which decays each
 * week so campaigning needs sustained investment. Pure, seedable.
 */
import type { Candidate, OfficeId, UnitId, CharacterId } from "../models/types.js";

export interface CampaignResources {
  ap: number;
  money: number;
  capital: number;
}

export interface CampaignState {
  officeId: OfficeId;
  /** Units (wards) in contention. */
  units: UnitId[];
  /** Participating candidates (mutable copies — positions can shift). */
  candidates: Candidate[];
  week: number;
  weeksTotal: number;
  /** Resources per candidate id. */
  resources: Record<CharacterId, CampaignResources>;
  /** Campaign pressure per candidate id → unit id. */
  pressure: Record<CharacterId, Record<UnitId, number>>;
  /** Per-candidate per-week action-point budget (stamina-derived). */
  apBudget: Record<CharacterId, number>;
  log: string[];
}

export const PRESSURE_DECAY = 0.85;

/** Weekly action-point budget from a candidate's stamina (§4.1: stamina = moves). */
export function apBudgetFor(candidate: Candidate): number {
  return 2 + Math.floor(candidate.stats.stamina / 3);
}

export function initCampaign(
  officeId: OfficeId,
  units: UnitId[],
  candidates: Candidate[],
  weeksTotal: number,
): CampaignState {
  const resources: Record<string, CampaignResources> = {};
  const pressure: Record<string, Record<string, number>> = {};
  const apBudget: Record<string, number> = {};
  for (const c of candidates) {
    apBudget[c.id] = apBudgetFor(c);
    resources[c.id] = {
      ap: apBudget[c.id] as number,
      money: c.stats.fundraising * 5,
      capital: 5,
    };
    pressure[c.id] = Object.fromEntries(units.map((u) => [u, 0]));
  }
  return {
    officeId,
    units,
    candidates: candidates.map((c) => ({ ...c, positions: { ...c.positions } })),
    week: 0,
    weeksTotal,
    resources,
    pressure,
    apBudget,
    log: [],
  };
}

/** Advance one week: decay all pressure, refill action points. */
export function advanceWeek(state: CampaignState): CampaignState {
  const pressure: Record<string, Record<string, number>> = {};
  const resources: Record<string, CampaignResources> = {};
  for (const c of state.candidates) {
    const unitMap = state.pressure[c.id] ?? {};
    pressure[c.id] = Object.fromEntries(
      Object.entries(unitMap).map(([u, p]) => [u, p * PRESSURE_DECAY]),
    );
    resources[c.id] = {
      ...(state.resources[c.id] as CampaignResources),
      ap: state.apBudget[c.id] as number,
    };
  }
  return { ...state, week: state.week + 1, pressure, resources };
}

/** Build the pressureByUnit map for runElection from current campaign pressure. */
export function pressureByUnit(state: CampaignState): Record<UnitId, Record<CharacterId, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const u of state.units) {
    out[u] = {};
    for (const c of state.candidates) {
      out[u]![c.id] = state.pressure[c.id]?.[u] ?? 0;
    }
  }
  return out;
}
