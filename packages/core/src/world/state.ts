/**
 * The living city world model (GAME_DESIGN.md §7.2).
 *
 * One persistent model that governing powers steer and that feeds back into the
 * support simulation via recordEffect (§5.2). M1 implements the city tier; the
 * same shape generalizes to state/federal aggregates later.
 */
import type { Scenario, UnitId } from "../models/types.js";

export interface CityWorldState {
  cityId: UnitId;
  population: number;
  /** Overall economic health, 0 … 1. */
  economy: number;
  /** Property-tax level, 0 … 1. */
  taxRate: number;
  /** Public services, each 0 … 1. */
  services: { safety: number; housing: number; infrastructure: number };
  /** Accumulated municipal balance (abstract k$); negative = deficit. */
  treasury: number;
}

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Build the initial city world by summing the city's ward populations. */
export function initCityWorld(scenario: Scenario, cityId: UnitId): CityWorldState {
  const population = scenario.units
    .filter((u) => u.parentId === cityId && u.kind === "ward")
    .reduce((sum, u) => sum + u.population, 0);
  return {
    cityId,
    population,
    economy: 0.55,
    taxRate: 0.4,
    services: { safety: 0.5, housing: 0.45, infrastructure: 0.5 },
    treasury: 0,
  };
}

const REVENUE_FACTOR = 0.02; // tax × economy × population → revenue
const UPKEEP_FACTOR = 0.006; // population → baseline service cost
const SERVICE_DECAY = 0.03; // services erode each quarter without funding

/**
 * Advance the world one governing quarter (independent of any player power):
 * collect revenue, pay upkeep, decay services, drift the economy.
 */
export function tickCityWorld(w: CityWorldState): CityWorldState {
  const revenue = w.taxRate * w.economy * w.population * REVENUE_FACTOR;
  const upkeep = w.population * UPKEEP_FACTOR;

  const services = {
    safety: clamp01(w.services.safety - SERVICE_DECAY),
    housing: clamp01(w.services.housing - SERVICE_DECAY),
    infrastructure: clamp01(w.services.infrastructure - SERVICE_DECAY),
  };

  // Good infrastructure grows the economy; high taxes dampen it.
  const drift = 0.3 * (w.services.infrastructure - 0.5) - 0.2 * (w.taxRate - 0.4);
  const economy = clamp01(w.economy + drift * 0.1);

  return { ...w, services, economy, treasury: w.treasury + revenue - upkeep };
}
