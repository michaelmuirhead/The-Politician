import { describe, it, expect } from "vitest";
import { applyCommand, initState } from "../engine.js";
import { burlingtonScenario, burlingtonSeats } from "../data/burlingtonVT.js";
import { checkAuthority, isWithin } from "./gate.js";
import type { GovernCommand } from "./gate.js";
import type { Scenario } from "../models/types.js";

const clone = (s: Scenario): Scenario => JSON.parse(JSON.stringify(s)) as Scenario;

const baseState = initState(burlingtonScenario, { ...burlingtonSeats });

function enact(over: Partial<GovernCommand>): GovernCommand {
  return {
    kind: "enactPower",
    actorId: "bob",
    officeId: "mayor_burlington",
    powerId: "set_property_tax",
    targetJurisdictionId: "burlington",
    ...over,
  };
}

describe("authority gate — legal commands", () => {
  it("lets the mayor set the property tax in their own city", () => {
    const { state, result } = applyCommand(baseState, enact({}));
    expect(result.ok).toBe(true);
    expect(state.enacted).toHaveLength(1);
  });

  it("lets the council member use a power they hold in their ward", () => {
    const { result } = applyCommand(
      baseState,
      enact({ actorId: "alice", officeId: "council_ward1", powerId: "zoning_reform", targetJurisdictionId: "ward1" }),
    );
    expect(result.ok).toBe(true);
  });
});

describe("authority gate — illegal commands are refused", () => {
  it("refuses a city seat reaching a federal power (mayor can't embargo a nation)", () => {
    const { state, result } = applyCommand(
      baseState,
      enact({ powerId: "impose_embargo", targetJurisdictionId: "burlington" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("power_not_in_office");
    expect(state.enacted).toHaveLength(0); // state unchanged
  });

  it("refuses acting on a jurisdiction the office doesn't govern", () => {
    const { result } = applyCommand(baseState, enact({ targetJurisdictionId: "vt" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("out_of_jurisdiction");
  });

  it("refuses a council member invoking a power outside their grant", () => {
    const { result } = applyCommand(
      baseState,
      enact({ actorId: "alice", officeId: "council_ward1", powerId: "set_property_tax", targetJurisdictionId: "ward1" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("power_not_in_office");
  });

  it("refuses someone who does not hold the office", () => {
    const { result } = applyCommand(baseState, enact({ actorId: "carol" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_officeholder");
  });

  it("refuses a tier mismatch even when the power id is granted", () => {
    // Misconfigured scenario: a city office is granted a federal power id.
    const broken = clone(burlingtonScenario);
    broken.offices.find((o) => o.id === "mayor_burlington")!.powers.push("impose_embargo");
    const seats = { ...burlingtonSeats };
    const check = checkAuthority(broken, seats, enact({ powerId: "impose_embargo" }));
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("tier_mismatch");
  });
});

describe("authority gate — federal seat reaching its own jurisdiction", () => {
  it("lets the U.S. Representative impose an embargo at the national level when granted", () => {
    // Give the federal office national reach over the USA node and seat Carol.
    const scenario = clone(burlingtonScenario);
    scenario.offices.find((o) => o.id === "us_house_vt")!.jurisdictionId = "usa";
    scenario.powers.find((p) => p.id === "impose_embargo")!.reach = "own";
    const state = initState(scenario, { ...burlingtonSeats });
    const { result } = applyCommand(
      state,
      enact({ actorId: "carol", officeId: "us_house_vt", powerId: "impose_embargo", targetJurisdictionId: "usa" }),
    );
    expect(result.ok).toBe(true);
  });
});

describe("jurisdiction nesting", () => {
  it("recognizes descendants in the nested world", () => {
    expect(isWithin(burlingtonScenario.units, "ward1", "burlington")).toBe(true);
    expect(isWithin(burlingtonScenario.units, "ward1", "vt")).toBe(true);
    expect(isWithin(burlingtonScenario.units, "ward1", "usa")).toBe(true);
    expect(isWithin(burlingtonScenario.units, "burlington", "ward1")).toBe(false);
  });
});
