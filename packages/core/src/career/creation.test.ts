import { describe, it, expect } from "vitest";
import {
  validatePointBuy,
  applyTrait,
  createCharacter,
  traitById,
  balancedStats,
  POINT_BUY_TOTAL,
} from "./creation.js";

describe("character creation", () => {
  it("accepts a balanced 40-point allocation", () => {
    const result = validatePointBuy(balancedStats());
    expect(result.ok).toBe(true);
    expect(Object.values(balancedStats()).reduce((a, b) => a + b, 0)).toBe(POINT_BUY_TOTAL);
  });

  it("rejects an allocation that doesn't total the budget", () => {
    const stats = { ...balancedStats(), charisma: 10 };
    expect(validatePointBuy(stats).ok).toBe(false);
  });

  it("rejects out-of-range stats", () => {
    const stats = { ...balancedStats(), charisma: 0, intelligence: 10 };
    expect(validatePointBuy(stats).ok).toBe(false);
  });

  it("applies trait modifiers and clamps to 1–10", () => {
    const mogul = traitById("business_mogul")!;
    const modified = applyTrait(balancedStats(), mogul);
    expect(modified.fundraising).toBe(8); // 5 + 3
    expect(modified.integrity).toBe(4); // 5 − 1
  });

  it("builds a Candidate via createCharacter", () => {
    const c = createCharacter({
      id: "p1",
      name: "Player One",
      party: "dem",
      stats: balancedStats(),
      traitId: "reformer",
      positions: { housing: -0.2, taxes: 0, policing: 0, climate: -0.3 },
    });
    expect(c.stats.integrity).toBe(8); // reformer +3
    expect(c.name).toBe("Player One");
  });

  it("throws on an invalid allocation", () => {
    expect(() =>
      createCharacter({
        id: "x",
        name: "X",
        party: "dem",
        stats: { ...balancedStats(), charisma: 10 },
        traitId: "reformer",
        positions: {},
      }),
    ).toThrow();
  });
});
