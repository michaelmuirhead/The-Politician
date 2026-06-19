import { describe, it, expect } from "vitest";
import { initCampaign, advanceWeek, apBudgetFor } from "./state.js";
import { applyCampaignAction, ACTION_COSTS } from "./actions.js";
import { burlingtonScenario } from "../data/burlingtonVT.js";

const candidates = burlingtonScenario.candidates;
const units = ["ward1", "ward2", "ward3", "ward4", "ward5"];

function fresh() {
  return initCampaign("mayor_burlington", units, candidates, 8);
}

describe("campaign loop", () => {
  it("seeds resources and an AP budget per candidate", () => {
    const c = fresh();
    const alice = candidates.find((x) => x.id === "alice")!;
    expect(c.resources["alice"]!.ap).toBe(apBudgetFor(alice));
    expect(c.resources["alice"]!.money).toBe(alice.stats.fundraising * 5);
  });

  it("a rally builds pressure and spends AP + money", () => {
    const c = fresh();
    const before = c.resources["alice"]!;
    const r = applyCampaignAction(c, "alice", { kind: "rally", unitId: "ward1" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.pressure["alice"]!["ward1"]!).toBeGreaterThan(0);
    expect(r.state.resources["alice"]!.ap).toBe(before.ap - ACTION_COSTS.rally.ap);
    expect(r.state.resources["alice"]!.money).toBe(before.money - ACTION_COSTS.rally.money);
  });

  it("refuses an action the candidate cannot afford", () => {
    let c = fresh();
    // Drain AP with repeated rallies until it can't afford another.
    let guard = 20;
    while (guard-- > 0) {
      const r = applyCampaignAction(c, "alice", { kind: "rally", unitId: "ward1" });
      if (!r.ok) {
        expect(r.reason).toMatch(/afford/);
        return;
      }
      c = r.state;
    }
    throw new Error("expected an unaffordable refusal");
  });

  it("a fundraiser adds money", () => {
    const c = fresh();
    const before = c.resources["bob"]!.money;
    const r = applyCampaignAction(c, "bob", { kind: "fundraiser" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.resources["bob"]!.money).toBeGreaterThan(before);
  });

  it("attack ads reduce a target's pressure", () => {
    let c = fresh();
    c = (applyCampaignAction(c, "carol", { kind: "rally", unitId: "ward4" }) as any).state;
    const target = c.pressure["carol"]!["ward4"]!;
    const r = applyCampaignAction(c, "bob", { kind: "attackAd", unitId: "ward4", targetId: "carol" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.pressure["carol"]!["ward4"]!).toBeLessThan(target);
  });

  it("advancing a week decays pressure and refills AP", () => {
    let c = fresh();
    c = (applyCampaignAction(c, "alice", { kind: "rally", unitId: "ward1" }) as any).state;
    const peak = c.pressure["alice"]!["ward1"]!;
    const next = advanceWeek(c);
    expect(next.pressure["alice"]!["ward1"]!).toBeLessThan(peak);
    expect(next.resources["alice"]!.ap).toBe(next.apBudget["alice"]!);
    expect(next.week).toBe(1);
  });
});
