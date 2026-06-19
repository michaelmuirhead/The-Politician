import { describe, it, expect } from "vitest";
import { affinity, issueScore } from "./support.js";
import { tallyUnit } from "./election.js";
import { burlingtonScenario } from "../data/burlingtonVT.js";
import type { Candidate } from "../models/types.js";

const scenario = burlingtonScenario;
const students = scenario.demographics.find((d) => d.id === "students")!;
const prog = scenario.parties.find((p) => p.id === "prog")!;
const ward1 = scenario.units.find((u) => u.id === "ward1")!;

const baseCandidate: Candidate = {
  id: "test",
  name: "Test",
  party: "prog",
  stats: { charisma: 5, intelligence: 5, stamina: 5, fundraising: 5, composure: 5, integrity: 5, mediaSavvy: 5, negotiation: 5 },
  positions: { housing: 0, taxes: 0, policing: 0, climate: 0 },
};

describe("monotonicity", () => {
  it("moving a position toward a group's ideal raises its issue score", () => {
    // Students' housing ideal is −0.7. Step the candidate from 0 → −0.35 → −0.7.
    const far = { ...baseCandidate, positions: { ...baseCandidate.positions, housing: 0 } };
    const mid = { ...baseCandidate, positions: { ...baseCandidate.positions, housing: -0.35 } };
    const aligned = { ...baseCandidate, positions: { ...baseCandidate.positions, housing: -0.7 } };

    const sFar = issueScore(students, far);
    const sMid = issueScore(students, mid);
    const sAligned = issueScore(students, aligned);

    expect(sMid).toBeGreaterThan(sFar);
    expect(sAligned).toBeGreaterThan(sMid);
  });

  it("better alignment raises affinity", () => {
    const far = { ...baseCandidate, positions: { housing: 0.8, taxes: 0.8, policing: 0.8, climate: 0.8 } };
    const aligned = { ...baseCandidate, positions: { housing: -0.7, taxes: -0.5, policing: -0.6, climate: -0.8 } };
    expect(affinity(students, aligned, prog, ward1)).toBeGreaterThan(
      affinity(students, far, prog, ward1),
    );
  });

  it("higher charisma never lowers affinity", () => {
    const low = { ...baseCandidate, stats: { ...baseCandidate.stats, charisma: 1 } };
    const high = { ...baseCandidate, stats: { ...baseCandidate.stats, charisma: 10 } };
    expect(affinity(students, high, prog, ward1)).toBeGreaterThanOrEqual(
      affinity(students, low, prog, ward1),
    );
  });

  it("aligning a candidate raises their vote share in a unit", () => {
    const challenger: Candidate = { ...baseCandidate, id: "ch" };
    const incumbent = scenario.candidates.find((c) => c.id === "carol")!; // right-leaning

    const misaligned = { ...challenger, positions: { housing: 0.5, taxes: 0.5, policing: 0.5, climate: 0.5 } };
    const aligned = { ...challenger, positions: { housing: -0.7, taxes: -0.5, policing: -0.6, climate: -0.8 } };

    const before = tallyUnit(scenario, ward1, [misaligned, incumbent]).shares["ch"]!;
    const after = tallyUnit(scenario, ward1, [aligned, incumbent]).shares["ch"]!;
    expect(after).toBeGreaterThan(before);
  });
});
