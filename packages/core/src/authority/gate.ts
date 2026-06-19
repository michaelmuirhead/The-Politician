/**
 * Authority & jurisdiction gate (GAME_DESIGN.md §7.4).
 *
 * A hard engine invariant, not a UI nicety: a governing command is allowed only
 * if ALL hold —
 *   1. the acting character actually HOLDS the office,
 *   2. the invoked power is in that office's `powers` list (authority domain),
 *   3. the target jurisdiction is within the office's authority (its own node,
 *      or a descendant for powers with reach "descendants").
 *
 * Anything else is an illegal command and is refused — for player and AI alike.
 */
import type {
  AuthorityDomain,
  CharacterId,
  OfficeId,
  Power,
  Office,
  Scenario,
  TierId,
  Unit,
  UnitId,
} from "../models/types.js";

export interface GovernCommand {
  kind: "enactPower";
  actorId: CharacterId;
  officeId: OfficeId;
  powerId: string;
  targetJurisdictionId: UnitId;
}

export type AuthorityDenial =
  | "not_officeholder"
  | "power_not_in_office"
  | "tier_mismatch"
  | "out_of_jurisdiction";

export type AuthorityCheck =
  | { ok: true; office: Office; power: Power }
  | { ok: false; reason: AuthorityDenial; detail: string };

/** Maps office id → the character currently seated (alive, in term). */
export type SeatMap = Record<OfficeId, CharacterId>;

/** True if `unitId` is `ancestorId` or a descendant of it in the nested world. */
export function isWithin(
  units: ReadonlyArray<Unit>,
  unitId: UnitId,
  ancestorId: UnitId,
): boolean {
  const byId = new Map(units.map((u) => [u.id, u]));
  let cursor: UnitId | undefined = unitId;
  while (cursor) {
    if (cursor === ancestorId) return true;
    cursor = byId.get(cursor)?.parentId;
  }
  return false;
}

/** The tier implied by a domain prefix ("local."→city, "state."→state, …). */
export function tierOfDomain(domain: AuthorityDomain): TierId | undefined {
  if (domain.startsWith("local.")) return "city";
  if (domain.startsWith("state.")) return "state";
  if (domain.startsWith("federal.")) return "federal";
  return undefined;
}

export function checkAuthority(
  scenario: Scenario,
  seats: SeatMap,
  command: GovernCommand,
): AuthorityCheck {
  // 1. Does the actor actually hold this office?
  if (seats[command.officeId] !== command.actorId) {
    return {
      ok: false,
      reason: "not_officeholder",
      detail: `${command.actorId} does not hold ${command.officeId}`,
    };
  }

  const office = scenario.offices.find((o) => o.id === command.officeId);
  if (!office) {
    return { ok: false, reason: "not_officeholder", detail: `unknown office ${command.officeId}` };
  }

  // 2. Is the power in this office's granted powers?
  if (!office.powers.includes(command.powerId)) {
    return {
      ok: false,
      reason: "power_not_in_office",
      detail: `${office.id} cannot invoke power ${command.powerId}`,
    };
  }
  const power = scenario.powers.find((p) => p.id === command.powerId);
  if (!power) {
    return { ok: false, reason: "power_not_in_office", detail: `unknown power ${command.powerId}` };
  }

  // Power tier and its domain prefix must match the office's tier.
  const domainTier = tierOfDomain(power.domain);
  if (power.tier !== office.tier || (domainTier && domainTier !== office.tier)) {
    return {
      ok: false,
      reason: "tier_mismatch",
      detail: `power ${power.id} (${power.tier}/${power.domain}) on ${office.tier} office`,
    };
  }

  // 3. Is the target jurisdiction within the office's authority?
  const withinOwn = command.targetJurisdictionId === office.jurisdictionId;
  const withinDescendants =
    power.reach === "descendants" &&
    isWithin(scenario.units, command.targetJurisdictionId, office.jurisdictionId);
  if (!withinOwn && !withinDescendants) {
    return {
      ok: false,
      reason: "out_of_jurisdiction",
      detail: `${office.id} governs ${office.jurisdictionId}, not ${command.targetJurisdictionId}`,
    };
  }

  return { ok: true, office, power };
}
