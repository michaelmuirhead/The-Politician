# The Politician — Game Design Document

> A turn-based political campaign strategy game. Pick a candidate, work a
> calendar of weeks until election day, spend limited resources across regions,
> stake out positions on issues that win some voters and alienate others, react
> to events, and beat your opponent to a majority of electoral votes.

**Status:** Design draft v0.1
**Genre:** Turn-based strategy / political management sim
**Inspirations:** _The Political Machine_ (core loop), _The Campaign Trail /
President Infinity_ (electoral layer), _Democracy_ (simulation engine),
plus narrative event systems from other political games.

---

## 1. Design Pillars

1. **Every choice has a cost.** Pleasing one demographic angers another. There
   is no dominant strategy — only trade-offs.
2. **The map is the board.** Electoral votes, not raw popularity, win the game.
   Targeting the right regions matters more than running up the score.
3. **Systems over scripts.** Polling emerges from a transparent simulation of
   issues × demographics × regions, not from hand-authored outcomes. Players
   can reason about and exploit the model.
4. **Reactive drama.** Random events, scandals, and news cycles keep a
   well-laid plan under constant pressure.
5. **Readable depth.** Deep enough to reward mastery; legible enough that a
   new player understands *why* a number moved.

---

## 2. Core Loop

```
START CAMPAIGN
   │
   ▼
┌─────────────────────────────────────────────┐
│  WEEKLY TURN (repeat until election day)      │
│                                               │
│  1. News phase    → events / scandals fire    │
│  2. Planning      → spend resources on actions│
│  3. Resolution    → actions apply effects     │
│  4. Opponent turn → AI does the same          │
│  5. Polling       → simulation recomputes      │
│  6. Report        → weekly polling + cash report│
└─────────────────────────────────────────────┘
   │
   ▼
ELECTION DAY → tally electoral votes → WIN / LOSE
```

A campaign is a fixed number of weekly turns (default **20 weeks**). Each turn
the player has a budget of **resources** (below) to spend on **actions** across
**regions**. The opponent AI runs the same loop. Between turns the simulation
recomputes regional support.

---

## 3. Resources

Resources are the scarcity that forces trade-offs. Each turn:

| Resource | Symbol | Source | Spent on |
|---|---|---|---|
| **Action Points (Stamina)** | ⚡ | Fixed per turn, modified by candidate `stamina` stat | Every action costs AP — the core constraint |
| **Money** | 💰 | Fundraising actions, starting war chest, donor events | Ads, staff, travel, GOTV |
| **Political Capital** | 🏛️ | Earned by wins/endorsements, spent on risky plays | Flip-flopping on issues, attack ads, calling in favors |
| **Time** | 🗓️ | The turn counter itself (20 weeks) | The meta-resource: weeks are finite |

Unspent money carries over between turns; AP and (most) political capital do not.

---

## 4. The Simulation Model (the "Democracy" layer)

This is the heart of the game and the first thing to build/test. It is a
deterministic function recomputed each turn.

### 4.1 Entities

- **Issues** — e.g. `economy`, `healthcare`, `immigration`, `climate`,
  `taxes`, `security`. Each issue has a 1-D **position axis** (−1.0 … +1.0).
- **Demographic groups** — e.g. `working_class`, `suburban`, `seniors`,
  `young`, `urban`, `rural`, `business`. Each group has:
  - a **size** (share of the electorate, varies by region),
  - an **ideal position** per issue (−1.0 … +1.0),
  - an **issue salience** weighting (how much each issue matters to them),
  - a baseline **turnout propensity**.
- **Regions** — the electoral units (US states by default). Each region has:
  - **electoral votes** (the prize),
  - a **demographic mix** (group → share),
  - a **base partisan lean** (home-field advantage),
  - current **support split** (candidate A % / B % / undecided %).
- **Candidates** — see §6. Each holds a **position** per issue and a set of
  **stats/traits**.

### 4.2 How support is computed

For a given region, candidate support is the sum over demographic groups of
each group's size × that group's affinity for the candidate.

**Group affinity** for a candidate is driven by *issue distance*:

```
issueScore(group, candidate) =
    Σ_issues  salience[group][issue] × (1 − |candidatePos[issue] − groupIdeal[issue]| / 2)

affinity(group, candidate) =
    w_issues   × normalize(issueScore)
  + w_identity × identityFit(group, candidate)      // charisma, traits, demographics
  + w_lean     × partisanLean(group, region)
  + w_campaign × campaignPressure(group, region)    // accumulated ad/rally effects
  + noise()                                           // small per-turn variance
```

- `campaignPressure` is the accumulated, **decaying** effect of actions
  (ads, rallies, GOTV) targeted at a region/demographic. It decays each turn
  (`pressure *= decayFactor`, default `0.85`) so you must keep investing.
