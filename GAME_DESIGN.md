# The Politician — Game Design Document

> A turn-based political **career & dynasty life-sim** set in a single,
> persistent, real United States — across three nested tiers of government:
> **city, state, and federal**. Create a character and live out their political
> life: campaign to get elected, then govern and shape a living world. Stay a
> beloved (or notorious) small-town mayor for your whole career, climb to the
> statehouse and stop there, or claw your way from a city council seat all the
> way to the top. How far you rise depends on how good — or how bad — you are.
> Careers span decades and end in retirement or death; when one life ends, an
> heir or protégé can carry the lineage on across generations.

**Status:** Design draft v0.4
**Genre:** Turn-based political career/dynasty sim (campaign strategy + governing sim)
**Inspirations:** _The Political Machine_ (campaign loop), _The Campaign Trail /
President Infinity_ (electoral layer), _Democracy_ (governing simulation),
life-sim career & dynasty progression, city-builder world dynamics.

### Resolved design decisions (v0.3)

| Question | Decision |
|---|---|
| **Setting** | **Real US** places and parties — real cities, states, and the nation; real parties and issues. |
| **Tier continuity** | **One persistent nested world** — a real city sits inside its state inside the nation; AI runs every office you don't hold; your record compounds upward. |
| **Govern turn** | **Quarterly** (4 turns/year, ~16 per 4-year term), with fast-forward through quiet stretches. |
| **Career length** | **Long / generational** — multi-decade careers and dynastic succession across generations. |
| **Tone** | **Earnest civics sim** — realistic issues, credible trade-offs, news-like events; dry wit at most. |
| **Aging & death** | **Hard mortality** — characters age and can die (health, accidents, age), even in office, forcing succession. |

### Follow-on decisions (v0.4)

| Question | Decision |
|---|---|
| **Data scope** | **Full nation from the start** — the entire US (all states, major cities, districts) exists in the persistent world; engine bring-up still validates on a focused slice. |
| **Party realism** | **Real party names, generic data-driven platforms** — no real politicians or current events; evergreen and non-editorializing. |
| **Succession** | **Auto-pool + grooming** — a pool of heirs/protégés is generated, and the player can actively groom successors during a career. |
| **Mortality tuning** | **Actuarial age curve + stress modifiers**, lowered by health/lifestyle; optional **"no permadeath" mode**. |
| **Vacant seats** | **Real US rules per office** — appointment, special election, or line-of-succession depending on the seat. |
| **Time advance** | **Smart skip** — auto-advance through quiet quarters; stop on events, due decisions, or approaching elections. |

---

## 0. The Vision

The player enters a single, persistent United States and lives one character's
political life from entry to the end of their career — and then, across
generations, the life of their heirs and protégés. There is no single "right"
path:

- **The City Lifer.** Win a council seat or the mayor's office and spend an
  entire career running the politics of a growing city — managing development,
  budgets, factions, and crises as the city evolves around you.
- **The State Climber.** Start in local politics, break through to the
  statehouse or governorship, and govern at the state level for the rest of
  your life.
- **The Ambitious One.** Go from a local race all the way to the top, tier by
  tier, if you have the skill, luck, and ruthlessness to make each jump.

- **The Dynasty.** Build a political family or machine: when your character
  retires or dies, continue as an heir or protégé and let the lineage's name,
  relationships, and reputation compound over generations.

The game must be **deep enough at every tier** that a player can have a complete,
satisfying game without ever leaving it. Vertical progression is an *option the
player earns*, not a track they're forced down. Because the world is real,
persistent, and nested, every office you hold is a real place inside the same
living country — and every office you *don't* hold is run by AI around you.

---

## 1. Design Pillars

1. **A life — and a lineage.** The unit of play is a *career*, spanning many
   terms over a character's lifespan; and beyond that a *dynasty*, as heirs and
   protégés inherit a name, relationships, and reputation across generations.
   Reputation, relationships, and your record persist and compound.
2. **Campaign, then govern.** Getting elected is half the game; the other half
   is what you do in office and how the world reacts. Both feed each other.
3. **Every tier is a full game.** City, state, and federal each offer enough
   depth to absorb an entire career. Climbing is a choice, not a requirement.
4. **One alive, persistent world.** There is a single real United States. Cities
   grow or decay, economies shift, demographics change — partly on their own,
   partly because of your decisions, and partly because of the AI officeholders
   running every other seat. Your record is written in the world you leave
   behind, and your successors inherit it.
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

The world is the **real United States**, modeled as a nested hierarchy: wards
make up a city, cities/counties make up a state, states make up the nation. You
occupy one seat at a time; AI holds the rest.

