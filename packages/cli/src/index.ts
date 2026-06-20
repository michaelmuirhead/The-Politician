#!/usr/bin/env node
/**
 * The Politician — terminal harness over @the-politician/core (M1 + M2).
 *
 *   politician --demo            deterministic auto-playthrough (two terms)
 *   politician                   interactive: create a character and play
 *
 * Opponents now run on the real heuristic AI (§10); events fire each turn; and
 * leanings drift between terms (§5.5). All game logic lives in core.
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
  aiCampaignWeek,
  drawGovernEvent,
  drawCampaignEvent,
  autoChoice,
  applyWorldEffect,
  applyResourceEffect,
  driftAfterTerm,
  makeRng,
  hashSeed,
  type Scenario,
  type Candidate,
  type TermState,
  type CampaignAction,
  type PowerArgs,
  type EventEffect,
} from "@the-politician/core";
import { renderWorld, renderElection, renderPressure, nameOf, hr } from "./render.js";

const WARDS = ["ward1", "ward2", "ward3", "ward4", "ward5"];
const OPPONENTS = ["bob", "carol"];
const CITY = "burlington";

function scenarioWith(player: Candidate): Scenario {
  const s = JSON.parse(JSON.stringify(burlingtonScenario)) as Scenario;
  s.candidates.push(player);
  return s;
}

/** Run one AI opponent's full week on the term's campaign. */
function aiOpponent(state: TermState, candId: string): TermState {
  return { ...state, campaign: aiCampaignWeek(state.scenario, state.campaign, candId).campaign };
}

/** Apply a campaign event's effects to the player (resources + spread pressure). */
function applyCampaignEvent(state: TermState, effect: EventEffect): TermState {
  const res = applyResourceEffect(state.campaign.resources["player"]!, effect);
  const pressure = { ...state.campaign.pressure };
  if (effect.pressureSelf) {
    const map = { ...(pressure["player"] ?? {}) };
    for (const u of state.units) map[u] = Math.max(0, (map[u] ?? 0) + effect.pressureSelf);
    pressure["player"] = map;
  }
  return {
    ...state,
    campaign: { ...state.campaign, resources: { ...state.campaign.resources, player: res }, pressure },
  };
}

function approvalLine(state: TermState): string {
  const record = state.world ? overallRecord(burlingtonScenario.demographics, state.world) : 0;
  return `approval ${Math.round((record + 1) * 50)}% (record ${record.toFixed(2)})`;
}

// ─────────────────────────────────────────── demo mode ───────────────────────