- Support is then **softmax-normalized** across candidates + an undecided pool.
- Region winner takes **all** its electoral votes (winner-take-all by default;
  proportional mode is a stretch goal).

### 4.3 Turnout

Final region result weights each group's support by its **effective turnout**:

```
turnout(group, region) = baseTurnout(group)
                       × (1 + gotvBoost(group, region))   // ground game
                       × enthusiasm(group, candidate)      // alignment + events
```

GOTV and enthusiasm let a candidate win a region by mobilizing their base even
without converting opponents — a distinct, viable strategy.

### 4.4 Why this design

- It is **pure and deterministic** (given a seed) → trivially unit-testable
  headlessly, and balanceable via simulation runs.
- Every poll movement is **explainable** (we can render the contribution of
  each term), satisfying the "readable depth" pillar.
- It is **data-driven** — all entities live in JSON/TS data files, so content
  (new issues, regions, scenarios) is added without touching engine code.

---

## 5. Actions (the "Political Machine" layer)

Actions are what the player spends resources on each turn. Each has an **AP
cost**, optional **money/capital cost**, a **target** (region / demographic /
issue / national), and **effects**.

| Action | Costs | Effect |
|---|---|---|
| **Hold Rally** | ⚡⚡ + 💰 | Big short-term `campaignPressure` spike in target region; boosts enthusiasm; small national bump |
| **Run TV Ads** | ⚡ + 💰💰 | Sustained pressure toward a region, optionally framed on an issue (positive or contrast) |
| **Attack Ad** | ⚡ + 💰💰 + 🏛️ | Lowers opponent support but risks backfire (capital cost; can trigger events) |
| **Fundraiser** | ⚡⚡ | Converts AP/time into 💰; scaled by `fundraising` stat |
| **Stake Issue Position** | ⚡ + 🏛️ if flip-flopping | Move your position on an issue; shifts affinity across all regions |
| **Debate Prep / Debate** | ⚡⚡ | Scheduled events; performance scales with `intelligence`/`composure` stats |
| **Build Field Office** | ⚡ + 💰 | Persistent GOTV bonus in a region for the rest of the campaign |
| **Seek Endorsement** | ⚡ + 🏛️ | Chance-based; grants pressure with aligned demographics + capital |
| **Whistle-stop Tour** | ⚡⚡⚡ | Hit several adjacent regions at lower per-region effect |
| **Rest / Recover** | — | Skip to bank stamina for next turn (raises next turn's AP cap) |

Actions are **data-driven** too: an action is a record describing costs,
targeting rules, and a list of effect operators the engine applies.

---

## 6. Candidates

```ts
interface Candidate {
  id: string;
  name: string;
  party: PartyId;
  stats: {
    charisma: number;     // identity affinity, rally/speech effectiveness
    intelligence: number; // debate performance, event resolution
    stamina: number;      // AP per turn
    fundraising: number;  // money per fundraiser
    composure: number;    // scandal/event resilience
    integrity: number;    // flip-flop penalty modifier, scandal likelihood
  };
  traits: TraitId[];      // e.g. "war_hero", "outsider", "wonk", "firebrand"
  positions: Record<IssueId, number>; // −1 … +1 per issue
  demographics: DemographicId[];       // candidate's own identity groups
}
```

Traits are modifiers that hook into the simulation (e.g. `outsider` boosts
affinity with anti-establishment groups but lowers it with `business`).

---

## 7. Events & News Cycle (the narrative layer)

Each turn's **news phase** may fire 0–N events from a weighted, condition-gated
pool. An event is data:

```ts
interface GameEvent {
  id: string;
  trigger: Condition;        // e.g. "behind in polls", "ran 3+ attack ads", random
  weight: number;
  headline: string;
  body: string;
  choices: EventChoice[];    // each choice: cost + effects + follow-on events
}
```

Examples: a gaffe caught on camera, an economic report, an opponent scandal you
can amplify (capital cost), a natural disaster demanding a response, a donor
ultimatum. Choices route back into the same effect system as actions, so the
narrative layer and the systems layer share one engine.

---

## 8. Opponent AI

Start simple, layer sophistication:

1. **v1 — Heuristic:** score each available action by expected EV-gain per AP
   (using the same simulation as a lookahead), pick greedily within budget.
   Targets the closest-margin regions worth the most EVs.
2. **v2 — Personalities:** AI candidates weight action types by their traits
   (a `firebrand` favors rallies/attack ads; a `wonk` favors issue framing).
3. **v3 (stretch) — Shallow lookahead:** 1–2 turn search over a pruned action
   set.

Because the simulation is pure, the AI can call it directly to evaluate moves.

---

## 9. Win Condition & Scoring

- **Win:** secure a majority of total electoral votes on election day
  (default board total 538 → 270 to win).
- **Tie/contingency** (stretch): below threshold → "contingent election"
  mini-resolution.
- **Score** for post-game: margin of victory, money efficiency, regions flipped,
  integrity maintained (didn't flip-flop) — feeds difficulty/achievements later.

---

## 10. Architecture

Separate **simulation** from **presentation** so the hard part is built and
proven before any UI work.

```
the-politician/
├─ packages/
│  ├─ core/                 # pure TypeScript, zero UI deps — THE ENGINE
│  │  ├─ models/            # Candidate, Region, Issue, Demographic, Action, Event
│  │  ├─ data/              # JSON/TS content: regions, issues, demographics, scenarios
│  │  ├─ sim/               # support model, turnout, pressure decay, election tally
│  │  ├─ actions/           # action definitions + effect operators
│  │  ├─ events/            # event pool + resolution
│  │  ├─ ai/                # opponent heuristics
│  │  ├─ engine.ts          # turn state machine; pure reducer: (state, command) → state
│  │  └─ rng.ts             # seeded RNG for determinism
│  ├─ cli/                  # terminal harness over core — first playable
│  └─ web/                  # (later) React + SVG electoral map over the same core
```

**Key principles**

- `core` is **deterministic** (seeded RNG) and **side-effect free** → unit tests
  + balance simulations run headlessly in this environment.
- Game state advances through a **pure reducer** `(state, command) → newState`,
  which both the CLI and web UIs dispatch into — UIs hold no game logic.
- All **content is data**, not code. New maps/issues/scenarios are JSON.

**Tech stack**

- **Language:** TypeScript (strict).
- **Runtime/build:** Node + a fast bundler (Vite for web).
- **Tests:** Vitest — unit tests for the sim + golden-master balance snapshots.
- **CLI:** Node + a light prompt/render lib (or plain readline to start).
- **Web (later):** React + SVG/Canvas electoral map; deploy free to GitHub Pages.

---

## 11. Data Schema (v1 starter)

```ts
type IssueId = string;
type DemographicId = string;
type RegionId = string;
type PartyId = string;

interface Issue   { id: IssueId; name: string; }
interface Demographic {
  id: DemographicId; name: string;
  ideals: Record<IssueId, number>;     // −1 … +1
  salience: Record<IssueId, number>;   // 0 … 1, weights, sum≈1
  baseTurnout: number;                 // 0 … 1
}
interface Region {
  id: RegionId; name: string;
  electoralVotes: number;
  partisanLean: number;                // −1 (party B) … +1 (party A)
  mix: Record<DemographicId, number>;  // group shares, sum≈1
}
interface Scenario {                   // a complete playable setup
  id: string; name: string;
  weeks: number;
  issues: Issue[];
  demographics: Demographic[];
  regions: Region[];
  candidates: Candidate[];
  startingMoney: number;
}
```

---

## 12. Milestone Roadmap

### M0 — Engine foundations (headless, testable here)
- [ ] Project scaffold (`core` package, TS strict, Vitest).
- [ ] Data models + a small **starter scenario** (≈8 regions, 6 issues, 5 demographics, 2 candidates).
- [ ] Seeded RNG.
- [ ] Support + turnout simulation; election tally.
- [ ] Unit tests proving monotonicity (moving toward a group's ideal raises its affinity, etc.).

### M1 — Playable core loop (CLI)
- [ ] Turn state machine / reducer + resource economy (AP, money, capital).
- [ ] First action set (Rally, Ads, Fundraiser, Stake Position, GOTV).
- [ ] CLI harness: play a full 20-week campaign in the terminal vs. a do-nothing opponent.
- [ ] Weekly polling report.

### M2 — Make it a game
- [ ] Heuristic opponent AI (v1).
- [ ] Event/news system + a starter event pool.
- [ ] Endorsements, debates, attack ads + backfire.
- [ ] Balance pass via batch simulations; golden-master tests.

### M3 — Web UI
- [ ] Vite + React app over the same `core`.
- [ ] Interactive SVG electoral map (support shading, EV count).
- [ ] Action/planning panel, weekly report, results screen.
- [ ] Deploy to GitHub Pages.

### M4 — Depth & content (stretch)
- [ ] More scenarios / full 50-state map.
- [ ] Candidate traits library; primaries phase.
- [ ] Proportional/contingent election modes.
- [ ] Difficulty levels (AI lookahead, resource handicaps).
- [ ] Save/load; post-game scoring & achievements.

---

## 13. Open Questions

- **Setting:** real US states + real parties, or a fictional country/parties to
  sidestep partisanship and licensing? (Recommend **fictional + data-swappable**,
  so a US map is just one scenario file.)
- **Number of candidates:** 1v1 to start; support 3+ later?
- **Match length:** 20 weeks default — tune for a ~20–30 min CLI session.
- **Tone:** earnest strategy vs. satirical? Affects event writing.