| | **City** | **State** | **Federal** |
|---|---|---|---|
| **Constituency units** | Wards / precincts | Counties / state-house districts | Congressional districts / states |
| **Example offices** | City Council, Mayor | State Rep/Senator, Governor | U.S. Representative, U.S. Senator, President |
| **Electorate scale** | Thousands | Millions | Tens of millions |
| **Real issues** | Zoning, policing, schools, potholes, transit, local business | State budget, infrastructure, education, taxes, healthcare | Economy, foreign policy, healthcare, immigration, defense |
| **Governing powers** | City budget, ordinances, development, services | State budget, statewide programs, appointments | National budget, legislation, executive actions |
| **"Living world" layer** | City growth (population, economy, districts) | State economy & inter-city dynamics | National economy & geopolitics |
| **Campaign scale** | Small money, retail politics, door-knocking | Bigger money, media, regional targeting | Massive money, national media, the electoral map |

**Real parties, generic platforms.** Candidates run under real U.S. party names
(Democratic, Republican, plus minor/independent options), each with baseline
demographic leans the simulation treats as data. Platforms are **generic and
data-driven** — no real politicians, named figures, or current events — so the
game stays evergreen and avoids editorializing.

**Key reuse:** a "constituency unit" is the generalization of the v0.1 *Region*.
The support simulation (§5) runs identically at every tier — only the units,
issues, demographics, and electorate sizes change, all of which are **data**.
Because the world is nested, a city's units roll up into its state's units,
which roll up into the nation — so a single hierarchy of real places powers all
three tiers at once.

---

## 3. The Nested Game Loops

Play nests at four levels of time:

```
DYNASTY  (a lineage, across generations)
  │  one persistent world · when a character retires or dies, continue as
  │  an heir/protégé who inherits name, relationships & reputation
  │
  └── CAREER  (one character's lifespan)
        │  choose entry office & tier → live through many terms →
        │  retire, lose, age out, or DIE (hard mortality, even in office)
        │
        ├── TERM  (one elected office, fixed length, e.g. 4 yrs)
        │     │
        │     ├── CAMPAIGN MODE  (the run-up to an election)
        │     │      weekly turns: spend resources, target units, take
        │     │      positions, react to events → election day → win/lose
        │     │
        │     └── GOVERN MODE  (time in office, if you won)
        │            QUARTERLY turns (~16 per 4-yr term, fast-forward quiet
        │            stretches): enact policy, manage budget, handle crises,
        │            build your record, shape the living world → end of term
        │
        └── PROGRESSION  (between terms)
              re-run for same office? · seek higher office (if eligible)? ·
              term-limited out? · retire? · world & reputation carry forward
```

The simulation clock runs continuously across the whole world, so AI-held
offices campaign, govern, and turn over on their own schedules while you play
yours.

**Smart fast-forward.** Because careers span decades of quarterly turns, the
game **auto-advances through quiet quarters** and stops only when the player is
needed — an event fires, a decision is due, or an election approaches. This
keeps generational play brisk without reducing meaningful turns to busywork.

- **Campaign Mode** is the v0.1 electoral strategy loop (rallies, ads,
  fundraising, issue positioning, GOTV) — see §6.
- **Govern Mode** is the new _Democracy_-style loop: in office you wield the
  powers of your seat to enact policy against a budget, satisfy constituents
  and factions, and respond to crises, all while the world simulation runs.
- **Progression** is the career meta-game that decides whether/where you run
  next — see §8.

---

## 4. Career, Lineage & Mortality (the meta-game)

