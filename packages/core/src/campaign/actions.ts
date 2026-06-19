/**
 * Campaign actions (GAME_DESIGN.md §6).
 *
 * Each action has an AP cost and optional money/capital cost, a target, and a
 * data-driven effect on campaign pressure (or resources/positions). Applied via
 * a pure reducer that refuses unaffordable or invalid actions.
 */
import type { CharacterId, IssueId, UnitId } from "../models/types.js";
import type { CampaignState, CampaignResources } from "./state.js";

export type CampaignAction =
  | { kind: "rally"; unitId: UnitId }
  | { kind: "ads"; unitId: UnitId }
  | { kind: "retail"; unitId: UnitId }
  | { kind: "attackAd"; unitId: UnitId; targetId: CharacterId }
  | { kind: "fundraiser" }
  | { kind: "stakePosition"; issue: IssueId; value: number };

export interface ActionCost {
  ap: number;
  money: number;
  capital: number;
}

export const ACTION_COSTS: Record<CampaignAction["kind"], ActionCost> = {
  rally: { ap: 2, money: 5, capital: 0 },
  ads: { ap: 1, money: 8, capital: 0 },
  retail: { ap: 2, money: 1, capital: 0 },
  attackAd: { ap: 1, money: 6, capital: 1 },
  fundraiser: { ap: 2, money: 0, capital: 0 },
  stakePosition: { ap: 1, money: 0, capital: 0 },
};

export type ActionResult =
  | { ok: true; state: CampaignState; note: string }
  | { ok: false; reason: string };

const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x);

function canAfford(res: CampaignResources, cost: ActionCost): boolean {
  return res.ap >= cost.ap && res.money >= cost.money && res.capital >= cost.capital;
}

function spend(res: CampaignResources, cost: ActionCost): CampaignResources {
  return { ap: res.ap - cost.ap, money: res.money - cost.money, capital: res.capital - cost.capital };
}

function addPressure(
  state: CampaignState,
  candidateId: CharacterId,
  unitId: UnitId,
  delta: number,
): Record<CharacterId, Record<UnitId, number>> {
  const pressure = { ...state.pressure };
  const unitMap = { ...(pressure[candidateId] ?? {}) };
  unitMap[unitId] = clamp((unitMap[unitId] ?? 0) + delta, 0, 100);
  pressure[candidateId] = unitMap;
  return pressure;
}

/** Apply a campaign action for a candidate. Pure: returns a new state or refusal. */
export function applyCampaignAction(
  state: CampaignState,
  candidateId: CharacterId,
  action: CampaignAction,
): ActionResult {
  const candidate = state.candidates.find((c) => c.id === candidateId);
  const res = state.resources[candidateId];
  if (!candidate || !res) return { ok: false, reason: `unknown candidate ${candidateId}` };

  const cost = ACTION_COSTS[action.kind];
  if (!canAfford(res, cost)) return { ok: false, reason: "cannot afford action" };

  const resources = { ...state.resources, [candidateId]: spend(res, cost) };
  const charisma = candidate.stats.charisma;
  const media = candidate.stats.mediaSavvy;

  switch (action.kind) {
    case "rally": {
      const delta = 3 + charisma * 0.3;
      return {
        ok: true,
        state: { ...state, resources, pressure: addPressure(state, candidateId, action.unitId, delta) },
        note: `${candidate.name} rallies in ${action.unitId} (+${delta.toFixed(1)})`,
      };
    }
    case "ads": {
      const delta = 2 + media * 0.3;
      return {
        ok: true,
        state: { ...state, resources, pressure: addPressure(state, candidateId, action.unitId, delta) },
        note: `${candidate.name} runs ads in ${action.unitId} (+${delta.toFixed(1)})`,
      };
    }
    case "retail": {
      const delta = 4 + charisma * 0.2; // high impact, small scale — dominant at city tier
      return {
        ok: true,
        state: { ...state, resources, pressure: addPressure(state, candidateId, action.unitId, delta) },
        note: `${candidate.name} knocks doors in ${action.unitId} (+${delta.toFixed(1)})`,
      };
    }
    case "attackAd": {
      const delta = -(2 + media * 0.2);
      return {
        ok: true,
        state: { ...state, resources, pressure: addPressure(state, action.targetId, action.unitId, delta) },
        note: `${candidate.name} attacks ${action.targetId} in ${action.unitId} (${delta.toFixed(1)})`,
      };
    }
    case "fundraiser": {
      const gain = candidate.stats.fundraising * 10;
      const updated = { ...resources, [candidateId]: { ...(resources[candidateId] as CampaignResources), money: (resources[candidateId] as CampaignResources).money + gain } };
      return {
        ok: true,
        state: { ...state, resources: updated },
        note: `${candidate.name} holds a fundraiser (+$${gain})`,
      };
    }
    case "stakePosition": {
      const candidates = state.candidates.map((c) =>
        c.id === candidateId
          ? { ...c, positions: { ...c.positions, [action.issue]: clamp(action.value, -1, 1) } }
          : c,
      );
      return {
        ok: true,
        state: { ...state, resources, candidates },
        note: `${candidate.name} takes a position on ${action.issue} (${action.value.toFixed(2)})`,
      };
    }
  }
}
