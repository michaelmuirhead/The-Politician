# The Politician — Game Design Document

> A turn-based political **career life-sim** across three tiers of government —
> **city, state, and federal**. Create a character and live out their political
> life: campaign to get elected, then govern and shape a living world. Stay a
> beloved (or notorious) small-town mayor for your whole career, climb to the
> statehouse and stop there, or claw your way from a city council seat all the
> way to the top. How far you rise depends on how good — or how bad — you are.

**Status:** Design draft v0.2
**Genre:** Turn-based political career sim (campaign strategy + governing sim)
**Inspirations:** _The Political Machine_ (campaign loop), _The Campaign Trail /
President Infinity_ (electoral layer), _Democracy_ (governing simulation),
life-sim career progression, city-builder world dynamics.

---

## 0. The Vision

The player enters a world and lives one character's political life from entry
to the end of their career/lifespan. There is no single "right" path:

- **The City Lifer.** Win a council seat or the mayor's office and spend an
  entire career running the politics of a growing city — managing development,
  budgets, factions, and crises as the city evolves around you.
- **The State Climber.** Start in local politics, break through to the
  statehouse or governorship, and govern at the state level for the rest of
  your life.
- **The Ambitious One.** Go from a local race all the way to the top, tier by
  tier, if you have the skill, luck, and ruthlessness to make each jump.

The game must be **deep enough at every tier** that a player can have a complete,
satisfying game without ever leaving it. Vertical progression is an *option the
player earns*, not a track they're forced down.

---

## 1. Design Pillars

1. **A life, not a match.** The unit of play is a *career*, spanning many terms
   and elections over a character's lifespan. Reputation, relationships, and
   your record persist and compound.
2. **Campaign, then govern.** Getting elected is half the game; the other half
   is what you do in office and how the world reacts. Both feed each other.
3. **Every tier is a full game.** City, state, and federal each offer enough
   depth to absorb an entire career. Climbing is a choice, not a requirement.
4. **The world is alive.** Cities grow or decay, economies shift, demographics
   change — partly on their own, partly because of your decisions. Your record
   is written in the world you leave behind.
5. **Every choice has a cost.** Pleasing one demographic angers another; a
   policy that wins re-election may wreck the budget for your successor.
6. **Systems over scripts.** Outcomes emerge from a transparent, data-driven
   simulation, not hand-authored results. Players can reason about and exploit it.
7. **Readable depth.** Deep enough to reward mastery; legible enough that a new
   player understands *why* a number moved.

---

## 2. Tiers of Play

The three tiers are the same game systems at different **scale** and **scope**.
Mechanically they share one engine; they differ in data and in the powers a
seated officeholder wields.

| | **City** | **State** | **Federal** |
|---|---|---|---|
| **Constituency units** | Wards / neighborhoods | Counties / districts | States / districts |
| **Example offices** | Council member, Mayor | State legislator, Governor | Representative, Senator, President |
| **Electorate scale** | Thousands | Millions | Tens of millions |
| **Issue flavor** | Zoning, policing, schools, potholes, local business | Budgets, infrastructure, education, taxes | Economy, foreign policy, healthcare, defense |
| **Governing powers** | City budget, ordinances, development, services | State budget, statewide programs, appointments | National budget, legislation, executive actions |
| **"Living world" layer** | City growth (population, economy, districts) | Regional economy & inter-city dynamics | National economy & geopolitics |
| **Campaign scale** | Small money, retail politics, door-knocking | Bigger money, media, regional targeting | Massive money, national media, electoral map |

**Key reuse:** a "constituency unit" is the generalization of the v0.1 *Region*.
The support simulation (§5) runs identically at every tier — only the units,
issues, demographics, and electorate sizes change, all of which are **data**.

---

## 3. The Nested Game Loops

Play nests at three levels of time:

