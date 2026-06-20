import { describe, it, expect } from "vitest";
import {
  drawEvent,
  drawGovernEvent,
  applyWorldEffect,
  applyResourceEffect,
  autoChoice,
} from "./engine.js";
import { GOVERN_EVENTS, CAMPAIGN_EVENTS } from "./pool.js";
import { makeRng } from "../rng.js";
import { initCityWorld } from "../world/state.js";
import { burlingtonScenario } from "../data/burlingtonVT.js";

describe("events", () => {
  it("draws deterministically for a given seed", () => {
    const a = drawEvent(makeRng(42), GOVERN_EVENTS, 1);
    const b = drawEvent(makeRng(42), GOVERN_EVENTS, 1);
    expect(a?.id).toBe(b?.id);
  });

  it("returns undefined when the probability roll fails", () => {
    expect(drawGovernEvent(makeRng(1), 0)).toBeUndefined();
  });

  it("always draws something at probability 1", () => {
    const e = drawEvent(makeRng(7), CAMPAIGN_EVENTS, 1);
    expect(e).toBeDefined();
  });

  it("applies and clamps world effects", () => {
    const w = initCityWorld(burlingtonScenario, "burlington");
    const after = applyWorldEffect(w, { world: { infrastructure: 0.2, treasury: -45 } });
    expect(after.services.infrastructure).toBeCloseTo(w.services.infrastructure + 0.2);
    expect(after.treasury).toBe(w.treasury - 45);
  });

  it("floors resources at zero", () => {
    const res = { ap: 4, money: 10, capital: 1 };
    expect(applyResourceEffect(res, { capital: -5 }).capital).toBe(0);
  });

  it("auto-resolves to the stronger choice", () => {
    const waterMain = GOVERN_EVENTS.find((e) => e.id === "water_main")!;
    expect(autoChoice(waterMain).id).toBe("repair"); // higher infrastructure than patch
  });
});
