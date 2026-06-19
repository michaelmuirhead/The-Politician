#!/usr/bin/env node
/**
 * The Politician — terminal harness over @the-politician/core (M1).
 *
 *   politician --demo            deterministic auto-playthrough (campaign + govern)
 *   politician                   interactive: create a character and play a term
 *
 * Thin over the engine: all game logic lives in core; this only renders and
 * gathers input.
 */
import * as readline from "node:readline/promises";
import { stdin, stdout, argv } from "node:process";
import {
  burlingtonScenario,
  createCharacter,
  balancedStats,
  BACKGROUND_TRAITS,
  startTerm,
  termCampaignAction,
  termEndWeek,
  resolveElection,
  termEnactPower,
  advanceQuarter,
  overallRecord,
  type Scenario,
  type Candidate,
  type TermState,
  type CampaignAction,
  type PowerArgs,
} from "@the-politician/core";
import { renderWorld, renderElection, renderPressure, nameOf, hr } from "./render.js";

const WARDS = ["ward1", "ward2", "ward3", "ward4", "ward5"];
const OPPONENTS = ["bob", "carol"];

/** Clone the scenario and inject the player as a candidate. */
function scenarioWith(player: Candidate): Scenario {
  const s = JSON.parse(JSON.stringify(burlingtonScenario)) as Scenario;
  s.candidates.push(player);
  return s;
}

/**
 * A placeholder opponent (real opponent AI is M2, §10): a light touch — one
 * retail stop per week in a rotating ward — so a diligent, full-city ground
 * game by the protagonist is rewarded.
 */
function opponentWeek(state: TermState, candId: string): TermState {
  const res = state.campaign.resources[candId];
  if (!res || res.ap < 2) return state;
  const action: CampaignAction = { kind: "retail", unitId: WARDS[state.campaign.week % WARDS.length]! };
  const out = termCampaignAction(state, candId, action);
  return out.note.startsWith("refused") ? state : out.state;
}

function summarize(state: TermState): string {
  const groups = burlingtonScenario.demographics;
  const record = state.world ? overallRecord(groups, state.world) : 0;
  const approval = Math.round((record + 1) * 50);
  return [
    hr,
    `Final approval: ${approval}%   (record ${record.toFixed(2)})`,
    state.world ? renderWorld(state.world) : "",
    hr,
  ].join("\n");
}

// ─────────────────────────────────────────── demo mode ───────────────────────

function runDemo(seed: string): void {
  const player = createCharacter({
    id: "player",
    name: "Dana Cole",
    party: "prog",
    stats: { charisma: 8, intelligence: 5, stamina: 6, fundraising: 4, composure: 5, integrity: 5, mediaSavvy: 4, negotiation: 3 },
    traitId: "reformer",
    positions: { housing: -0.7, taxes: -0.4, policing: -0.5, climate: -0.8 },
  });
  const scenario = scenarioWith(player);

  let s = startTerm(scenario, {
    officeId: "mayor_burlington",
    candidateIds: ["player", ...OPPONENTS],
    weeksTotal: 8,
    quartersTotal: 8,
    seed,
  });

  console.log(`\n🏛️  THE POLITICIAN — demo playthrough (seed: ${seed})`);
  console.log(`${hr}\nCandidate: ${player.name} (Reformer, Progressive) for ${s.office.name}\n${hr}`);

  // Campaign: player runs a strong ground game across every ward; opponents respond.
  let wardCursor = 0;
  for (let w = 0; w < s.campaign.weeksTotal; w++) {
    let guard = 12;
    while (guard-- > 0) {
      const res = s.campaign.resources["player"]!;
      if (res.ap < 2) break;
      const action: CampaignAction =
        res.money < 6 ? { kind: "fundraiser" } : { kind: "retail", unitId: WARDS[wardCursor++ % WARDS.length]! };
      const out = termCampaignAction(s, "player", action);
      if (out.note.startsWith("refused")) break;
      s = out.state;
    }
    for (const opp of OPPONENTS) s = opponentWeek(s, opp);
    s = termEndWeek(s);
  }

  console.log(`\nCampaign complete after ${s.campaign.week} weeks. Player's pressure:`);
  console.log(renderPressure(s, "player"));

  s = resolveElection(s);
  console.log(`\n${hr}\nELECTION RESULTS\n${hr}`);
  console.log(renderElection(scenario, s.lastElection!));
  console.log(`\n→ ${nameOf(scenario, s.winnerId!)} wins ${s.office.name}.`);

  if (s.winnerId !== "player") {
    console.log("\nThe player lost this race. Career continues elsewhere another day.");
    return;
  }

  // Govern: invest in services and housing each quarter.
  console.log(`\n${hr}\nGOVERNING (${s.quartersTotal} quarters)\n${hr}`);
  const services = ["safety", "housing", "infrastructure"] as const;
  let q = 0;
  while (s.phase === "govern") {
    const svc = services[q % services.length]!;
    const fund = (powerId: string, args?: PowerArgs) =>
      termEnactPower(
        s,
        { kind: "enactPower", actorId: "player", officeId: "mayor_burlington", powerId, targetJurisdictionId: "burlington" },
        args ?? {},
      );
    s = fund("city_budget", { service: svc }).state;
    if (q % 2 === 0) s = fund("zoning_reform").state;
    s = advanceQuarter(s);
    q++;
  }

  console.log(summarize(s));
  console.log("Term complete. (M1: re-election & climbing arrive in later milestones.)\n");
}