function runDemo(seed: string): void {
  // The protagonist is a broadly-appealing Democrat facing AI rivals on both
  // flanks (a progressive and a Republican) — a clean showcase of the loop.
  const demoOpponents = ["alice", "carol"];
  const player = createCharacter({
    id: "player",
    name: "Dana Cole",
    party: "dem",
    stats: { charisma: 8, intelligence: 5, stamina: 7, fundraising: 4, composure: 5, integrity: 5, mediaSavvy: 3, negotiation: 3 },
    traitId: "reformer",
    positions: { housing: -0.35, taxes: -0.15, policing: -0.15, climate: -0.4 },
  });
  let scenario = scenarioWith(player);
  let record: Record<string, number> = {};

  console.log(`\n🏛️  THE POLITICIAN — demo (seed: ${seed})`);
  console.log(`${hr}\nDana Cole (Reformer, Democrat) seeks the mayoralty of Burlington.\n${hr}`);

  for (let term = 1; term <= 2; term++) {
    console.log(`\n${"═".repeat(56)}\n  TERM ${term}\n${"═".repeat(56)}`);
    let s = startTerm(scenario, {
      officeId: "mayor_burlington",
      candidateIds: ["player", ...demoOpponents],
      weeksTotal: 8,
      quartersTotal: 6,
      seed: `${seed}-t${term}`,
      record,
    });
    if (term === 2) console.log("Running for re-election on the record.");

    // Campaign: every candidate (player included) runs the heuristic AI.
    for (let w = 0; w < s.campaign.weeksTotal; w++) {
      for (const cand of ["player", ...demoOpponents]) s = aiOpponent(s, cand);

      const ev = drawCampaignEvent(makeRng(hashSeed(`${seed}-t${term}-w${w}`)));
      if (ev) {
        const choice = autoChoice(ev);
        s = applyCampaignEvent(s, choice.effect);
        console.log(`  📰 Week ${w + 1}: ${ev.narrative} → ${choice.label}`);
      }
      s = termEndWeek(s);
    }

    s = resolveElection(s);
    console.log(`\n${hr}\nELECTION — TERM ${term}\n${hr}`);
    console.log(renderElection(scenario, s.lastElection!));
    console.log(`→ ${nameOf(scenario, s.winnerId!)} wins.`);

    if (s.winnerId !== "player") {
      console.log("\nDana loses this race — the dynasty waits for another opening.\n");
      return;
    }

    // Govern: invest in services/housing; events strike each quarter.
    console.log(`\n${hr}\nGOVERNING — TERM ${term}\n${hr}`);
    const services = ["safety", "housing", "infrastructure"] as const;
    let q = 0;
    while (s.phase === "govern") {
      const enact = (powerId: string, args?: PowerArgs) =>
        termEnactPower(
          s,
          { kind: "enactPower", actorId: "player", officeId: "mayor_burlington", powerId, targetJurisdictionId: CITY },
          args ?? {},
        );
      s = enact("city_budget", { service: services[q % services.length]! }).state;
      if (q % 2 === 0) s = enact("zoning_reform").state;

      const ev = drawGovernEvent(makeRng(hashSeed(`${seed}-t${term}-q${q}`)), 0.6);
      if (ev && s.world) {
        const choice = autoChoice(ev);
        s = { ...s, world: applyWorldEffect(s.world, choice.effect) };
        console.log(`  📰 Q${q + 1}: ${ev.narrative} → ${choice.label}`);
      }
      s = advanceQuarter(s);
      q++;
    }
    console.log(`  End of term ${term}: ${approvalLine(s)}`);
    if (s.world) console.log(renderWorld(s.world));

    // Between terms: record carries forward and leanings drift (§5.5).
    const rec = s.world ? overallRecord(burlingtonScenario.demographics, s.world) : 0;
    record = { player: rec };
    const ward4Before = scenario.units.find((u) => u.id === "ward4")!.currentLean;
    scenario = driftAfterTerm(scenario, CITY, rec, scenario.parties.find((p) => p.id === "dem")!);
    const ward4After = scenario.units.find((u) => u.id === "ward4")!.currentLean;
    console.log(
      `  ↪ Leaning drift: Ward 4 ${ward4Before.toFixed(3)} → ${ward4After.toFixed(3)} ` +
        `(${ward4After < ward4Before ? "more progressive" : "less progressive"} after a ${rec >= 0 ? "strong" : "weak"} term)`,
    );
  }

  console.log(`\n${hr}\nTwo terms served. (M2: AI opponents · events · leaning drift.)\n${hr}\n`);
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
  const trait = BACKGROUND_TRAITS[Number(await ask("Choose a trait #", "6")) - 1] ?? BACKGROUND_TRAITS[5]!;

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
    quartersTotal: 6,
    seed,
  });
  console.log(`\nRunning for ${s.office.name} as ${player.name} (${trait.name}). Opponents run the AI.`);

  while (s.phase === "campaign" && s.campaign.week < s.campaign.weeksTotal) {
    console.log(`\n${hr}\nWeek ${s.campaign.week + 1}/${s.campaign.weeksTotal}`);
    for (;;) {
      const res = s.campaign.resources["player"]!;
      console.log(`  AP ${res.ap} · $${res.money} · 🏛️${res.capital}`);
      console.log("  [1] Rally [2] Ads [3] Retail [4] Fundraiser [5] Attack [6] End week");
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
      if (s.campaign.resources["player"]!.ap < 2) break;
    }
    for (const opp of OPPONENTS) s = aiOpponent(s, opp);
    const ev = drawCampaignEvent(makeRng(hashSeed(`${seed}-w${s.campaign.week}`)));
    if (ev) {
      const c = autoChoice(ev);
      s = applyCampaignEvent(s, c.effect);
      console.log(`  📰 ${ev.narrative} → ${c.label}`);
    }
    s = termEndWeek(s);
  }

  s = resolveElection(s);
  console.log(`\n${hr}\nELECTION RESULTS\n${hr}`);
  console.log(renderElection(scenario, s.lastElection!));
  console.log(`→ ${nameOf(scenario, s.winnerId!)} wins ${s.office.name}.`);
  if (s.winnerId !== "player") {
    console.log("\nYou lost. Better luck next cycle.\n");
    rl.close();
    return;
  }

  while (s.phase === "govern") {
    console.log(`\n${hr}\nQuarter ${s.quarter + 1}/${s.quartersTotal}`);
    if (s.world) console.log(renderWorld(s.world));
    const ev = drawGovernEvent(makeRng(hashSeed(`${seed}-q${s.quarter}`)), 0.5);
    if (ev && s.world) {
      console.log(`  📰 ${ev.narrative}`);
      ev.choices.forEach((c, i) => console.log(`     [${i + 1}] ${c.label}`));
      const pick = ev.choices[Number(await ask("  Response", "1")) - 1] ?? ev.choices[0]!;
      s = { ...s, world: applyWorldEffect(s.world, pick.effect) };
    }
    console.log("  Powers: [1] Set tax [2] Zoning [3] Fund service [4] Next quarter");
    const choice = await ask("  Choose", "4");
    const enact = (powerId: string, args?: PowerArgs) =>
      termEnactPower(
        s,
        { kind: "enactPower", actorId: "player", officeId: "mayor_burlington", powerId, targetJurisdictionId: CITY },
        args ?? {},
      );
    if (choice === "1") {
      const rate = Number(await ask("  Tax rate 0-100", "40")) / 100;
      s = enact("set_property_tax", { taxRate: rate }).state;
    } else if (choice === "2") {
      s = enact("zoning_reform").state;
    } else if (choice === "3") {
      const svc = (await ask("  Service (safety/housing/infrastructure)", "safety")) as PowerArgs["service"];
      s = enact("city_budget", { service: svc }).state;
    } else {
      s = advanceQuarter(s);
    }
  }

  console.log(`\n${hr}\nTerm complete: ${approvalLine(s)}`);
  if (s.world) console.log(renderWorld(s.world));
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