```
CAREER  (a character's lifespan)
  │  choose entry office & tier → live through many terms → retire/lose/age out
  │
  ├── TERM  (one elected office, fixed length, e.g. 4 yrs)
  │     │
  │     ├── CAMPAIGN MODE  (the run-up to an election)
  │     │      weekly turns: spend resources, target units, take positions,
  │     │      react to events  →  election day  →  win/lose
  │     │
  │     └── GOVERN MODE  (time in office, if you won)
  │            periodic turns: enact policy, manage budget, handle crises,
  │            build your record, shape the living world  →  end of term
  │
  └── PROGRESSION  (between terms)
        re-run for same office? · seek higher office (if eligible)? ·
        term-limited out? · retire? · the world & your reputation carry forward
```

- **Campaign Mode** is the v0.1 electoral strategy loop (rallies, ads,
  fundraising, issue positioning, GOTV) — see §6.
- **Govern Mode** is the new _Democracy_-style loop: in office you wield the
  powers of your seat to enact policy against a budget, satisfy constituents
  and factions, and respond to crises, all while the world simulation runs.
- **Progression** is the career meta-game that decides whether/where you run
  next — see §8.

---

## 4. Career & Character (the meta-game)

```ts
interface Character {
  id: string; name: string;
  age: number;                 // advances with time; career ends at lifespan/retirement
  party: PartyId;
  stats: CandidateStats;       // charisma, intelligence, stamina, fundraising, composure, integrity
  traits: TraitId[];           // war_hero, outsider, wonk, firebrand, machine_boss, reformer…
  positions: Record<IssueId, number>;
  reputation: Reputation;      // see below
  history: OfficeRecord[];     // every office sought/held + what you did with it
  relationships: Record<ActorId, number>; // donors, factions, party bosses, rivals, press
  warChest: number;
}

interface Reputation {
  // "good or bad enough" — both competence AND notoriety open doors
  approval: number;            // current constituents
  nameRecognition: number;     // by tier — how far your name carries
  recordQuality: number;       // governing accomplishments (or disasters)
  integrity: number;           // kept promises vs. flip-flops & scandals
  notoriety: number;           // infamy can be its own kind of fuel
}
```

- **Lifespan & age.** A career is finite. Time spent campaigning and governing
  ages the character; eventually they retire, lose, or age out. This is the
  ultimate scarce resource — every term spent at one tier is a term not spent
  climbing.
- **"Good or bad enough."** Vertical doors open via reputation, which can be
  earned through *competence* (high approval, strong record) **or** *notoriety*
  (a firebrand who fails upward on name recognition and a rabid base). A merely
  mediocre politician can sustain a long, comfortable career at one tier.
- **Persistent consequences.** Your record, relationships, and the state of the
  world carry across terms and tiers. The budget you blew as mayor is still
  blown when your successor inherits it; the rival you crushed remembers it.

---

## 5. The Simulation Model (the shared engine)

The deterministic core — recomputed each turn, identical across all tiers and
both modes. Generalizes the v0.1 model from "regions" to **constituency units**.

### 5.1 Entities

- **Issues** — 1-D position axis (−1.0 … +1.0). The *set* of salient issues
  varies by tier (potholes & zoning at city scale; foreign policy at federal).
- **Demographic groups** — each has a size (per unit), ideal position per issue,
  issue-salience weighting, and turnout propensity.
- **Constituency units** — wards / counties / states depending on tier. Each has
  its prize (council seats / electoral votes / legislative seats), a demographic
  mix, a base partisan lean, and a current support split.
- **Candidates / officeholders** — stats, traits, positions, identity groups.

### 5.2 How support is computed

For each unit, support sums over demographic groups (group size × affinity):

```
issueScore(group, candidate) =
    Σ_issues salience[group][issue] × (1 − |candidatePos[issue] − groupIdeal[issue]| / 2)

affinity(group, candidate) =
    w_issues   × normalize(issueScore)
  + w_identity × identityFit(group, candidate)     // charisma, traits, demographics
  + w_lean     × partisanLean(group, unit)
  + w_record   × recordEffect(group, officeholder) // GOVERN: your track record
  + w_campaign × campaignPressure(group, unit)      // CAMPAIGN: decaying ad/rally effects
  + noise()
```

