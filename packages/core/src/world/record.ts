/**
 * recordEffect (GAME_DESIGN.md §5.2 / §7.2).
 *
 * Groups react to the state of the world an incumbent has produced. Maps each
 * issue to a world metric, weights by the group's salience, and returns a
 * −1 … +1 effect folded into affinity for the incumbent. "Your record is the
 * world you produced."
 */
import type { Demographic } from "../models/types.js";
import type { CityWorldState } from "./state.js";

/** Per-issue satisfaction (0 … 1) implied by the current world. */
function issueSatisfaction(world: CityWorldState, issue: string): number {
  switch (issue) {
    case "housing":
      return world.services.housing;
    case "policing":
      return world.services.safety;
    case "climate":
      return world.services.infrastructure;
    case "taxes":
      // Everyone dislikes high taxes but values prosperity.
      return 0.5 * (1 - world.taxRate) + 0.5 * world.economy;
    default:
      return world.economy;
  }
}

/** The record effect for a group under the given world, −1 … +1. */
export function recordEffect(group: Demographic, world: CityWorldState): number {
  let weighted = 0;
  let totalSalience = 0;
  for (const [issue, salience] of Object.entries(group.salience)) {
    weighted += salience * issueSatisfaction(world, issue);
    totalSalience += salience;
  }
  const score01 = totalSalience > 0 ? weighted / totalSalience : 0.5;
  return Math.max(-1, Math.min(1, (score01 - 0.5) * 2));
}

/** A single city-wide record number (population-blind average over groups). */
export function overallRecord(groups: Demographic[], world: CityWorldState): number {
  if (groups.length === 0) return 0;
  const sum = groups.reduce((a, g) => a + recordEffect(g, world), 0);
  return sum / groups.length;
}
