import { describe, it, expect } from "vitest";
import { runElection } from "./election.js";
import { burlingtonScenario } from "../data/burlingtonVT.js";

const candidates = burlingtonScenario.candidates;

describe("determinism", () => {
  it("produces identical results for the same seed (with noise)", () => {
    const config = { noise: 0.1 };
    const a = runElection(burlingtonScenario, candidates, { seed: "election-2026", config });
    const b = runElection(burlingtonScenario, candidates, { seed: "election-2026", config });
    expect(a).toEqual(b);
  });

  it("is fully deterministic with no noise regardless of seed", () => {
    const a = runElection(burlingtonScenario, candidates, { seed: 1 });
    const b = runElection(burlingtonScenario, candidates, { seed: 999 });
    expect(a).toEqual(b);
  });

  it("can diverge across seeds once noise is introduced", () => {
    const config = { noise: 0.25 };
    const a = runElection(burlingtonScenario, candidates, { seed: "a", config });
    const b = runElection(burlingtonScenario, candidates, { seed: "b", config });
    expect(a).not.toEqual(b);
  });

  it("awards every ward's seat and conserves the seat count", () => {
    const result = runElection(burlingtonScenario, candidates, { seed: 1 });
    const wardSeats = burlingtonScenario.units
      .filter((u) => u.kind === "ward")
      .reduce((sum, u) => sum + u.seats, 0);
    const awarded = Object.values(result.seatsByCandidate).reduce((a, b) => a + b, 0);
    expect(awarded).toBe(wardSeats);
  });
});