```ts
interface Character {
  id: string; name: string;
  age: number;                 // advances with time
  health: number;              // declines with age/stress; drives mortality risk
  alive: boolean;
  party: PartyId;
  stats: CandidateStats;       // charisma, intelligence, stamina, fundraising, composure, integrity
  traits: TraitId[];           // war_hero, outsider, wonk, firebrand, machine_boss, reformer…
  positions: Record<IssueId, number>;
  reputation: Reputation;      // see below
  history: OfficeRecord[];     // every office sought/held + what you did with it
  relationships: Record<ActorId, number>; // donors, factions, party bosses, rivals, press
  warChest: number;
  lineageId: string;           // the dynasty this character belongs to
  successors: string[];        // heirs/protégés eligible to carry the lineage on
}

interface Lineage {            // the dynasty — persists across generations
  id: string; name: string;    // the family / machine name that compounds over time
  members: string[];           // characters, in succession order
  legacy: number;              // cumulative standing of the whole line
  inheritedRelationships: Record<ActorId, number>; // what passes to successors
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

- **Lifespan, age & mortality.** A career is finite. Time spent campaigning and
  governing ages the character and wears down `health`; eventually they retire,
  lose, age out — or **die**. Death risk follows a realistic **actuarial age
  curve**, raised by **stress** (hard campaigns, crises, scandals) and lowered by
  **health/lifestyle** choices; it can strike even mid-term, triggering
  succession and a seat-filling process (§8). Age is the ultimate scarce
  resource: every term spent at one tier is a term not spent climbing, and the
  clock never stops. A **"no permadeath" mode** is available for players who want
  a single uninterrupted career.
- **Lineage & succession.** When a character's run ends, the player continues as
  one of their **successors** (an heir or political protégé), who inherits the
  lineage name, a portion of its relationships, and its `legacy`. Successors
  come from **both** an auto-generated pool *and* deliberate **grooming** during
  a career (mentoring, endorsements, building the family/machine's standing). A
  strong, well-tended lineage gives the next character a head start; a disgraced
  or neglected one is a liability to live down. This is how a "long /
  generational" game spans the decades.
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

There is **one persistent, nested world model** for the whole United States,
running continuously whether or not you hold a given seat. Each governing turn
advances it; it carries across terms, characters, and generations:

- **City tier:** population, jobs, housing, economy, public services, crime,
  district development. "Oversee the growth of a city" = steering this model
  over many terms; neglect causes decay, blight, flight.
- **State tier:** state economy, inter-city dynamics, statewide services —
  aggregating the cities within it.
- **Federal tier:** national economy, geopolitics, federal programs —
  aggregating the states within it.

**Nesting & AI.** Your city sits inside its state inside the nation. Levels
above and below you are run by **AI officeholders** and roll their outcomes into
yours: a state recession buffets your city; a thriving city you built lifts its
state's numbers. When you climb, you inherit the very world your predecessors
(and your own earlier self) shaped.

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
- **Retire / age out / lose / die** — the character's run ends; a **post-career
  summary** scores the life (offices held, world impact, integrity, legacy).
- **Succession** — the player continues the **lineage** as an heir or protégé
  (§4), inheriting name, partial relationships, and accumulated legacy.
- **Filling vacant seats** — when any officeholder (player or AI) dies or leaves
  mid-term, the seat is filled per **real US rules for that office**: e.g.
  governor-appointed replacements for U.S. Senate seats, special elections for
  the U.S. House and many mayoralties, and line-of-succession for executives
  (a deceased mayor's seat passing to council leadership, etc.). Each office
  carries its own `vacancyRule` in data.

Climbing a tier resets you to a relative underdog at a larger scale (a giant
fish in the small pond becomes a minnow in the big one) — the classic risk of
ambition. Failed jumps can end careers or send you back down. Because the world
is persistent, a higher seat is governed atop the actual state your predecessors
left behind.

---

## 9. Events & News Cycle

Each turn (both modes) may fire weighted, condition-gated events from a data
pool: gaffes, scandals, economic reports, disasters, donor ultimatums,
opportunities to exploit a rival, and **personal health/mortality events** as a
character ages. Event choices route into the same effect system as
actions/powers, so narrative and systems share one engine.

**Tone: earnest civics sim.** Events read like credible political news, not
parody — realistic issues and trade-offs, dry wit at most. The drama comes from
genuine dilemmas and consequences rather than caricature.

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
│  │  ├─ models/             # Character, Lineage, Office, Unit, Issue, Demographic, Action, Power, Event
│  │  ├─ data/               # content: tiers, real-US world, issues, demographics
│  │  │  ├─ tiers/           # city / state / federal definitions
│  │  │  ├─ usa/             # real US data: nested cities/counties/states, parties, issues
│  │  │  └─ scenarios/       # complete playable setups (entry office/tier)
│  │  ├─ sim/                # support, turnout, pressure decay, election tally
│  │  ├─ world/              # ONE persistent nested world model + record effects
│  │  ├─ actions/            # campaign actions + effect operators
│  │  ├─ powers/             # governing powers + effect operators
│  │  ├─ events/             # event pool + resolution (incl. health/mortality)
│  │  ├─ career/             # lifespan, aging/mortality, progression, eligibility, scoring
│  │  ├─ dynasty/            # lineage, succession, heir/protégé generation, legacy
│  │  ├─ persistence/        # save/load of the long-running world & lineage state
│  │  ├─ ai/                 # candidate + governing AI for all unheld offices
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
  scenarios ship without engine changes. The real-US world is the canonical
  dataset.
- **Persistence is first-class.** A long, generational game spanning decades
  requires save/load of the entire persistent world + lineage state from the
  start, not as an afterthought.
- **The whole world simulates.** AI runs every unheld office on its own clock;
  the player observes/inherits a country that lives without them.

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
  vacancyRule: "appointment" | "special_election" | "succession"; // real US rule
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

The persistent world is the **full nation from the start**, but we de-risk by
building the **city tier as a playable vertical slice first** — the player's
seat is one real city while the rest of the US exists around them (simulated
coarsely at first, refined as tiers come online). This exercises both Campaign
and Govern modes plus the living-world sim cheaply, then the proven engine
generalizes upward.

A parallel **national data pipeline** (M0+) ingests real US geography and
demographics (public census/electoral sources) into swappable data files,
refined in resolution over the milestones.

### M0 — Engine foundations + data pipeline (headless, testable here)
- [ ] Scaffold `core` (TS strict, Vitest), seeded RNG.
- [ ] Data models + national data ingestion: nested US states/cities/districts,
      real party leans, issue & demographic schema (coarse first pass).
- [ ] A focused **playable slice**: one real city wired for full play; the rest
      of the nation present but coarse.
- [ ] Support + turnout simulation; seat tally.
- [ ] Unit tests: monotonicity & determinism.

### M1 — City vertical slice: campaign + govern (CLI)
- [ ] Nested state machine: Term → Campaign (weekly) → Govern (quarterly) → end-of-term.
- [ ] Campaign Mode loop + first actions (Rally, Ads, Fundraiser, Retail, Position).
- [ ] Govern Mode loop + first powers (Budget, Ordinance, Development).
- [ ] Living **city** world model + `recordEffect` feedback into the sim.
- [ ] CLI: win a council/mayor race, then govern a term, in the terminal.

### M2 — Make the city a full game
- [ ] Heuristic opponent + governing rivals/factions AI.
- [ ] Event/news system + starter pool (campaign + governing events), earnest tone.
- [ ] City growth/decay dynamics across multiple terms.
- [ ] Balance pass via batch sims; golden-master tests.

### M3 — Career, mortality & dynasty (single tier)
- [ ] Lifespan/age, **health & hard mortality**: actuarial age curve + stress
      modifiers, lowered by health/lifestyle; death-in-office; "no permadeath" mode.
- [ ] **Vacant-seat filling** per real US `vacancyRule` (appointment / special
      election / succession).
- [ ] Reputation model (approval, name recognition, record, integrity, notoriety).
- [ ] **Lineage & succession**: auto-generated heir pool + active grooming,
      inherited relationships, legacy.
- [ ] **Save/load** of the long-running world + lineage (first-class).
- [ ] **Smart fast-forward** through quiet quarters.
- [ ] Post-career & dynasty scoring; prove a satisfying multi-generation
      **city-only** game.

### M4 — State & Federal tiers + full nested world (engine reuse)
- [ ] Refine national data to full resolution: state + federal units, offices,
      issues, powers, world models.
- [ ] **Nested world roll-up**: city ⊂ state ⊂ nation; AI runs all unheld
      offices; levels influence each other.
- [ ] Cross-tier **Progression**: eligibility, seeking higher office, the
      underdog reset, failed-jump consequences, inheriting predecessors' world.
- [ ] Validate all three single-tier games and the full climb.

### M5 — Web UI & content (stretch)
- [ ] Vite + React over the same `core`; interactive SVG maps per tier.
- [ ] Campaign/Govern/Career/Dynasty screens; results & legacy views.
- [ ] Deploy to GitHub Pages.
- [ ] Broader real-US data, more candidate traits, difficulty levels.

---

## 14. Resolved Decisions & Remaining Questions

All twelve design questions raised so far are now **resolved** — see the two
decision tables at the top of this document (core decisions v0.3, follow-on
decisions v0.4).

Remaining questions are **implementation-level**, to settle as we build:

- **Data sourcing specifics.** Exact public datasets for the national geography
  and demographics, and how finely to model districts/wards initially.
- **Successor carry-over.** How much of a predecessor's stats, positions, and
  relationships transfer to an heir vs. start fresh.
- **Stress & health formulas.** The precise curves linking campaign/crisis
  stress and lifestyle choices to mortality risk.
- **Difficulty surface.** What "no permadeath" and other difficulty toggles
  expose (AI strength, resource handicaps, mortality on/off).
- **Tuning the smart fast-forward.** Exactly which conditions force a stop, and
  whether the player can set their own interrupt rules.

These don't block engine work — the next concrete step is **M0**.