- `recordEffect` is new for **Govern Mode**: groups react to the policies you've
  actually enacted and the state of the world you've produced.
- `campaignPressure` decays each turn (`*= 0.85`) so campaigning requires
  sustained investment.
- Support is softmax-normalized across candidates + an undecided pool; seats /
  electoral votes are awarded per the tier's rule (winner-take-all by default).

### 5.3 Turnout

```
turnout(group, unit) = baseTurnout(group)
                     × (1 + gotvBoost(group, unit))   // ground game
                     × enthusiasm(group, candidate)    // alignment, record, events
```

### 5.4 Why this design

Pure & deterministic (seeded) → unit-testable and balanceable headlessly;
every poll movement is explainable; all content is data, so new tiers, maps,
and scenarios ship without engine changes.

---

## 6. Campaign Mode — Actions

What the player spends resources on while running. Each action has an AP cost,
optional money/capital cost, a target (unit / demographic / issue / wide), and
data-driven effects. Costs and scale auto-adjust by tier.

| Action | Costs | Effect |
|---|---|---|
| **Hold Rally** | ⚡⚡ + 💰 | Short-term pressure spike + enthusiasm in target unit |
| **Run Ads** | ⚡ + 💰💰 | Sustained pressure toward a unit, framed on an issue |
| **Attack Ad** | ⚡ + 💰💰 + 🏛️ | Lowers opponent support; can backfire |
| **Fundraiser** | ⚡⚡ | Converts time into 💰, scaled by `fundraising` |
| **Door-knock / Retail** | ⚡⚡ | High-impact, small-scale — dominant at **city** tier |
| **Stake Issue Position** | ⚡ (+🏛️ if flip-flopping) | Shifts affinity across all units |
| **Debate** | ⚡⚡ | Scheduled; scales with `intelligence`/`composure` |
| **Build Field Office** | ⚡ + 💰 | Persistent GOTV bonus in a unit |
| **Seek Endorsement** | ⚡ + 🏛️ | Chance-based; pressure with aligned groups + capital |

Resources: **Action Points/Stamina (⚡)**, **Money (💰)**, **Political Capital
(🏛️)**, and **Time (🗓️, the turn counter)**. Money carries over; AP does not.

---

## 7. Govern Mode — Holding Office & the Living World

The other half of the game, unlocked by winning. While in office you wield your
seat's **powers** over periodic turns; the **living world** responds.

### 7.1 Governing actions (powers scale by tier & office)

| Power | Example | Effect |
|---|---|---|
| **Set Budget** | Allocate revenue across services/programs | Funds services, runs deficits/surpluses, pleases/angers groups |
| **Enact Policy / Ordinance** | Zoning reform, policing policy, tax change | Moves world variables + group satisfaction (the _Democracy_ web) |
| **Fund Development** | Approve a project, district, infrastructure | Drives **city growth**: population, economy, new units over time |
| **Make Appointments** | Staff, commissioners, judges | Buffs governing effectiveness; spends/earns relationships |
| **Handle Crisis** | Respond to events (disaster, scandal, downturn) | Time-pressured choices with lasting world + reputation effects |
| **Deal-making** | Trade votes/favors with factions & rivals | Spends political capital & relationships to pass agendas |

### 7.2 The living world simulation

Each governing turn advances a **world model** that exists independent of
elections and carries across terms and successors:

- **City tier:** population, jobs, housing, economy, public services, crime,
  district development. "Oversee the growth of a city" = steering this model
  over many terms; neglect causes decay, blight, flight.
- **State tier:** regional economy, inter-city dynamics, statewide services.
- **Federal tier:** national economy, geopolitics, federal programs.

The world model feeds back into the support simulation via `recordEffect`
(§5.2): visible outcomes (a booming downtown, a budget crisis, rising crime)
shift how demographics judge you. **Your record is the world you produced.**

### 7.3 Govern ↔ Campaign coupling

A strong record + happy constituents → easy re-election and higher name
recognition (climbing fuel). A disastrous or do-nothing term → primary
challenges, lost seats, and capped ambition. The two modes are one feedback loop.

