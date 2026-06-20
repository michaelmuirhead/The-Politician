/**
 * Events & news cycle (GAME_DESIGN.md §9).
 *
 * Weighted, condition-gated events drawn from a data pool. Choices route into
 * the same effect shapes used elsewhere, so narrative and systems share one
 * engine. Tone is an earnest civics sim — credible political news, not parody.
 */
export type EventPhase = "campaign" | "govern";

/** Additive deltas an event choice applies. Govern → world; campaign → a candidate. */
export interface EventEffect {
  world?: Partial<{
    economy: number;
    safety: number;
    housing: number;
    infrastructure: number;
    treasury: number;
    taxRate: number;
  }>;
  /** Campaign-phase: resource and pressure swings for the affected candidate. */
  money?: number;
  capital?: number;
  pressureSelf?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  effect: EventEffect;
}

export interface GameEvent {
  id: string;
  name: string;
  phase: EventPhase;
  weight: number;
  /** Headline-style framing shown to the player. */
  narrative: string;
  choices: EventChoice[];
}
