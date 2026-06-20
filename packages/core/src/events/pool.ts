/** Starter event pool (GAME_DESIGN.md §9). Earnest tone; effects are data. */
import type { GameEvent } from "./types.js";

export const GOVERN_EVENTS: GameEvent[] = [
  {
    id: "economic_boom",
    name: "Regional Upturn",
    phase: "govern",
    weight: 1,
    narrative: "A regional upturn lifts local business and city revenues.",
    choices: [
      { id: "invest", label: "Reinvest the windfall in services", effect: { world: { treasury: 25, infrastructure: 0.06 } } },
      { id: "bank", label: "Bank the surplus", effect: { world: { treasury: 45, economy: 0.04 } } },
    ],
  },
  {
    id: "recession",
    name: "Downturn",
    phase: "govern",
    weight: 1,
    narrative: "A downturn squeezes households and the municipal budget.",
    choices: [
      { id: "austerity", label: "Tighten the budget", effect: { world: { treasury: 10, economy: -0.04 } } },
      { id: "stimulus", label: "Spend to soften the blow", effect: { world: { treasury: -40, economy: 0.04 } } },
    ],
  },
  {
    id: "water_main",
    name: "Water Main Failure",
    phase: "govern",
    weight: 1,
    narrative: "An aging water main bursts downtown, disrupting a neighborhood.",
    choices: [
      { id: "repair", label: "Emergency repair", effect: { world: { treasury: -45, infrastructure: 0.2 } } },
      { id: "patch", label: "Cheap patch for now", effect: { world: { treasury: -10, infrastructure: -0.05 } } },
    ],
  },
  {
    id: "ethics_inquiry",
    name: "Ethics Inquiry",
    phase: "govern",
    weight: 0.7,
    narrative: "A council ethics panel opens an inquiry into a contract award.",
    choices: [
      { id: "cooperate", label: "Cooperate fully", effect: { capital: -2 } },
      { id: "stonewall", label: "Stonewall", effect: { capital: 2, world: { economy: -0.02 } } },
    ],
  },
];

export const CAMPAIGN_EVENTS: GameEvent[] = [
  {
    id: "viral_moment",
    name: "Viral Moment",
    phase: "campaign",
    weight: 1,
    narrative: "A clip of your candidate connecting with voters spreads online.",
    choices: [{ id: "lean_in", label: "Lean into it", effect: { pressureSelf: 4 } }],
  },
  {
    id: "gaffe",
    name: "Gaffe",
    phase: "campaign",
    weight: 1,
    narrative: "An off-the-cuff remark lands badly in the press.",
    choices: [
      { id: "apologize", label: "Apologize and move on", effect: { pressureSelf: -2 } },
      { id: "double_down", label: "Double down", effect: { pressureSelf: -4, capital: 1 } },
    ],
  },
  {
    id: "major_donor",
    name: "Major Donor",
    phase: "campaign",
    weight: 1,
    narrative: "A local business group offers to host a fundraiser.",
    choices: [{ id: "accept", label: "Accept the fundraiser", effect: { money: 40 } }],
  },
];