---

## 8. Progression — Between Terms & Across Tiers

After each term the **Progression** step decides what's next:

- **Re-run** for the same office (subject to term limits).
- **Seek higher office** — gated by **eligibility** (name recognition, record,
  party support, war chest) and by **opportunity** (an open seat, a beatable
  incumbent, the right political moment). This is where "good or bad enough"
  bites: you need enough reputation *of some kind* to be viable.
- **Stay put for life** — a fully supported path; the game must remain rich
  for a career-long city or state politician.
- **Retire / age out / lose** — the career ends; a **post-career summary**
  scores the life (offices held, world impact, integrity, legacy).

Climbing a tier resets you to a relative underdog at a larger scale (a giant
fish in the small pond becomes a minnow in the big one) — the classic risk of
ambition. Failed jumps can end careers or send you back down.

---

## 9. Events & News Cycle

Each turn (both modes) may fire weighted, condition-gated events from a data
pool: gaffes, scandals, economic reports, disasters, donor ultimatums,
opportunities to exploit a rival. Event choices route into the same effect
system as actions/powers, so narrative and systems share one engine.

---

## 10. Opponent & World AI

1. **v1 — Heuristic candidates:** score actions by expected gain per AP using
   the sim as a lookahead; target the closest worthwhile units.
2. **v1 — Governing rivals/factions:** other officeholders run the world model
   too; factions push agendas you must deal with.
3. **v2 — Personalities:** AI weights behavior by traits.
4. **v3 (stretch) — Shallow lookahead** over pruned actions.

Because the sim is pure, AI evaluates moves by calling it directly.

---

## 11. Architecture

Separate **simulation** from **presentation**; build one engine that serves all
tiers and both modes.

```
the-politician/
├─ packages/
│  ├─ core/                  # pure TypeScript, zero UI deps — THE ENGINE
│  │  ├─ models/             # Character, Office, Unit, Issue, Demographic, Action, Power, Event
│  │  ├─ data/               # content: tiers, scenarios, maps, issues, demographics
│  │  │  ├─ tiers/           # city / state / federal definitions
│  │  │  └─ scenarios/       # complete playable setups
│  │  ├─ sim/                # support, turnout, pressure decay, election tally
│  │  ├─ world/              # living-world model (growth/economy) + record effects
│  │  ├─ actions/            # campaign actions + effect operators
│  │  ├─ powers/             # governing powers + effect operators
│  │  ├─ events/             # event pool + resolution
│  │  ├─ career/             # lifespan, progression, eligibility, scoring
│  │  ├─ ai/                 # candidate + governing AI
│  │  ├─ engine.ts           # nested state machine; pure reducer (state, command) → state
│  │  └─ rng.ts              # seeded RNG for determinism
│  ├─ cli/                   # terminal harness over core — first playable
│  └─ web/                   # (later) React + SVG map over the same core
```

**Principles**

- `core` is **deterministic** (seeded RNG) and **side-effect free** → unit
  tests + balance simulations run headlessly here.
- State advances through a **pure reducer** `(state, command) → newState`; both
  CLI and web dispatch into it and hold no game logic.
- **Tiers, offices, maps, issues, world rules are all data** — new tiers and
  scenarios ship without engine changes.

**Tech:** TypeScript (strict) · Node + Vite · Vitest (unit + golden-master
balance snapshots) · CLI first · later React + SVG/Canvas map, deployed free to
GitHub Pages.

---

## 12. Data Schema (v2 starter)

