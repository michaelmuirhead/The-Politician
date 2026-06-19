/**
 * M0 playable slice: Burlington, Vermont — a real city, nested
 * ward ⊂ city ⊂ state ⊂ nation (GAME_DESIGN.md §2, §5.5, §7).
 *
 * NOTE: magnitudes here are a COARSE first pass (illustrative, not precise
 * census/electoral data). The real national data pipeline (M0+, §13) will
 * replace these seeded values; the engine treats them purely as data.
 *
 * Issue axis convention: −1 = progressive/left … +1 = conservative/right,
 * applied consistently to demographic ideals, candidate positions, and party
 * lean. Burlington leans strongly left, so its units carry negative leans.
 */
import type { Scenario } from "../models/types.js";

export const burlingtonScenario: Scenario = {
  id: "burlington-vt",
  name: "Burlington, Vermont",

  parties: [
    { id: "prog", name: "Progressive", lean: -0.85 },
    { id: "dem", name: "Democratic", lean: -0.55 },
    { id: "rep", name: "Republican", lean: 0.6 },
    { id: "ind", name: "Independent", lean: 0 },
  ],

  issues: [
    { id: "housing", name: "Housing & Zoning", tiers: ["city"] },
    { id: "taxes", name: "Local Taxes", tiers: ["city"] },
    { id: "policing", name: "Public Safety", tiers: ["city"] },
    { id: "climate", name: "Climate & Energy", tiers: ["city"] },
  ],

  demographics: [
    {
      id: "students",
      name: "Students & Young Progressives",
      ideals: { housing: -0.7, taxes: -0.5, policing: -0.6, climate: -0.8 },
      salience: { housing: 0.4, climate: 0.3, policing: 0.2, taxes: 0.1 },
      baseTurnout: 0.45,
    },
    {
      id: "working",
      name: "Working Families",
      ideals: { housing: -0.2, taxes: -0.1, policing: 0.0, climate: -0.2 },
      salience: { taxes: 0.35, housing: 0.3, policing: 0.25, climate: 0.1 },
      baseTurnout: 0.55,
    },
    {
      id: "professionals",
      name: "Professionals",
      ideals: { housing: -0.1, taxes: 0.0, policing: -0.1, climate: -0.3 },
      salience: { housing: 0.3, taxes: 0.3, climate: 0.25, policing: 0.15 },
      baseTurnout: 0.65,
    },
    {
      id: "seniors",
      name: "Seniors",
      ideals: { housing: 0.2, taxes: 0.4, policing: 0.3, climate: 0.0 },
      salience: { taxes: 0.4, policing: 0.35, housing: 0.15, climate: 0.1 },
      baseTurnout: 0.75,
    },
  ],

  units: [
    { id: "usa", name: "United States", tier: "federal", kind: "nation", population: 0, seats: 0, baselineLean: 0, currentLean: 0, mix: {} },
    { id: "vt", name: "Vermont", tier: "state", kind: "state", parentId: "usa", population: 0, seats: 3, baselineLean: -0.5, currentLean: -0.5, mix: {} },
    { id: "burlington", name: "Burlington", tier: "city", kind: "city", parentId: "vt", population: 0, seats: 1, baselineLean: -0.7, currentLean: -0.7, mix: {} },

    // Wards (the elected prizes at city tier).
    { id: "ward1", name: "Ward 1 (Hill/Campus)", tier: "city", kind: "ward", parentId: "burlington", population: 5200, seats: 1, baselineLean: -0.8, currentLean: -0.8, mix: { students: 0.55, working: 0.2, professionals: 0.2, seniors: 0.05 } },
    { id: "ward2", name: "Ward 2 (Old North End)", tier: "city", kind: "ward", parentId: "burlington", population: 4800, seats: 1, baselineLean: -0.75, currentLean: -0.75, mix: { students: 0.25, working: 0.45, professionals: 0.2, seniors: 0.1 } },
    { id: "ward3", name: "Ward 3 (Downtown)", tier: "city", kind: "ward", parentId: "burlington", population: 5000, seats: 1, baselineLean: -0.7, currentLean: -0.7, mix: { students: 0.3, working: 0.3, professionals: 0.3, seniors: 0.1 } },
    { id: "ward4", name: "Ward 4 (New North End)", tier: "city", kind: "ward", parentId: "burlington", population: 5600, seats: 1, baselineLean: -0.45, currentLean: -0.45, mix: { students: 0.1, working: 0.3, professionals: 0.3, seniors: 0.3 } },
    { id: "ward5", name: "Ward 5 (South End)", tier: "city", kind: "ward", parentId: "burlington", population: 5400, seats: 1, baselineLean: -0.6, currentLean: -0.6, mix: { students: 0.15, working: 0.3, professionals: 0.4, seniors: 0.15 } },
  ],

  powers: [
    { id: "set_property_tax", name: "Set Property Tax Rate", tier: "city", domain: "local.tax", reach: "own" },
    { id: "zoning_reform", name: "Zoning Reform", tier: "city", domain: "local.zoning", reach: "own" },
    { id: "city_budget", name: "Set City Budget", tier: "city", domain: "local.budget", reach: "own" },
    // A federal power, deliberately included so the gate can prove a city seat
    // cannot reach it (e.g. "a council member can't embargo a nation", §7.4).
    { id: "impose_embargo", name: "Impose Embargo", tier: "federal", domain: "federal.foreign_policy", reach: "own" },
  ],

  offices: [
    { id: "mayor_burlington", name: "Mayor of Burlington", tier: "city", jurisdictionId: "burlington", powers: ["set_property_tax", "zoning_reform", "city_budget"] },
    { id: "council_ward1", name: "City Council — Ward 1", tier: "city", jurisdictionId: "ward1", powers: ["zoning_reform"] },
    { id: "us_house_vt", name: "U.S. Representative (VT)", tier: "federal", jurisdictionId: "vt", powers: ["impose_embargo"] },
  ],

  candidates: [
    {
      id: "alice",
      name: "Alice Green",
      party: "prog",
      stats: { charisma: 7, intelligence: 7, stamina: 6, fundraising: 4, composure: 6, integrity: 8, mediaSavvy: 6, negotiation: 5 },
      positions: { housing: -0.7, taxes: -0.5, policing: -0.6, climate: -0.8 },
    },
    {
      id: "bob",
      name: "Bob Marsh",
      party: "dem",
      stats: { charisma: 6, intelligence: 7, stamina: 7, fundraising: 7, composure: 7, integrity: 6, mediaSavvy: 7, negotiation: 7 },
      positions: { housing: -0.3, taxes: -0.1, policing: -0.1, climate: -0.3 },
    },
    {
      id: "carol",
      name: "Carol Pratt",
      party: "rep",
      stats: { charisma: 6, intelligence: 6, stamina: 6, fundraising: 8, composure: 6, integrity: 6, mediaSavvy: 6, negotiation: 6 },
      positions: { housing: 0.4, taxes: 0.6, policing: 0.5, climate: 0.2 },
    },
  ],
};

/** A convenient default seating used by examples/tests. */
export const burlingtonSeats = {
  mayor_burlington: "bob",
  council_ward1: "alice",
  us_house_vt: "carol",
};
