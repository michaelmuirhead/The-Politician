import { describe, it, expect } from "vitest";
import { initCampaign, advanceWeek, pressureByUnit } from "../campaign/index.js";
import { runElection } from "../sim/index.js";
import { aiCampaignWeek, projectedShare } from "./campaign.js";
import { weightsForCandidate } from "./objective.js";
import { burlingtonScenario } from "../data/burlingtonVT.js";

const scenario = burlingtonScenario;
const wards = ["ward1", "ward2", "ward3", "ward4", "ward5"];
const fresh = () => initCampaign("mayor_burlington", wards, scenario.candidates, 8);

describe("campaign AI", () => {
  it("projectedShare returns a valid share", () => {
    const s = projectedShare(scenario, fresh(), "alice");
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });

  it("a week of AI play raises the actor's own projected share", () => {
    let c = fresh();
    const base = projectedShare(scenario, c, "alice");
    for (let w = 0; w < 3; w++) {
      c = aiCampaignWeek(scenario, c, "alice").campaign;
      c = advanceWeek(c);
    }
    expect(projectedShare(scenario, c, "alice")).toBeGreaterThan(base);
  });

  it("spends action points each week", () => {
    const c = fresh();
    const { campaign, actions } = aiCampaignWeek(scenario, c, "bob");
    expect(actions.length).toBeGreaterThan(0);
    expect(campaign.resources["bob"]!.ap).toBeLessThan(c.resources["bob"]!.ap);
  });

  it("an AI campaigner beats idle opponents", () => {
    let c = fresh();
    for (let w = 0; w < 6; w++) {
      c = aiCampaignWeek(scenario, c, "alice").campaign; // only Alice campaigns
      c = advanceWeek(c);
    }
    const result = runElection(scenario, c.candidates, {
      seed: "ai-test",
      units: scenario.units.filter((u) => u.kind === "ward"),
      pressureByUnit: pressureByUnit(c),
    });
    expect(result.votesByCandidate["alice"]!).toBeGreaterThan(result.votesByCandidate["bob"]!);
    expect(result.votesByCandidate["alice"]!).toBeGreaterThan(result.votesByCandidate["carol"]!);
  });

  it("derives trait-weighted objectives", () => {
    const lowIntegrity = { ...scenario.candidates[0]!, stats: { ...scenario.candidates[0]!.stats, integrity: 3 } };
    expect(weightsForCandidate(lowIntegrity).ego).toBeGreaterThan(weightsForCandidate(scenario.candidates[0]!).ego);
  });
});
