/**
 * Golden-master / balance regression (GAME_DESIGN.md §13 M2).
 *
 * Locks a full all-AI campaign + election to a known, deterministic outcome.
 * If the simulation or AI changes the result, this fails loudly — the signal to
 * re-baseline intentionally rather than drift by accident.
 */
import { describe, it, expect } from "vitest";
import {
  burlingtonScenario,
  initCampaign,
  advanceWeek,
  aiCampaignWeek,
  pressureByUnit,
  runElection,
  type ElectionResult,
} from "./index.js";

const wards = ["ward1", "ward2", "ward3", "ward4", "ward5"];

function allAiElection(): ElectionResult {
  let c = initCampaign("mayor_burlington", wards, burlingtonScenario.candidates, 6);
  for (let w = 0; w < 6; w++) {
    for (const id of ["alice", "bob", "carol"]) c = aiCampaignWeek(burlingtonScenario, c, id).campaign;
    c = advanceWeek(c);
  }
  return runElection(burlingtonScenario, c.candidates, {
    seed: "golden",
    units: burlingtonScenario.units.filter((u) => u.kind === "ward"),
    pressureByUnit: pressureByUnit(c),
  });
}

describe("golden master: all-AI mayoral race", () => {
  it("is fully reproducible run-to-run", () => {
    expect(allAiElection()).toEqual(allAiElection());
  });

  it("matches the pinned baseline outcome", () => {
    const result = allAiElection();
    expect(result.seatsByCandidate).toEqual({ alice: 1, bob: 4, carol: 0 });
    // Vote totals pinned to the nearest whole vote (guards against model drift).
    expect(Math.round(result.votesByCandidate["alice"]!)).toBe(5260);
    expect(Math.round(result.votesByCandidate["bob"]!)).toBe(5533);
    expect(Math.round(result.votesByCandidate["carol"]!)).toBe(4293);
  });
});
