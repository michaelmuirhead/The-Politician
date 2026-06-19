/**
 * M0 data models — the subset of GAME_DESIGN.md §12 needed for the support/
 * turnout simulation and the authority gate. Everything here is plain data;
 * new tiers, places, issues and offices ship as data, not engine changes.
 */

export type IssueId = string;
export type DemographicId = string;
export type UnitId = string;
export type PartyId = string;
export type OfficeId = string;
export type PowerId = string;
export type CharacterId = string;

export type TierId = "city" | "state" | "federal";

/** Hierarchical authority domain, e.g. "local.tax", "federal.foreign_policy". */
export type AuthorityDomain = string;

export type PlaceKind =
  | "ward"
  | "city"
  | "county"
  | "parish"
  | "borough"
  | "district"
  | "state"
  | "nation";

export interface Issue {
  id: IssueId;
  name: string;
  tiers: TierId[];
}

export interface Demographic {
  id: DemographicId;
  name: string;
  /** Ideal position per issue, −1 … +1. */
  ideals: Record<IssueId, number>;
  /** Issue-salience weighting, 0 … 1 (should sum to ≈ 1 across issues). */
  salience: Record<IssueId, number>;
  /** Turnout propensity, 0 … 1. */
  baseTurnout: number;
}

export interface Party {
  id: PartyId;
  name: string;
  /** Baseline ideological lean, −1 (left) … +1 (right). */
  lean: number;
}

/** A constituency unit — ward / county / parish / state, nested by parentId. */
export interface Unit {
  id: UnitId;
  name: string;
  tier: TierId;
  kind: PlaceKind;
  parentId?: UnitId;
  /** Eligible voters in the unit (coarse). */
  population: number;
  /** The prize: council seats / electoral votes / legislative seats. */
  seats: number;
  /** Historically-seeded anchor, −1 … +1 (immutable). */
  baselineLean: number;
  /** Live lean that drifts from baseline over time, −1 … +1. */
  currentLean: number;
  /** Group shares, should sum to ≈ 1. */
  mix: Record<DemographicId, number>;
}

export interface CandidateStats {
  charisma: number;
  intelligence: number;
  stamina: number;
  fundraising: number;
  composure: number;
  integrity: number;
  mediaSavvy: number;
  negotiation: number;
}

export interface Candidate {
  id: CharacterId;
  name: string;
  party: PartyId;
  stats: CandidateStats;
  /** Issue positions, −1 … +1. */
  positions: Record<IssueId, number>;
}

/** A governing power; gated by tier + domain + jurisdictional reach (§7.4). */
export interface Power {
  id: PowerId;
  name: string;
  tier: TierId;
  domain: AuthorityDomain;
  /** Acts on the office's own jurisdiction, or descendants down the hierarchy. */
  reach: "own" | "descendants";
}

export interface Office {
  id: OfficeId;
  name: string;
  tier: TierId;
  /** The node in the nested world this seat governs. */
  jurisdictionId: UnitId;
  /** The ONLY powers this seat may invoke (the authority gate, §7.4). */
  powers: PowerId[];
}

/** A complete (M0-subset) playable world. */
export interface Scenario {
  id: string;
  name: string;
  parties: Party[];
  issues: Issue[];
  demographics: Demographic[];
  units: Unit[];
  offices: Office[];
  powers: Power[];
  candidates: Candidate[];
}
