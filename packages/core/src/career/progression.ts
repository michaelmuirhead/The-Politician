/**
 * Political-leaning drift & between-term progression (GAME_DESIGN.md §5.5, §8).
 *
 * A successful, popular incumbent slowly shifts a place's `currentLean` toward
 * their own party; neglect lets it snap back. Mean-reversion toward the
 * historically-seeded `baselineLean` gives leanings inertia, so realignment is a
 * hard-won, multi-term achievement rather than a per-election reset.
 */
import type { Party, Scenario, Unit, UnitId } from "../models/types.js";

/** How strongly governance success pulls a unit's lean toward the incumbent. */
export const GOVERNANCE_PULL = 0.15;
/** How strongly leanings revert toward their historical baseline. */
export const MEAN_REVERSION = 0.08;

const clampLean = (x: number): number => (x < -1 ? -1 : x > 1 ? 1 : x);

/**
 * Drift the leans of wards under a city after a term.
 * @param record    The incumbent's overall record, −1 … +1 (§7.2).
 * @param partyLean The incumbent party's lean (the direction success pulls).
 */
export function driftWardLeans(
  scenario: Scenario,
  cityId: UnitId,
  record: number,
  partyLean: number,
): Scenario {
  const units: Unit[] = scenario.units.map((u) => {
    if (u.parentId !== cityId || u.kind !== "ward") return u;
    const governance = GOVERNANCE_PULL * record * (partyLean - u.currentLean);
    const reversion = MEAN_REVERSION * (u.currentLean - u.baselineLean);
    return { ...u, currentLean: clampLean(u.currentLean + governance - reversion) };
  });
  return { ...scenario, units };
}

/** Convenience: drift using an incumbent's party object. */
export function driftAfterTerm(
  scenario: Scenario,
  cityId: UnitId,
  record: number,
  incumbentParty: Party,
): Scenario {
  return driftWardLeans(scenario, cityId, record, incumbentParty.lean);
}
