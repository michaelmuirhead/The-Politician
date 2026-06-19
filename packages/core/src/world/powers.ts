/**
 * Governing power effects on the city world (GAME_DESIGN.md §7.1).
 *
 * Each power, once it clears the authority gate (§7.4), applies a discrete,
 * data-driven effect to the CityWorldState. Effects are pure transforms.
 */
import type { CityWorldState } from "./state.js";

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Parameters a power invocation may carry (e.g. a chosen tax level). */
export interface PowerArgs {
  /** For set_property_tax: target rate, 0 … 1. */
  taxRate?: number;
  /** For city_budget: which service to fund. */
  service?: "safety" | "housing" | "infrastructure";
}

export interface PowerOutcome {
  world: CityWorldState;
  note: string;
}

const FUND_COST = 30; // treasury cost of a budget allocation
const FUND_GAIN = 0.18; // service improvement from a funded allocation

/** Apply a city power's effect. Unknown powers no-op (gate already validated id). */
export function applyCityPower(
  world: CityWorldState,
  powerId: string,
  args: PowerArgs = {},
): PowerOutcome {
  switch (powerId) {
    case "set_property_tax": {
      const taxRate = clamp01(args.taxRate ?? world.taxRate);
      return { world: { ...world, taxRate }, note: `Set property tax to ${(taxRate * 100).toFixed(0)}%` };
    }
    case "zoning_reform": {
      const services = { ...world.services, housing: clamp01(world.services.housing + 0.15) };
      const economy = clamp01(world.economy + 0.05);
      return { world: { ...world, services, economy }, note: "Passed zoning reform (housing + economy up)" };
    }
    case "city_budget": {
      const service = args.service ?? "infrastructure";
      const services = { ...world.services, [service]: clamp01(world.services[service] + FUND_GAIN) };
      return {
        world: { ...world, services, treasury: world.treasury - FUND_COST },
        note: `Funded ${service} (−${FUND_COST} treasury)`,
      };
    }
    default:
      return { world, note: `No world effect for power ${powerId}` };
  }
}
