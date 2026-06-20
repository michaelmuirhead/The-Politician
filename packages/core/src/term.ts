/**
 * Term state machine (GAME_DESIGN.md §3): Campaign → Election → Govern → End.
 *
 * A pure orchestration layer composing the campaign loop (§6), the authority
 * gate (§7.4), the city world model (§7.2) and the support sim (§5). The CLI
 * drives it; everything here is a deterministic transition.
 */
import type { Office, Scenario, Unit, UnitId, CharacterId } from "./models/types.js";
import { checkAuthority, type GovernCommand, type SeatMap } from "./authority/gate.js";
import {
  initCampaign,
  advanceWeek,
  pressureByUnit,
  applyCampaignAction,
  type CampaignState,
  type CampaignAction,
} from "./campaign/index.js";
import { runElection, type ElectionResult } from "./sim/index.js";
import {
  initCityWorld,
  tickCityWorld,
  applyCityPower,
  type CityWorldState,
  type PowerArgs,
} from "./world/index.js";

export type TermPhase = "campaign" | "govern" | "ended";

export interface TermState {
  phase: TermPhase;
  scenario: Scenario;
  office: Office;
  /** The wards contested for this office. */
  units: UnitId[];
  campaign: CampaignState;
  seats: SeatMap;
  world?: CityWorldState;
  winnerId?: CharacterId;
  lastElection?: ElectionResult;
  quarter: number;
  quartersTotal: number;
  log: string[];
  seed: number | string;
  /** Incumbent record by candidate id, applied at the election. */
  record: Record<CharacterId, number>;
}

/** Wards governed by / contested for an office (descendants of its jurisdiction). */
export function unitsForOffice(scenario: Scenario, office: Office): Unit[] {
  const byId = new Map(scenario.units.map((u) => [u.id, u]));
  const isDescendant = (unitId: UnitId): boolean => {
    let cursor: UnitId | undefined = unitId;
    while (cursor) {
      if (cursor === office.jurisdictionId) return true;
      cursor = byId.get(cursor)?.parentId;
    }
    return false;
  };
  return scenario.units.filter((u) => u.kind === "ward" && isDescendant(u.id));
}

export interface StartTermOptions {
  officeId: string;
  candidateIds: CharacterId[];
  weeksTotal?: number;
  quartersTotal?: number;
  seed?: number | string;
  /** Incumbent record by candidate id, folded into the election (re-election). */
  record?: Record<CharacterId, number>;
}

export function startTerm(scenario: Scenario, opts: StartTermOptions): TermState {
  const office = scenario.offices.find((o) => o.id === opts.officeId);
  if (!office) throw new Error(`Unknown office ${opts.officeId}`);
  const units = unitsForOffice(scenario, office);
  const candidates = scenario.candidates.filter((c) => opts.candidateIds.includes(c.id));
  if (candidates.length === 0) throw new Error("No candidates for term");

  const weeksTotal = opts.weeksTotal ?? 8;
  return {
    phase: "campaign",
    scenario,
    office,
    units: units.map((u) => u.id),
    campaign: initCampaign(office.id, units.map((u) => u.id), candidates, weeksTotal),
    seats: {},
    quarter: 0,
    quartersTotal: opts.quartersTotal ?? 16,
    log: [`Campaign for ${office.name} begins (${candidates.length} candidates).`],
    seed: opts.seed ?? 1,
    record: opts.record ?? {},
  };
}

/** Apply a campaign action for a candidate during the campaign phase. */
export function termCampaignAction(
  state: TermState,
  candidateId: CharacterId,
  action: CampaignAction,
): { state: TermState; note: string } {
  if (state.phase !== "campaign") return { state, note: "not in campaign phase" };
  const result = applyCampaignAction(state.campaign, candidateId, action);
  if (!result.ok) return { state, note: `refused: ${result.reason}` };
  return { state: { ...state, campaign: result.state }, note: result.note };
}

/** End the current campaign week (decay pressure, refill AP). */
export function termEndWeek(state: TermState): TermState {
  if (state.phase !== "campaign") return state;
  return { ...state, campaign: advanceWeek(state.campaign) };
}

/** Resolve the election: tally votes, seat the winner, enter govern phase. */
export function resolveElection(state: TermState): TermState {
  if (state.phase !== "campaign") return state;
  const units = state.scenario.units.filter((u) => state.units.includes(u.id));
  const result = runElection(state.scenario, state.campaign.candidates, {
    seed: state.seed,
    units,
    pressureByUnit: pressureByUnit(state.campaign),
    record: state.record,
  });
  const winnerId = Object.entries(result.votesByCandidate).reduce(
    (best, [id, v]) => (v > (result.votesByCandidate[best] ?? -1) ? id : best),
    Object.keys(result.votesByCandidate)[0] ?? "",
  );
  const winnerName = state.scenario.candidates.find((c) => c.id === winnerId)?.name ?? winnerId;
  return {
    ...state,
    phase: "govern",
    winnerId,
    lastElection: result,
    seats: { ...state.seats, [state.office.id]: winnerId },
    world: initCityWorld(state.scenario, state.office.jurisdictionId),
    log: [...state.log, `Election decided: ${winnerName} wins ${state.office.name}.`],
  };
}

export type GovernActionResult = { state: TermState; ok: boolean; note: string };

/**
 * Enact a governing power during the govern phase. Gate-checked (§7.4); on
 * success the power's world effect is applied. Illegal commands are refused.
 */
export function termEnactPower(
  state: TermState,
  command: GovernCommand,
  args: PowerArgs = {},
): GovernActionResult {
  if (state.phase !== "govern" || !state.world) {
    return { state, ok: false, note: "not in govern phase" };
  }
  const check = checkAuthority(state.scenario, state.seats, command);
  if (!check.ok) {
    return { state, ok: false, note: `refused (${check.reason}): ${check.detail}` };
  }
  const outcome = applyCityPower(state.world, command.powerId, args);
  return {
    state: { ...state, world: outcome.world, log: [...state.log, outcome.note] },
    ok: true,
    note: outcome.note,
  };
}

/** Advance one governing quarter (world tick). Ends the term at the limit. */
export function advanceQuarter(state: TermState): TermState {
  if (state.phase !== "govern" || !state.world) return state;
  const world = tickCityWorld(state.world);
  const quarter = state.quarter + 1;
  if (quarter >= state.quartersTotal) {
    return { ...state, world, quarter, phase: "ended", log: [...state.log, "Term complete."] };
  }
  return { ...state, world, quarter };
}