```ts
type IssueId = string; type DemographicId = string;
type UnitId = string;  type PartyId = string;
type OfficeId = string; type TierId = "city" | "state" | "federal";

interface Issue { id: IssueId; name: string; tiers: TierId[]; }

interface Demographic {
  id: DemographicId; name: string;
  ideals: Record<IssueId, number>;     // −1 … +1
  salience: Record<IssueId, number>;   // 0 … 1, sum ≈ 1
  baseTurnout: number;                 // 0 … 1
}

interface Unit {                        // ward / county / state, per tier
  id: UnitId; name: string; tier: TierId;
  seats: number;                        // prize: council seats / electoral votes / etc.
  partisanLean: number;                 // −1 … +1
  mix: Record<DemographicId, number>;   // group shares, sum ≈ 1
}

interface Office {
  id: OfficeId; name: string; tier: TierId;
  termLength: number;                   // turns/years
  termLimit?: number;
  powers: PowerId[];                    // what you can do once seated
  eligibility: EligibilityRule;         // what it takes to run
}

interface WorldState {                  // the living world for the current jurisdiction
  population: number; economy: number; budget: number;
  services: Record<string, number>;
  development: Record<UnitId, number>;
  // …tier-specific fields
}

interface Scenario {                    // a complete playable world
  id: string; name: string;
  tiers: TierId[];
  issues: Issue[]; demographics: Demographic[];
  units: Unit[]; offices: Office[];
  candidates: Character[];
  world: WorldState;
}
```

---

## 13. Milestone Roadmap

Build the **city tier as a full vertical slice first** — it exercises both
Campaign and Govern modes plus the living-world sim at the smallest, cheapest
scale. Then generalize the proven engine to state & federal, then wire up the
cross-tier career.

### M0 — Engine foundations (headless, testable here)
- [ ] Scaffold `core` (TS strict, Vitest), seeded RNG.
- [ ] Data models + a small **city scenario** (~6 wards, 6 local issues, 5 demographics).
- [ ] Support + turnout simulation; seat tally.
- [ ] Unit tests: monotonicity & determinism.

### M1 — City vertical slice: campaign + govern (CLI)
- [ ] Nested state machine: Term → Campaign → Govern → end-of-term.
- [ ] Campaign Mode loop + first actions (Rally, Ads, Fundraiser, Retail, Position).
- [ ] Govern Mode loop + first powers (Budget, Ordinance, Development).
- [ ] Living **city** world model + `recordEffect` feedback into the sim.
- [ ] CLI: win a council/mayor race, then govern a term, in the terminal.

### M2 — Make the city a full game
- [ ] Heuristic opponent + governing rivals/factions AI.
- [ ] Event/news system + starter pool (campaign + governing events).
- [ ] City growth/decay dynamics across multiple terms.
- [ ] Balance pass via batch sims; golden-master tests.

### M3 — Career meta-game (single tier)
- [ ] Lifespan/age, multiple terms, re-election, term limits.
- [ ] Reputation model (approval, name recognition, record, integrity, notoriety).
- [ ] Post-career scoring & legacy summary.
- [ ] Prove a satisfying career-long **city-only** game.

### M4 — State & Federal tiers (engine reuse)
- [ ] State + federal tier data (units, offices, issues, powers, world models).
- [ ] Cross-tier **Progression**: eligibility, seeking higher office, the
      underdog reset, failed-jump consequences.
- [ ] Validate all three single-tier games and the full climb.

### M5 — Web UI & content (stretch)
- [ ] Vite + React over the same `core`; interactive SVG maps per tier.
- [ ] Campaign/Govern/Career screens; results & legacy views.
- [ ] Deploy to GitHub Pages.
- [ ] More scenarios, candidate traits, difficulty levels, save/load.

---

## 14. Open Questions

- **Setting:** real US places/parties, or a **fictional, data-swappable**
  world? (Recommend fictional-first — real maps become scenario files later,
  and it sidesteps partisanship/licensing.)
- **Continuity across tiers:** one persistent world the character moves *up*
  through (the city you ran is part of the state you now govern), or separate
  jurisdictions per office? (Persistent is richer but more complex — likely M4+.)
- **Time granularity:** campaign turns are weeks; what's a govern turn — months?
  quarters? Must let a full multi-term career finish in a reasonable session.
- **Lifespan length:** target career length (terms) and how aggressively age
  limits ambition.
- **Tone:** earnest civics sim vs. satirical — shapes event writing and traits.
- **Death/health:** does the character age and risk health events (life-sim
  flavor), or simply retire at a set age?
