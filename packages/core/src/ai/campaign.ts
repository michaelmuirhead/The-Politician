/**
 * Heuristic campaign AI (GAME_DESIGN.md §10.3–10.4).
 *
 * A greedy objective-function actor: each turn it enumerates affordable actions,
 * scores them by their marginal effect on its projected vote share (using the
 * pure sim as a one-step lookahead, §10.8), and takes the best per action point
 * until its AP runs out. No hidden powers — it plays the player's exact moves.
 */
import type { Candidate, Scenario, CharacterId } from "../models/types.js";
import {
  applyCampaignAction,
  pressureByUnit,
  type CampaignState,
  type CampaignAction,
} from "../campaign/index.js";
import { runElection } from "../sim/index.js";
import { weightsForCandidate } from "./objective.js";

const PROJECT_SEED = "ai-lookahead";

/** Projected vote share for a candidate given the current campaign pressures. */
export function projectedShare(
  scenario: Scenario,
  campaign: CampaignState,
  candidateId: CharacterId,
): number {
  const units = scenario.units.filter((u) => campaign.units.includes(u.id));
  const result = runElection(scenario, campaign.candidates, {
    seed: PROJECT_SEED,
    units,
    pressureByUnit: pressureByUnit(campaign),
  });
  const total = Object.values(result.votesByCandidate).reduce((a, b) => a + b, 0) || 1;
  return (result.votesByCandidate[candidateId] ?? 0) / total;
}

/** The current front-runner among the other candidates (an attack target). */
function leadingRival(
  scenario: Scenario,
  campaign: CampaignState,
  candidateId: CharacterId,
): CharacterId | undefined {
  let best: CharacterId | undefined;
  let bestShare = -1;
  for (const c of campaign.candidates) {
    if (c.id === candidateId) continue;
    const share = projectedShare(scenario, campaign, c.id);
    if (share > bestShare) {
      bestShare = share;
      best = c.id;
    }
  }
  return best;
}

/** All actions a candidate could afford right now. */
function candidateActions(
  scenario: Scenario,
  campaign: CampaignState,
  candidateId: CharacterId,
): CampaignAction[] {
  const actions: CampaignAction[] = [{ kind: "fundraiser" }];
  const rival = leadingRival(scenario, campaign, candidateId);
  for (const unitId of campaign.units) {
    actions.push({ kind: "rally", unitId });
    actions.push({ kind: "ads", unitId });
    actions.push({ kind: "retail", unitId });
    if (rival) actions.push({ kind: "attackAd", unitId, targetId: rival });
  }
  return actions;
}

const AP_COST: Record<CampaignAction["kind"], number> = {
  rally: 2,
  ads: 1,
  retail: 2,
  attackAd: 1,
  fundraiser: 2,
  stakePosition: 1,
};

/** Plan and apply one full campaign week for an AI candidate. Returns new state. */
export function aiCampaignWeek(
  scenario: Scenario,
  campaign: CampaignState,
  candidateId: CharacterId,
): { campaign: CampaignState; actions: CampaignAction[] } {
  const weights = weightsForCandidate(scenario.candidates.find((c) => c.id === candidateId) ?? campaign.candidates[0]!);
  let state = campaign;
  const taken: CampaignAction[] = [];
  let guard = 16;

  while (guard-- > 0) {
    const res = state.resources[candidateId];
    if (!res || res.ap < 1) break;
    const base = projectedShare(scenario, state, candidateId);

    let bestAction: CampaignAction | undefined;
    let bestScore = 0; // require a strictly positive, AP-efficient gain
    let bestNext: CampaignState | undefined;

    for (const action of candidateActions(scenario, state, candidateId)) {
      const trial = applyCampaignAction(state, candidateId, action);
      if (!trial.ok) continue;
      let gain: number;
      if (action.kind === "fundraiser") {
        // No direct share gain; valued only as enabling future spend when broke.
        gain = res.money < 6 ? 0.001 * weights.war : -1;
      } else {
        const share = projectedShare(scenario, trial.state, candidateId);
        gain = share - base;
        if (action.kind === "attackAd") gain *= 1 + weights.ego; // negativity preference
      }
      const perAp = gain / AP_COST[action.kind];
      if (perAp > bestScore) {
        bestScore = perAp;
        bestAction = action;
        bestNext = trial.state;
      }
    }

    if (!bestAction || !bestNext) {
      // Nothing improves share; fundraise if we can, else stop.
      if (res.money < 10 && res.ap >= AP_COST.fundraiser) {
        const fr = applyCampaignAction(state, candidateId, { kind: "fundraiser" });
        if (fr.ok) {
          state = fr.state;
          taken.push({ kind: "fundraiser" });
          continue;
        }
      }
      break;
    }
    state = bestNext;
    taken.push(bestAction);
  }

  return { campaign: state, actions: taken };
}