// ────────────────────────────────────── interactive mode ─────────────────────

async function runInteractive(seed: string): Promise<void> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const ask = async (q: string, def: string): Promise<string> => {
    const a = (await rl.question(`${q} [${def}]: `)).trim();
    return a === "" ? def : a;
  };

  console.log("\n🏛️  THE POLITICIAN — create your candidate\n" + hr);
  const name = await ask("Name", "Alex Rivera");
  const party = await ask("Party (prog/dem/rep/ind)", "dem");
  console.log("\nBackground traits:");
  BACKGROUND_TRAITS.forEach((t, i) => console.log(`  ${i + 1}. ${t.name} — ${t.description}`));
  const traitIdx = Number(await ask("Choose a trait #", "6")) - 1;
  const trait = BACKGROUND_TRAITS[traitIdx] ?? BACKGROUND_TRAITS[5]!;

  const player = createCharacter({
    id: "player",
    name,
    party,
    stats: balancedStats(),
    traitId: trait.id,
    positions: { housing: -0.3, taxes: -0.1, policing: -0.1, climate: -0.3 },
  });
  const scenario = scenarioWith(player);

  let s = startTerm(scenario, {
    officeId: "mayor_burlington",
    candidateIds: ["player", ...OPPONENTS],
    weeksTotal: 6,
    quartersTotal: 8,
    seed,
  });
  console.log(`\nRunning for ${s.office.name} as ${player.name} (${trait.name}).`);

  // Campaign weeks.
  while (s.phase === "campaign" && s.campaign.week < s.campaign.weeksTotal) {
    console.log(`\n${hr}\nWeek ${s.campaign.week + 1}/${s.campaign.weeksTotal}`);
    let acting = true;
    while (acting) {
      const res = s.campaign.resources["player"]!;
      console.log(`  AP ${res.ap} · $${res.money} · 🏛️${res.capital}`);
      console.log("  Actions: [1] Rally  [2] Ads  [3] Retail  [4] Fundraiser  [5] Attack  [6] End week");
      const choice = await ask("  Choose", "6");
      if (choice === "6") break;
      let action: CampaignAction | undefined;
      if (choice === "4") action = { kind: "fundraiser" };
      else {
        const ward = await ask(`  Ward (${WARDS.join("/")})`, "ward1");
        if (choice === "1") action = { kind: "rally", unitId: ward };
        else if (choice === "2") action = { kind: "ads", unitId: ward };
        else if (choice === "3") action = { kind: "retail", unitId: ward };
        else if (choice === "5") action = { kind: "attackAd", unitId: ward, targetId: OPPONENTS[0]! };
      }
      if (!action) continue;
      const out = termCampaignAction(s, "player", action);
      console.log(`  → ${out.note}`);
      s = out.state;
      if (s.campaign.resources["player"]!.ap < 2) acting = false;
    }
    for (const opp of OPPONENTS) s = opponentWeek(s, opp);
    s = termEndWeek(s);
  }

  s = resolveElection(s);
  console.log(`\n${hr}\nELECTION RESULTS\n${hr}`);
  console.log(renderElection(scenario, s.lastElection!));
  console.log(`\n→ ${nameOf(scenario, s.winnerId!)} wins ${s.office.name}.`);
  if (s.winnerId !== "player") {
    console.log("\nYou lost. Better luck next cycle.\n");
    rl.close();
    return;
  }

  // Govern quarters.
  while (s.phase === "govern") {
    console.log(`\n${hr}\nQuarter ${s.quarter + 1}/${s.quartersTotal}`);
    if (s.world) console.log(renderWorld(s.world));
    console.log("  Powers: [1] Set tax  [2] Zoning reform  [3] Fund service  [4] Next quarter");
    const choice = await ask("  Choose", "4");
    const enact = (powerId: string, args?: PowerArgs) =>
      termEnactPower(
        s,
        { kind: "enactPower", actorId: "player", officeId: "mayor_burlington", powerId, targetJurisdictionId: "burlington" },
        args ?? {},
      );
    if (choice === "1") {
      const rate = Number(await ask("  Tax rate 0-100", "40")) / 100;
      const out = enact("set_property_tax", { taxRate: rate });
      console.log(`  → ${out.note}`);
      s = out.state;
    } else if (choice === "2") {
      const out = enact("zoning_reform");
      console.log(`  → ${out.note}`);
      s = out.state;
    } else if (choice === "3") {
      const svc = (await ask("  Service (safety/housing/infrastructure)", "safety")) as PowerArgs["service"];
      const out = enact("city_budget", { service: svc });
      console.log(`  → ${out.note}`);
      s = out.state;
    } else {
      s = advanceQuarter(s);
    }
  }

  console.log(summarize(s));
  rl.close();
}

// ─────────────────────────────────────────────── main ────────────────────────

const seedArg = argv.find((a) => a.startsWith("--seed="));
const seed = seedArg ? seedArg.slice("--seed=".length) : "the-politician";

if (argv.includes("--demo")) {
  runDemo(seed);
} else {
  runInteractive(seed).catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
