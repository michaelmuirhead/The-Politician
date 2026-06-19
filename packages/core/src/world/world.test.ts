import { describe, it, expect } from "vitest";
import { initCityWorld, tickCityWorld, type CityWorldState } from "./state.js";
import { applyCityPower } from "./powers.js";
import { recordEffect, overallRecord } from "./record.js";
import { burlingtonScenario } from "../data/burlingtonVT.js";

const scenario = burlingtonScenario;

describe("city world model", () => {
  it("initializes population from the city's wards", () => {
    const w = initCityWorld(scenario, "burlington");
    const wardPop = scenario.units
      .filter((u) => u.parentId === "burlington" && u.kind === "ward")
      .reduce((s, u) => s + u.population, 0);
    expect(w.population).toBe(wardPop);
  });

  it("zoning reform raises housing and economy", () => {
    const w = initCityWorld(scenario, "burlington");
    const after = applyCityPower(w, "zoning_reform").world;
    expect(after.services.housing).toBeGreaterThan(w.services.housing);
    expect(after.economy).toBeGreaterThan(w.economy);
  });

  it("funding a service raises it and spends treasury", () => {
    const w = initCityWorld(scenario, "burlington");
    const after = applyCityPower(w, "city_budget", { service: "safety" }).world;
    expect(after.services.safety).toBeGreaterThan(w.services.safety);
    expect(after.treasury).toBeLessThan(w.treasury);
  });

  it("a quarter tick collects revenue and decays services", () => {
    const w = initCityWorld(scenario, "burlington");
    const after = tickCityWorld(w);
    expect(after.services.safety).toBeLessThan(w.services.safety);
    expect(after.treasury).not.toBe(w.treasury);
  });
});

describe("recordEffect feedback", () => {
  const groups = scenario.demographics;
  const goodWorld: CityWorldState = {
    cityId: "burlington",
    population: 26000,
    economy: 0.9,
    taxRate: 0.3,
    services: { safety: 0.9, housing: 0.9, infrastructure: 0.9 },
    treasury: 100,
  };
  const badWorld: CityWorldState = {
    ...goodWorld,
    economy: 0.1,
    taxRate: 0.9,
    services: { safety: 0.1, housing: 0.1, infrastructure: 0.1 },
  };

  it("rewards a well-run city and punishes a neglected one", () => {
    expect(overallRecord(groups, goodWorld)).toBeGreaterThan(0);
    expect(overallRecord(groups, badWorld)).toBeLessThan(0);
  });

  it("stays within [-1, 1]", () => {
    for (const g of groups) {
      const r = recordEffect(g, goodWorld);
      expect(r).toBeGreaterThanOrEqual(-1);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
});
