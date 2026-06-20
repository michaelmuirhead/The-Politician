/**
 * Event resolution (GAME_DESIGN.md §9).
 *
 * Pure draws and effect application. The orchestration layer (term/CLI) decides
 * when to draw; the player picks a choice, or `autoChoice` resolves it for AI
 * and the demo.
 */
import type { Rng } from "../rng.js";
import type { CityWorldState } from "../world/state.js";
import type { CampaignResources } from "../campaign/state.js";
import { GOVERN_EVENTS, CAMPAIGN_EVENTS } from "./pool.js";
import type { EventChoice, EventEffect, GameEvent } from "./types.js";

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Draw a govern/campaign event with probability `prob`, else undefined. */
export function drawEvent(
  rng: Rng,
  pool: GameEvent[],
  prob: number,
): GameEvent | undefined {
  if (rng.next() >= prob) return undefined;
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let roll = rng.next() * total;
  for (const e of pool) {
    roll -= e.weight;
    if (roll <= 0) return e;
  }
  return pool[pool.length - 1];
}

export function drawGovernEvent(rng: Rng, prob = 0.5): GameEvent | undefined {
  return drawEvent(rng, GOVERN_EVENTS, prob);
}

export function drawCampaignEvent(rng: Rng, prob = 0.35): GameEvent | undefined {
  return drawEvent(rng, CAMPAIGN_EVENTS, prob);
}

/** Apply an event choice's world deltas (clamped). */
export function applyWorldEffect(world: CityWorldState, effect: EventEffect): CityWorldState {
  const d = effect.world ?? {};
  return {
    ...world,
    economy: clamp01(world.economy + (d.economy ?? 0)),
    taxRate: clamp01(world.taxRate + (d.taxRate ?? 0)),
    treasury: world.treasury + (d.treasury ?? 0),
    services: {
      safety: clamp01(world.services.safety + (d.safety ?? 0)),
      housing: clamp01(world.services.housing + (d.housing ?? 0)),
      infrastructure: clamp01(world.services.infrastructure + (d.infrastructure ?? 0)),
    },
  };
}

/** Apply an event choice's resource deltas to a candidate's campaign resources. */
export function applyResourceEffect(res: CampaignResources, effect: EventEffect): CampaignResources {
  return {
    ...res,
    money: Math.max(0, res.money + (effect.money ?? 0)),
    capital: Math.max(0, res.capital + (effect.capital ?? 0)),
  };
}

/** Heuristic auto-resolution: pick the choice with the best net outcome. */
export function autoChoice(event: GameEvent): EventChoice {
  const score = (c: EventChoice): number => {
    const e = c.effect;
    const w = e.world ?? {};
    return (
      (w.economy ?? 0) +
      (w.safety ?? 0) +
      (w.housing ?? 0) +
      (w.infrastructure ?? 0) +
      0.002 * (w.treasury ?? 0) +
      0.02 * (e.money ?? 0) +
      0.1 * (e.capital ?? 0) +
      0.1 * (e.pressureSelf ?? 0)
    );
  };
  return event.choices.reduce((best, c) => (score(c) > score(best) ? c : best), event.choices[0]!);
}
