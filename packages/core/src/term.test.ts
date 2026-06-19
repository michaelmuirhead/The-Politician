import { describe, it, expect } from "vitest";
import {
  startTerm,
  termCampaignAction,
  termEndWeek,
  resolveElection,
  termEnactPower,
  advanceQuarter,
  type TermState,
} from "./term.js";
import { overallRecord } from "./world/index.js";
import { burlingtonScenario } from "./data/burlingtonVT.js";

const wards = ["ward1", "ward2", "ward3", "ward4", "ward5"];

function newTerm(seed: number | string = "m1") {
  return startTerm(burlingtonScenario, {
    officeId: "mayor_burlington",
    candidateIds: ["alice", "bob", "carol"],
    weeksTotal: 6,
    quartersTotal: 4,
    seed,
  });
}

/** Spend all of a candidate's weekly AP retailing across the wards. */
function retailEverywhere(state: TermState, candidateId: string): TermState {
  let s = state;
  let i = 0;
  for (;;) {
    const res = s.campaign.resources[candidateId]!;
    if (res.ap < 2) break;
    const ward = wards[i % wards.length]!;
    const out = termCampaignAction(s, candidateId, { kind: "retail", unitId: ward });
    if (out.note.startsWith("refused")) break;
    s = out.state;
    i++;
  }
  return s;
}

describe("term: campaign → election → govern → end", () => {
  it("campaigning raises the candidate's vote total (same seed)", () => {
    // With campaigning.
    let active = newTerm("cmp");
    for (let w = 0; w < active.campaign.weeksTotal; w++) {
      active = retailEverywhere(active, "alice");
      active = termEndWeek(active);
    }
    active = resolveElection(active);

    // Without campaigning.
    let idle = newTerm("cmp");
    for (let w = 0; w < idle.campaign.weeksTotal; w++) idle = termEndWeek(idle);
    idle = resolveElection(idle);

    expect(active.lastElection!.votesByCandidate["alice"]!).toBeGreaterThan(
      idle.lastElection!.votesByCandidate["alice"]!,
    );
  });

  it("seats the winner and enters the govern phase with a live world", () => {
    let s = newTerm();
    for (let w = 0; w < s.campaign.weeksTotal; w++) {
      s = retailEverywhere(s, "alice");
      s = termEndWeek(s);
    }
    s = resolveElection(s);
    expect(s.phase).toBe("govern");
    expect(s.winnerId).toBeDefined();
    expect(s.seats["mayor_burlington"]).toBe(s.winnerId);
    expect(s.world).toBeDefined();
  });

  it("the seated mayor can govern, and illegal commands are refused", () => {
    let s = resolveElection(seededGovernReady());
    const mayor = s.winnerId!;

    // Legal: fund safety.
    const ok = termEnactPower(
      s,
      { kind: "enactPower", actorId: mayor, officeId: "mayor_burlington", powerId: "city_budget", targetJurisdictionId: "burlington" },
      { service: "safety" },
    );
    expect(ok.ok).toBe(true);
    expect(ok.state.world!.services.safety).toBeGreaterThan(s.world!.services.safety);

    // Illegal: a mayor cannot impose a federal embargo.
    const embargo = termEnactPower(ok.state, {
      kind: "enactPower",
      actorId: mayor,
      officeId: "mayor_burlington",
      powerId: "impose_embargo",
      targetJurisdictionId: "burlington",
    });
    expect(embargo.ok).toBe(false);
    expect(embargo.note).toMatch(/power_not_in_office/);

    // Illegal: someone who isn't the mayor.
    const notMayor = mayor === "carol" ? "bob" : "carol";
    const usurp = termEnactPower(ok.state, {
      kind: "enactPower",
      actorId: notMayor,
      officeId: "mayor_burlington",
      powerId: "city_budget",
      targetJurisdictionId: "burlington",
    });
    expect(usurp.ok).toBe(false);
    expect(usurp.note).toMatch(/not_officeholder/);
  });

  it("governing well improves the city's record over a full term", () => {
    let s = resolveElection(seededGovernReady());
    const mayor = s.winnerId!;
    const groups = burlingtonScenario.demographics;
    const startRecord = overallRecord(groups, s.world!);

    // Fund every service and cut taxes a bit over the term.
    const services = ["safety", "housing", "infrastructure"] as const;
    let i = 0;
    while (s.phase === "govern") {
      const svc = services[i % services.length]!;
      s = termEnactPower(
        s,
        { kind: "enactPower", actorId: mayor, officeId: "mayor_burlington", powerId: "city_budget", targetJurisdictionId: "burlington" },
        { service: svc },
      ).state;
      s = termEnactPower(
        s,
        { kind: "enactPower", actorId: mayor, officeId: "mayor_burlington", powerId: "zoning_reform", targetJurisdictionId: "burlington" },
      ).state;
      s = advanceQuarter(s);
      i++;
    }
    expect(s.phase).toBe("ended");
    expect(overallRecord(groups, s.world!)).toBeGreaterThan(startRecord);
  });
});

/** A term advanced through its campaign weeks (no actions), ready to resolve. */
function seededGovernReady(): TermState {
  let s = newTerm("gov");
  for (let w = 0; w < s.campaign.weeksTotal; w++) s = termEndWeek(s);
  return s;
}
