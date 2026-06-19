/**
 * Engine — the pure reducer (GAME_DESIGN.md §11).
 *
 *   applyCommand(state, command) → { state, result }
 *
 * No side effects, no mutation: the reducer returns a new state. Governing
 * commands are validated by the authority gate (§7.4) before anything is
 * applied; illegal commands are refused and leave state unchanged.
 */
import type { CharacterId, OfficeId, Scenario, UnitId } from "./models/types.js";
import {
  checkAuthority,
  type AuthorityDenial,
  type GovernCommand,
  type SeatMap,
} from "./authority/gate.js";

/** A single enacted governing action, recorded for the world/record systems. */
export interface EnactedAction {
  officeId: OfficeId;
  actorId: CharacterId;
  powerId: string;
  targetJurisdictionId: UnitId;
}

export interface GameState {
  scenario: Scenario;
  /** Who currently holds each office (alive, in term). */
  seats: SeatMap;
  /** Append-only log of enacted governing actions. */
  enacted: ReadonlyArray<EnactedAction>;
}

export type Command = GovernCommand;

export type CommandResult =
  | { ok: true }
  | { ok: false; reason: AuthorityDenial | "unknown_command"; detail: string };

export interface StepOutput {
  state: GameState;
  result: CommandResult;
}

export function initState(scenario: Scenario, seats: SeatMap = {}): GameState {
  return { scenario, seats, enacted: [] };
}

export function applyCommand(state: GameState, command: Command): StepOutput {
  switch (command.kind) {
    case "enactPower": {
      const check = checkAuthority(state.scenario, state.seats, command);
      if (!check.ok) {
        // Illegal command: refuse, state unchanged.
        return { state, result: { ok: false, reason: check.reason, detail: check.detail } };
      }
      const enacted: EnactedAction = {
        officeId: command.officeId,
        actorId: command.actorId,
        powerId: command.powerId,
        targetJurisdictionId: command.targetJurisdictionId,
      };
      return {
        state: { ...state, enacted: [...state.enacted, enacted] },
        result: { ok: true },
      };
    }
    default: {
      const _exhaustive: never = command.kind as never;
      return {
        state,
        result: { ok: false, reason: "unknown_command", detail: String(_exhaustive) },
      };
    }
  }
}
