import { describe, it, expect } from "vitest";
import { driftWardLeans, driftAfterTerm } from "./progression.js";
import { burlingtonScenario } from "../data/burlingtonVT.js";

const scenario = burlingtonScenario;
const prog = scenario.parties.find((p) => p.id === "prog")!;
const wardLean = (s: typeof scenario, id: string) =>
  s.units.find((u) => u.id === id)!.currentLean;

describe("leaning drift (§5.5)", () => {
  it("a successful progressive incumbent pulls wards further left", () => {
    const before = wardLean(scenario, "ward4"); // −0.45, room to move
    const after = driftAfterTerm(scenario, "burlington", 0.6, prog);
    expect(wardLean(after, "ward4")).toBeLessThan(before); // more progressive
  });

  it("a failed incumbent pushes leanings away from their party", () => {
    const before = wardLean(scenario, "ward4");
    const after = driftWardLeans(scenario, "burlington", -0.6, prog.lean);
    expect(wardLean(after, "ward4")).toBeGreaterThan(before); // less progressive
  });

  it("reverts toward baseline when the record is neutral", () => {
    // Start a ward off its baseline, then drift with record 0.
    const shifted = {
      ...scenario,
      units: scenario.units.map((u) =>
        u.id === "ward4" ? { ...u, currentLean: u.baselineLean - 0.3 } : u,
      ),
    };
    const before = wardLean(shifted, "ward4");
    const after = driftWardLeans(shifted, "burlington", 0, prog.lean);
    const baseline = scenario.units.find((u) => u.id === "ward4")!.baselineLean;
    // Moves back toward baseline (which is greater than the shifted value).
    expect(wardLean(after, "ward4")).toBeGreaterThan(before);
    expect(wardLean(after, "ward4")).toBeLessThanOrEqual(baseline);
  });

  it("leaves wards of other cities untouched", () => {
    const after = driftAfterTerm(scenario, "burlington", 0.6, prog);
    // The state/nation nodes are not wards and must be unchanged.
    expect(after.units.find((u) => u.id === "vt")!.currentLean).toBe(
      scenario.units.find((u) => u.id === "vt")!.currentLean,
    );
  });
});
