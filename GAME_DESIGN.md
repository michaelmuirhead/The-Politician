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

**Status:** Design draft v0.5
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
  stats: CandidateStats;       // 8 stats, §4.1
  experience: number;          // derived from offices/terms; discounts staff, gates eligibility
  traits: TraitId[];           // background + acquired, §4.1
  positions: Record<IssueId, number>;
  reputation: Reputation;      // see below
  history: OfficeRecord[];     // every office sought/held + what you did with it
  relationships: Record<ActorId, number>; // donors, factions, party bosses, rivals, press
  warChest: number;            // 💰 Money — ads, travel
  politicalCapital: number;    // 🏛️ Capital — endorsements, operatives, deal-making (§4.2)
  staff: OperativeId[];        // hired operatives/staff (cost scales per hire)
  endorsements: EndorsementId[];
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

### 4.1 Stats & Traits (informed by *The Political Machine*)

Stardock's *The Political Machine* rates candidates **1–10** on a point-buy set
of characteristics — *Stamina, Charisma, Money, Fundraising, Intelligence,
Appearance, Credibility, Experience, Media Bias, Minority Appeal, Religious
beliefs* — each tuned to its campaign loop (e.g. **Stamina = moves per turn**,
**Charisma = speech/ad effect**, **Intelligence = interview performance**,
**Experience = cheaper operatives**). We borrow the **clean 1–10 point-buy feel**
and several mechanics, but adapt for our key difference: TPM is a single
presidential *campaign*, while ours is a **career + governing + dynasty** game,
so **every stat must do work in *both* Campaign and Govern modes** and over a
lifetime.

**Stats (1–10, point-buy at creation; drift up with experience and down with age).**

| Stat | Campaign role | Govern role |
|---|---|---|
| **Charisma** | Speech/ad effectiveness, rally turnout (TPM: charisma) | Bully pulpit — rally public behind your agenda |
| **Intelligence** | Debates, interviews, rapid response (TPM: intelligence) | Policy quality — better effect per proposal; navigate committees |
| **Stamina** | **Action points per turn** (TPM: stamina) — the action economy | How much you can push each governing quarter; **declines with age/health** (§4 mortality) |
| **Fundraising** | Money from donors/fundraisers (TPM: fundraising) | Fund allies & re-election war chest |
| **Composure** | Resist gaffes; debate steadiness; scandal response | **Crisis handling** (§7.1 Handle Crisis) |
| **Integrity** | Credibility of promises; resistance to attacks (TPM: credibility) | Trust capital — but **high integrity makes dirty logrolling harder** (§7.7), a real trade-off |
| **Media Savvy** *(new)* | Earned media, press relations, ad amplification (TPM: media bias + appearance) | Frame your record; shape the news cycle |
| **Negotiation** *(new)* | Backroom party support; operative effectiveness | **Whipping votes & deal-making** (§7.6 passage math, §7.7 logrolling) — the "machine" stat, paired against Integrity |

This folds TPM's *Appearance/Media Bias* into **Media Savvy** and its
*Credibility* into **Integrity**, and adds **Negotiation** to power our
governing/legislative layer (which TPM lacks entirely).

**Experience is earned, not bought.** Where TPM makes Experience a point-buy
stat (cheaper operatives), our career *is* the experience: a derived value that
accumulates from offices held and terms served, discounting staff, unlocking
higher-tier eligibility (§8), and nudging baseline competence. Fits the
generational arc better than a static slider.

**What we deliberately *don't* copy: identity sliders.** TPM's **Minority Appeal**
and **Religious beliefs** are single-number appeal stats. We **reject** these as
raw sliders — both for tone (our "earnest, non-editorializing" decision) and
because we already model group appeal far more richly: `identityFit(group,
candidate)` (§5.2) derives appeal from the candidate's **background, traits, and
issue positions** interacting with each unit's **demographic mix**. A Black
Baptist former-prosecutor reformer reads differently to each group *organically*,
without a reductive "minority = 7" dial.

**Traits** (qualitative, stack on stats — our richer answer to TPM's mostly
stat-only candidates):

- **Background traits** (chosen at creation): `war_hero`, `business_mogul`,
  `academic`, `machine_boss`, `outsider`, `reformer`, `celebrity`, `prosecutor`,
  `union_organizer`, `clergy`… — each grants stat modifiers, demographic
  affinities, and sometimes a unique action.
- **Acquired traits** (earned over a career): `scandal_tainted`, `kingmaker`,
  `fiscal_hawk`, `war_president`, `do_nothing`… — emerge from your record and
  feed reputation, the AI's read of you (§10), and event eligibility.

### 4.2 Borrowed campaign economy (validated by TPM)

TPM's resource layer maps almost 1:1 onto what we'd sketched — we adopt it
explicitly:

- **Political Capital (🏛️)** as a currency **distinct from Money (💰)** — TPM's
  PC vs. campaign funds split. Money buys ads/travel; Capital buys endorsements,
  operatives, and (in Govern mode) greases deal-making and agenda-pushing.
  Generated by office, approval, and relationships.
- **Operatives / campaign staff** — hireable assets whose **cost scales with each
  hire** and is **discounted by Experience** (TPM exactly): e.g. fundraiser,
  pollster, field organizer, spin doctor (boost issue rating), fixer (remove a
  rival operative), smear merchant (cut opponent). A few hinder opponents; most
  buff you.
- **Endorsements** — interest groups, unions, papers, and party bosses endorse
  you for **immediate, deliberate** (non-random) bonuses, bought with Capital +
  relationship standing.

(*The War Room "operative card market" from recent TPM editions is noted as
optional flavor, not core.*)

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

### 5.5 Political leanings & drift (historically seeded)

Every place — **state, city, county/parish/borough, ward** — starts from a
**`baselineLean`** reflecting *current real-world political reality*, seeded from
recent election data (a Cook-PVI-style partisan index plus demographic mix).
Mississippi starts red, Massachusetts blue, a rural parish deep red inside a
purple state, a downtown ward blue inside a red city. The baseline is **data,
seeded once** from history; the game does not pretend a place is a blank slate.

Two values are tracked per unit:

| Field | Meaning |
|---|---|
| `baselineLean` | Immutable historical anchor (the real-world starting reality). |
| `currentLean` | The live lean, which **drifts** away from baseline over time. |

```
nextLean = currentLean
         + driftFromGovernance   // sustained successful/failed records (recordEffect, §5.2)
         + driftFromDemographics // slow population/economic change in the world model
         + driftFromNationalMood // tides from the tier above (nested world)
         − meanReversion × (currentLean − baselineLean)   // inertia pulls back home
```

- **Inertia is real.** `meanReversion` makes leanings *sticky*: a single good
  term won't flip a deep-red county. Lasting realignment takes **sustained**
  governing success (or demographic change) over many terms — so flipping a
  place is a genuine, hard-won achievement, and neglect lets it snap back.
- **You can move it, slowly.** A wildly successful, popular run visibly shifts
  `currentLean` in your favor and can *re-anchor* a place over a long enough
  career/dynasty; this is a core long-game reward and a lever for the climb.
- **Nesting.** Leanings roll up: a county's lean aggregates its wards; a state's
  aggregates its counties; national mood feeds back down as a tide. Consistent
  with §7.2's nested world.

This makes the map feel like the real country at the start, while still letting a
great (or catastrophic) career rewrite the political geography over generations.

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

The specific bills/proposals each seat may bring under these powers are
enumerated in the **Proposal & Bill Catalog (§7.5)**, gated by tier and domain.

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

### 7.4 Authority & Jurisdiction (gate-keeping)

An "earnest civics sim" is only credible if officials can do **exactly** what
their seat empowers them to do — no more, no less. A city council member cannot
embargo a foreign nation; a U.S. Senator cannot set a city's property-tax rate.
This is enforced as a **hard engine invariant**, not a UI nicety, along two
independent axes:

**1. Power authority (what kind of action).** Every `Power` is authored at a
specific `tier` and **authority domain** (e.g. `local.zoning`, `local.tax`,
`state.budget`, `federal.foreign_policy`). An office grants only the powers that
real seat holds, so a power a seat lacks **isn't in its list at all**:

| Office | Has power | Lacks power |
|---|---|---|
| City Council member | local ordinances, district zoning votes | city-wide budget veto, any state/federal power |
| Mayor | city budget, appointments, development | state law, foreign policy |
| Governor | state budget, statewide programs, National Guard | city tax rates, federal legislation |
| U.S. Representative | federal legislation (vote), district casework | enacting *any* city/state ordinance |
| President | executive actions, foreign policy, federal appointments | passing laws alone, setting local taxes |

**2. Jurisdiction scope (over which place).** A power affects **only the
jurisdiction node the office governs** within the nested world — never a sibling
or unrelated one. The Mayor of City A cannot tax City B; a Governor acts on
*their* state, not a neighbor's. Federal seats act on their district/state for
casework and on the nation for national powers.

**Enforcement — the gate.** The pure reducer (§11) validates every governing
command before applying it; a command is rejected unless **all** hold:

1. the acting character actually **holds** the office (seated, alive, in term);
2. the invoked power is in that **office's `powers`** list (authority domain);
3. the command's **target jurisdiction is within the office's authority** (its
   own node, or a descendant for powers explicitly marked as flowing downward).

Anything else is an **illegal command** and is refused — so neither the player's
UI, an event choice, nor the AI running other seats can ever exceed its mandate.
Shared powers (e.g. a legislature where many members vote) are modeled as
*participation in a collective decision*, not unilateral action: a single
representative's power is to **cast one vote / sponsor / filibuster**, while the
bill's passage is resolved at the body's level. This keeps separation of powers
and federalism honest at every tier.

### 7.5 Proposal & Bill Catalog (what can be brought, by tier)

The authority gate (§7.4) defines *who may act*; this catalog defines *what they
may bring for consideration*. Every entry is a gated **proposal** carrying a
`tier`, a `ProposalType` (the mechanism), and an `AuthorityDomain` (the subject
matter) — so a proposal can only be introduced by an office whose `powers`
include that domain, and only over the jurisdiction it governs. The lists below
are the **seed catalog**; it is data-driven and built to expand (see "Expansion"
at the end) without engine changes.

**Proposal *types* (the mechanism, shared across tiers):**

| Type | What it is | Typical mover → decider |
|---|---|---|
| **Ordinance / Statute / Act** | Binding law (city ordinance · state statute · federal act) | Legislator sponsors → legislative body votes → executive signs/vetoes |
| **Appropriation / Budget** | Spending & revenue allocation | Executive proposes → legislature amends/adopts |
| **Resolution** | Non-binding stance, procedural, or memorializing | Legislator → body votes |
| **Confirmation** | Approve an appointment (judge, cabinet, commissioner) | Executive nominates → upper body confirms |
| **Executive action** | Order/directive within delegated authority | Executive acts unilaterally (subject to courts/override) |
| **Ballot measure** | Referendum/initiative put to voters | Body refers *or* citizens petition → electorate decides |
| **Amendment** | Charter / state-constitution / U.S. Constitution change | Supermajority and/or voter approval |
| **Treaty / Compact** | Treaty (federal) · interstate compact (state) | Executive negotiates → upper body ratifies |

**City / municipal tier** — domains under `local.*`:

| Domain | Example proposals |
|---|---|
| `local.zoning` | Rezoning, variances, density/upzoning, comprehensive plan, historic districts |
| `local.tax` | Property-tax rate (within state caps), local sales/lodging surcharges, permit & license fees |
| `local.budget` | Annual city budget, capital improvement plan, municipal bond issuance (often → ballot) |
| `local.development` | Approve projects, TIF districts, redevelopment, affordable-housing requirements |
| `local.public_safety` | Policing policy, noise/curfew/nuisance ordinances, fire code |
| `local.services` | Sanitation, parks & rec, libraries, water/sewer utility rules |
| `local.transit` | Local roads, parking, bus/streetcar service, bike infrastructure |
| `local.governance` | Charter amendments, ward redistricting, ethics/lobbying rules |

**State tier** — domains under `state.*`:

| Domain | Example proposals |
|---|---|
| `state.budget` | Biennial/annual budget, appropriations, state bonds |
| `state.tax` | Income/sales/excise/corporate tax rates and credits |
| `state.education` | K-12 funding & standards, university system, school choice |
| `state.health` | Medicaid policy, public health, licensing of providers |
| `state.justice` | Penal code, sentencing, state police, corrections, courts |
| `state.transportation` | Highways, DOT programs, statewide transit |
| `state.labor` | State minimum wage, workplace & licensing rules |
| `state.environment` | State lands, water rights, emissions, energy policy |
| `state.commerce` | Business regulation, professional licensing, alcohol/gaming |
| `state.elections` | Election law, congressional & legislative redistricting |
| `state.local_authority` | Grant/preempt municipal powers (home-rule scope) |
| `state.constitution` | Refer state-constitutional amendments to voters |

**Federal tier** — domains under `federal.*`:

| Domain | Example proposals |
|---|---|
| `federal.budget` | Federal budget, appropriations bills, debt-ceiling |
| `federal.tax` | Income/corporate tax, tariffs |
| `federal.foreign_policy` | Treaties, sanctions/**embargoes**, diplomatic recognition |
| `federal.defense` | Defense authorization, war powers, armed-forces policy |
| `federal.immigration` | Naturalization, visas, border policy |
| `federal.commerce` | Interstate & foreign commerce regulation, trade agreements |
| `federal.social_insurance` | Social Security, Medicare |
| `federal.civil_rights` | Federal civil-rights & voting law |
| `federal.judiciary` | Federal court structure; **confirmations** of judges/justices |
| `federal.executive` | Executive orders, cabinet/agency appointments & confirmations |
| `federal.environment` | National environmental & energy law, federal lands |
| `federal.constitution` | Propose U.S. constitutional amendments |

**Introduction rights & passage.** Who may *introduce* depends on the seat:
legislators **sponsor** ordinances/statutes/acts and **cast votes**; executives
(mayor/governor/president) **propose budgets**, **sign or veto**, issue
**executive actions**, and **nominate** for confirmation. Passage rules vary by
type — simple majority, supermajority (overrides, amendments), executive
signature, or voter approval (ballot measures) — and are resolved at the
*body's* level, never unilaterally for collective proposals (§7.4).

**Cross-tier preemption.** Lower tiers act only within authority the tier above
grants: a city ordinance that exceeds **state** home-rule authority, or a state
statute that conflicts with valid **federal** law, is flagged **preempted** and
fails — the same gate, applied upward. This is what stops the "council embargoes
a nation / Congress sets a city tax" class of moves at the *proposal* layer too,
not just the action layer.

**Expansion.** The catalog is intentionally a seed. New proposals are added as
data by naming a `(tier, type, domain)` triple and its effects; new domains
extend the `local.*` / `state.* `/ `federal.*` namespaces; whole new tiers
(e.g. county, school board, supranational) slot in by declaring their domain
namespace and offices. The engine, gate, and effect system stay unchanged.

### 7.6 Chambers, Committees & the Legislative Pipeline

How a proposal actually *becomes law* differs by tier. The structure is **data**
(a `LegislativeBody` with one or more `Chamber`s and `Committee`s), so the same
pipeline engine serves all three:

| Tier | Structure (real-world) |
|---|---|
| **City** | Usually **unicameral** council. Two common forms: **mayor-council** (strong mayor with a **veto**; council overrides, typically 2/3) and **council-manager** (ceremonial mayor, professional manager, often **no veto**). Larger councils have standing committees (finance, zoning, public safety). |
| **State** | **Bicameral** (House/Assembly + Senate) in 49 states; **Nebraska unicameral & nonpartisan**. Powerful standing committees + chairs; many governors have a **line-item veto** on appropriations. |
| **Federal** | **Bicameral**: House (435, by population) + Senate (100, 2/state). Deep committee/subcommittee system; House **Rules Committee** sets debate; Senate **filibuster/cloture (60)**. President: veto, **no line-item veto**, pocket veto. |

**The pipeline** (a proposal advances stage by stage; the player acts at the
stage their seat touches):

```
Introduce (sponsor)                  ← requires introduceRights (§7.5)
  → Committee referral (by domain)   ← routed to the committee owning that domain
  → Committee GATE (chair decision)  ← chair can schedule, table (let it die), or amend
  → Markup & committee vote          ← amend; must report out to advance
  → Floor scheduling                 ← (House Rules / Senate calendar / council agenda)
  → Floor vote (chamber 1)           ← passage math below
  → Second chamber (if bicameral)    ← repeat referral→committee→floor
  → Reconciliation (conference)      ← reconcile differing versions into one text
  → Executive action                 ← sign / veto / line-item veto (where allowed)
  → Override attempt (if vetoed)     ← supermajority math below
```

**Committee gatekeeping** is a first-class power. A **committee chair** (a seat
the player can hold or pursue) decides whether a referred proposal is scheduled,
amended, or **tabled to die** — the single most common way real bills fail
("died in committee"). This makes chairs and committee assignments valuable
career targets and gives minority players a real obstacle to route around
(discharge petitions, attaching as a rider — see §7.7).

**Passage math (floor vote).** For a chamber of `N` seats, count support as a
whip tally:

```
yes = Σ_members P(member votes yes)
P(yes | member) = base(partyLine, member.positions vs. proposal)   // ideology/party
               + influence(sponsor, leadership) − pressure(opposition)  // whipping
               + dealValue(member)                                  // §7.7 logrolling
passes(chamber) = yes ≥ threshold(passageRule, N)
```

- `threshold`: **majority** = ⌊N/2⌋+1; **supermajority** = ⌈k·N⌉ (e.g. 3/5, 2/3
  per rule); **cloture** (federal Senate) = 60 to end debate *before* a majority
  final vote — a distinct hurdle the minority can sustain (filibuster).
- Bicameral proposals must pass **both** chambers; conference reconciles text,
  then both chambers approve the conference report.

**Executive veto-override math.** If the executive vetoes:

```
overridden = passes(chamber, supermajority) in ALL chambers
overrideThreshold default = ⌈2/3 · N⌉ per chamber   // configurable per jurisdiction
```

- **Line-item veto** (many governors; **not** the U.S. President): the executive
  may strike *individual items* (esp. appropriations / riders) rather than the
  whole bill — each struck item is independently subject to override. This is the
  key counter to rider-stuffing (§7.7).
- **Pocket veto**: if unsigned when the session ends, the bill dies with no
  override available.

### 7.7 Omnibus Bills, Riders & Logrolling (state & federal)

**In real life.** An *omnibus* bill bundles many separate measures — often
must-pass appropriations — into one large vehicle. Legislatures use them to move
a crowded agenda in one vote, to avoid a government shutdown, and for
**logrolling**: attaching a member's pet provision (a **rider**) to a bill that
*will* pass, trading "your vote for my rider." Upsides: efficiency and getting
hard things over the line. Downsides: reduced transparency, hidden pork,
take-it-or-leave-it pressure, and less deliberation. Two real constraints shape
them: many **state constitutions impose single-subject / germaneness rules** that
*limit* omnibus bills, while the **federal** process is far more permissive — and
**line-item veto** (state governors) lets executives strike riders the federal
president cannot.

**In the game (state & federal only).** A player with the standing to do so
(leadership, a committee chair, or a budget sponsor) can **bundle** proposals
into an omnibus, and any member can try to **attach a rider** to a moving
vehicle. The fun lives in the trade-offs:

- **Anchor + ride-along.** Bundle weak-but-wanted provisions onto a popular or
  **must-pass anchor** (a budget). The anchor's momentum carries riders that
  would die on their own — and bypasses hostile **committee gatekeeping** (§7.6),
  since the rider rides the anchor's path.
- **Logrolling for votes.** Adding another faction's pet rider **buys their
  votes** — directly spending the Deal-making power and relationship capital
  (§7.1) to push `dealValue` in the passage math. A well-built coalition bill
  passes things none of its parts could alone.
- **The weight penalty.** Every rider shifts the bill's net support by its own
  popularity. Stuff in too much unpopular pork and the **whole vehicle sags** —
  opponents campaign on "what's hidden inside," and getting **caught logrolling**
  costs `integrity` (and can feed `notoriety`). Bigger bills also draw more
  amendments and scrutiny.
- **All-or-nothing risk.** One veto kills the entire bundle — *unless* a
  **line-item veto** (state) lets the governor surgically strike your riders
  while keeping the anchor. So at the state level, rider-stuffing is a live duel
  with the executive's scalpel; at the federal level there's no scalpel, making
  the omnibus a blunt, powerful, take-it-or-leave-it weapon.
- **Single-subject limits.** Each state carries a data flag for its
  single-subject/germaneness rule; where it's strict, off-topic riders are
  **ruled out of order** (a realism lever that varies the omnibus game
  state-to-state). Federal bodies default permissive.

This turns omnibus play into a genuine strategic mini-game — coalition-building,
risk-bundling, and a cat-and-mouse with the veto pen — that rewards mastery
without abstracting away the real civics.

### 7.8 The Executive — Appointments, Confirmations & Executive Action

The legislature (§7.6–7.7) is now well-specified; the executive and judiciary
are its **counterweights**. Executives (mayor / governor / president) act through
three distinct levers beyond the veto (§7.6):

**Appointments & confirmations.** The executive **nominates**; an upper body
**confirms** (the `confirmation` ProposalType, §7.5): U.S. Senate for federal
posts, the state senate for many state posts, council for some city posts. The
pipeline is: **nominate → committee hearing → confirmation vote** (subject to the
chamber's threshold; historically the filibuster applied to nominations until
"nuclear-option" carve-outs — modeled as a per-body data flag). Confirmed
appointees become **actors** who buff governing effectiveness (§7.1), staff
agencies, and — critically — **fill the courts** (§7.9). Appointments outlast the
term that made them, so they are a prime **dynasty-scale** lever.

**Executive action (and its limits).** An executive order/directive is **fast**:
it takes effect **without the legislature**. That speed is paid for with hard
limits, which are what keep it from trivializing the legislative game:

| Executive action | Legislation |
|---|---|
| Acts only **within delegated/existing authority** — cannot make new law, appropriate funds, or exceed statute/constitution | Can create new law & spending |
| Effects are **weaker / time-boxed** | Durable |
| **Rescindable by the next executive** in one stroke | Survives administrations |
| Must **cite an authority source**; high exposure to **legal challenge** (§7.9) | Harder to strike once passed |
| Can be **overridden by contrary legislation** or **defunded** by the legislature | — |

So the EO is a **risk/reward** tool: move now and alone, but accept fragility,
reversal, and the courtroom. Other executive powers slot in by tier as data —
**pardons**, **calling special sessions**, **commander-in-chief / National Guard**
(governor/president), executive agreements.

### 7.9 The Judiciary — Courts as a Check

Courts are the **slow, persistent** counterweight and the enforcement mechanism
for preemption (§7.5) and constitutional limits. They exist per tier — municipal
/ state courts up to a **state supreme court**; federal **district → circuit →
Supreme Court** — each with a **composition** (judges carrying an ideological
lean) and a **selection method**: *appointed* (federal, lifetime tenure),
*elected* (many state benches), or *merit/retention*.

**Judicial review.** Any law (§7.5) or executive action (§7.8) can be **challenged**
by a party with standing — a rival officeholder, an interest group, or another
tier objecting to encroachment. The court rules on validity:

```
P(struck down) = f(
    aggressiveness,        // how far the law/EO stretches authority (preempted? novel?)
    courtLean − lawLean,   // ideological distance between the bench and the measure
    draftingQuality        // sponsor/executive Intelligence + legal staff (§4.1) → resilience
)
```

- A law flagged **preempted** (exceeds home-rule / conflicts with a higher tier,
  §7.5) faces a **high** strike probability — this is *how* preemption is
  enforced in play, not just declared.
- A struck measure is **voided** (its effects reversed), with reputation fallout
  for whoever overreached (and a `notoriety`/`integrity` swing either way,
  depending on the politics).
- **Drafting matters:** a smart, well-staffed sponsor writes laws that **survive**
  review — rewarding the Intelligence stat and legal appointees.

**Shaping the bench.** Because judges are appointed/elected and **outlast**
administrations, building a favorable judiciary is a deliberate **multi-term /
dynasty** project: stack the courts over a career and your aggressive agenda
survives; inherit a hostile bench and even moderate laws get struck. Courts are
where the legislative and executive branches' ambitions meet a hard, durable
limit.

### 7.10 Checks & balances (the loop)

The three branches now form a closed loop at **every tier**, with federalism
threaded through (§7.5):

- **Legislature** passes law, controls the purse, **confirms** appointees, can
  **override** vetoes, and can **impeach/remove** executives and judges
  (the legislature's check on the other branches — tied to scandal/`notoriety`).
- **Executive** **vetoes** law, **appoints** officials & judges, and acts via
  **executive order** within limits.
- **Judiciary** **strikes down** laws and orders that are preempted or exceed
  authority — and is itself shaped by appointment/election and bounded by
  amendment.

Whichever branch the player occupies, the others push back; climbing tiers means
inheriting — and contesting — counterweights you don't control. This is what
makes the "earnest civics sim" honest rather than a power fantasy.

### 7.11 Impeachment & Removal (the legislature's hardest check)

Beyond overriding vetoes and rejecting nominees, a legislature can **remove**
officials — the sharpest check, reserved for serious misconduct. The structure
mirrors reality per tier (all data):

- **Federal / state:** the **lower chamber impeaches** (articles, simple
  majority) and the **upper chamber tries and convicts** (typically **2/3**).
  Applies to executives, judges, and officers.
- **City:** impeachment is rarer; councils may **remove for cause**, and
  **recall** (§7.12) is the more common municipal removal route.

**Grounds** are misconduct — corruption, malfeasance, "high crimes" — so removal
risk is driven by **low `integrity`, scandal events, and high `notoriety`**. The
mechanic cuts both ways:

- **As a target.** An exposed player officeholder faces an impeachment push when
  the opposition holds the chamber; it plays as a high-stakes **crisis** —
  whip the trial vote, spend Political Capital and relationships, lean on
  `composure` — and **conviction ends the character's run** (another career-ender
  feeding succession, §4). Surviving a trial can even build defiant `notoriety`.
- **As a weapon.** The player can **initiate** impeachment against a rival
  officeholder — a real strategy with real blowback if it reads as partisan
  overreach (integrity/approval cost if it fails).

### 7.12 Direct Democracy — Initiative, Referendum & Recall (the people as a check)

Where the three branches gridlock or overreach, **the voters** are the
counterweight. Availability varies sharply by jurisdiction (only some states
have the initiative; recall and referendum rules differ; city charters vary), so
each carries data flags `hasInitiative / hasReferendum / hasRecall` and a
`signatureThreshold`.

- **Initiative** — citizens (or the player via a **petition drive**) put a law or
  measure directly on the ballot, **bypassing a hostile legislature or committee
  gate** (§7.6). Pipeline: gather signatures → ballot campaign → popular vote. A
  passed initiative becomes law without legislative consent.
- **Referendum** — voters **approve or reject** a measure: some referred by the
  legislature (bonds, constitutional amendments, §7.5), others a **veto
  referendum** to repeal a law already passed.
- **Recall** — a citizen petition forces a **special election to remove an
  officeholder** mid-term, driven by low approval/scandal. The cross-branch
  removal route (and, like impeachment, a career-ender feeding succession).

These reuse existing systems: the **`ballot_measure`** proposal type (§7.5), the
**Campaign Mode** loop (a signature drive and ballot campaign *are* campaigns,
§6), and **approval/reputation** (§4) as the engine of recalls. They make the
electorate a live fourth force: a player can **route around** a branch that
blocks them — or be **routed around** when they overreach.

Updating §7.10: the checks-and-balances loop is really **four** forces —
legislature, executive, judiciary, and **the people** (ballot & recall) — each
able to check the others at every tier where the jurisdiction's rules allow it.

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
- **Retire / age out / lose / die / be removed** — the character's run ends; a
  **post-career summary** scores the life (offices held, world impact, integrity,
  legacy). Removal via **impeachment-conviction or recall** (§7.11–7.12) is a
  disgraceful early ending that taints the lineage's `legacy`.
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

## 10. AI Politicians — Act, React & Proact

Because **the whole world simulates** and **AI runs every office the player
doesn't hold** (§0, §7.2), AI is not a single "opponent" — it is the entire
living political class: rivals, allies, party leaders, faction bosses, the
executive above you, committee chairs, judges, and challengers, across the full
nation. They are **first-class citizens of the same engine**: an AI politician is
just a `Character` (§4) whose moves are chosen by a policy over the **exact same**
command space the player uses — campaign actions (§6), governing powers and
proposals (§7), appointments, vetoes, legal challenges, ballot measures. Nothing
the AI does is special-cased; nothing bypasses the authority gate (§7.4).

### 10.1 Principles

- **Symmetry.** AI plays by the player's rules and tools — no hidden actions, no
  free resources (difficulty tunes *competence*, not *cheating*).
- **Explainability.** Like every poll movement (§5.4), an AI choice is traceable
  to its goals and the sim's expected outcome — surfaced as news/motive so the
  player can read the board.
- **Determinism.** AI decides via the **pure sim as lookahead** (seeded RNG), so
  games are reproducible and balance is testable headlessly.
- **Tiered fidelity (§10.6).** Full nation ⇒ deep AI only where it matters;
  everywhere else, cheap statistical behavior.

### 10.2 What drives an AI politician (motivation)

Each AI scores possible moves against a weighted **objective function**; the
weights come from its `Character` — `stats`, `traits`, `party`, `positions`, and
ambition — so a `firebrand reformer` and a `machine_boss` pursue the same office
very differently:

```
utility(AI) = w_survive  × reElectionOdds        // approval & support in own units (§5)
            + w_agenda   × policyProgress         // moving the world toward its positions
            + w_climb    × ambitionProgress       // name recognition, eligibility for next seat (§8)
            + w_party    × coalitionHealth         // standing with party/factions/donors
            + w_war       × resources              // money + political capital banked
            + w_ego      × notoriety               // firebrards value spotlight even when costly
```

`w_*` weights are derived from traits (a `wonk` over-weights `agenda`; an
`outsider` discounts `party`; the ambitious over-weight `climb`). This single
function powers act, react, and proact below.

### 10.3 ACT — autonomous, goal-seeking behavior

Every AP/turn an AI holds, it pursues its objective whether or not the player is
involved — the world moves on its own:

- **In Campaign Mode:** raise money, target persuadable/turnout units with the
  best expected-support-per-AP action (§6), stake positions, bank endorsements
  and operatives (§4.2), build field offices where the map is close.
- **In Govern Mode:** propose and shepherd legislation in its domains (§7.5),
  set budgets toward its priorities, make appointments, spend capital on
  deal-making — building a *record* that feeds its own re-election.
- **Greedy + budgeted:** enumerate legal commands → score each by sim lookahead →
  take the best until AP/capital runs out (shallow multi-step lookahead at higher
  difficulty, §10.8).

### 10.4 REACT — responding to the player & the world

AI continuously reads the board and answers moves:

- **To your campaign:** counter-ads and rapid response, GOTV where you surge,
  pivot spending to *its* most threatened units, exploit any unit you neglect.
- **To your legislation:** vote per the passage math (§7.6) by ideology +
  relationship + `dealValue`; an AI **committee chair may gatekeep it to death**;
  an AI **executive may veto**; an AI rival or another tier may bring a **legal
  challenge** (§7.9) against an aggressive/preempted law.
- **To scandal & weakness:** the opposition **pounces** — attack ads, a **recall
  or impeachment push** (§7.11–7.12) when your `integrity`/approval cracks; wary
  allies distance themselves.
- **To world events (§9):** a recession or disaster reshuffles everyone's
  priorities; incumbents (AI and player) get judged, challengers exploit it.
- **Reciprocity:** AI repays betrayal and loyalty (§10.7) — cross it and it whips
  against you next session; deal fairly and it becomes a reliable vote.

### 10.5 PROACT — anticipating and scheming ahead

The strongest AI doesn't just respond — it positions for a board that doesn't
exist yet:

- **Targets open/weak seats** before they're contested: recruits, fundraises
  early, and stakes ground for a future run.
- **Blocks your climb:** if it reads your ambition (your record + name
  recognition signal it), it backs a stronger rival against you, denies you
  committee assignments, or pushes a **redistricting** (§7.5 `*.elections`) that
  reshapes your base.
- **Banks for the long game:** war chests, endorsements, and especially the
  **courts** — appointing young judges whose lean outlasts administrations (§7.9)
  — and grooms its own **dynasty/successors** (§4).
- **Party leadership AI coordinates** across races it doesn't personally hold:
  recruits candidates, steers party money to competitive contests, enforces
  **whip discipline**, and punishes defectors — an above-the-board strategic actor
  the player must negotiate with to rise.

### 10.6 Scale — focus vs. ambient AI (full nation)

Running deep AI for every U.S. office every turn is neither affordable nor
necessary, so AI runs at **two fidelities**, with promotion between them:

| | **Focus AI** | **Ambient AI** |
|---|---|---|
| Who | Politicians in the player's orbit: same jurisdiction, the player's chamber, declared rivals, the executive above, relevant chairs/judges | Distant offices across the nation |
| How | Full per-turn objective-function decisions over the real command space | Cheap statistical resolution — elections via fundamentals + leaning (§5.5) + noise; governance via aggregate trends that still roll up the nested world (§7.2) |
| Promotion | — | A seat **promotes to Focus** when it enters the player's orbit (you climb toward it, or its holder targets you), so a distant rival becomes fully simulated exactly when it starts to matter |

This keeps the country alive and self-consistent while spending compute only
where the player can feel it.

### 10.7 Memory, relationships & grudges

AI is not goldfish-brained. Every interaction updates the `relationships` map and
`history` (§4): favors traded, betrayals, attacks, broken deals. Consequences
**persist across terms and tiers**, and a portion **passes to successors** via
`inheritedRelationships` (§4) — the rival you crushed as mayor remembers it when
you reach the statehouse, and so does their protégé. This makes reputation and
coalition-building a long-game, not a per-election reset.

### 10.8 Implementation & roadmap

Because the sim is **pure**, AI evaluates any move by calling it directly and
reading the projected state — no separate model to keep in sync.

1. **v1 (M1–M2) — Heuristic actor:** greedy objective-function scoring over legal
   commands via one-step sim lookahead; trait-weighted goals; covers campaign +
   the city legislative/exec/court loop. Ambient AI = statistical elections.
2. **v2 (M3–M4) — Personalities & scheming:** full proact (recruitment, climb-
   blocking, bench-stacking, party coordination), memory/grudges, focus↔ambient
   promotion across tiers.
3. **v3 (stretch) — Shallow lookahead** over pruned action sets for sharper play.

Political Intelligence (§10.9) ships alongside: estimates + confidence in v1, the
**deception slider** and **post-mortem reveal** with v2.

**Difficulty** scales AI **competence, not cheating**: lookahead depth, resource
efficiency, decision noise/error rate, and aggressiveness — wired to the
difficulty surface (§14). All AI decisions are unit-/golden-master-testable
because they are deterministic functions of state.

### 10.9 Political Intelligence — information as a resource

The player does **not** get a readout of AI objective functions. What rivals are
*really* after is **fog-of-war you pay to lift**, which turns "how much do I
spend to *see*" into a genuine strategic dilemma alongside ads and ground game.

**Tiers of knowledge:**

| Visibility | What it covers | How you get it |
|---|---|---|
| **Public (free)** | Votes, bills introduced, ads, endorsements, public positions, party, rough approval polls — the open record | Always available |
| **Inferred (tells)** | Ambition & intent leaking through behavior — a fundraising surge, tacking to the center, courting national donors | Read the board; sharper with `Intelligence`/`Media Savvy` |
| **Earned (bought)** | Confidence-rated estimates of a rival's **goals, threat level, likely next move, hidden scandals, true positions** | **Operatives** (pollster, oppo-research/fixer), **relationships** (allies leak), spent **Political Capital** (§4.2) |

- **Intel is a budget sink.** Information competes with campaigning for operatives
  and capital — investing in sight means investing less in reach.
- **The Political Intelligence layer.** A dashboard of rival profiles, each an
  explicit **best estimate with error bars**, never omniscient; `Intelligence`
  and `Media Savvy` shrink the error bars.
- **Fog scales with distance/tier**, dovetailing with focus vs. ambient AI
  (§10.6): city tier is retail and near-transparent (you know everyone); federal
  is vast and opaque, so the **intel infrastructure becomes essential as you
  climb** — a built-in difficulty ramp.

**Deception — an adjustable slider.** Whether AI actively misleads (feints —
signal one race, run in another; bluffs in negotiation) is a **player-set slider**
in the difficulty surface (§14), not a fixed rule:

```
Deception:  Off ──── Rare & tell-able (default) ──── Frequent & aggressive
            no active     occasional, good intel        misdirection as a
            misdirection  can sniff it out              core AI tactic
```

Higher settings add paranoia and replayability; lower settings keep play fair and
predictable. Even at higher settings, **better intel raises your odds of catching
a feint** — deception and information stay in tension, never a pure coin-flip.

**Reliable hindsight — the post-mortem.** Foresight is fuzzy, but **after** an
election or term a **post-mortem recap reveals what rivals were actually doing**
and why key events broke as they did. This is the explainability principle
(§10.1) made good: scheming never reads as random bad luck. The reveal is
**difficulty-gated** — full and pedagogical on easier settings, **partial**
(still your intel's best guess) on the hardest — so learning players get a clear
teacher while veterans keep the mystery.

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
│  │  │  ├─ proposals/       # bill/proposal catalog by tier & domain (§7.5), expandable
│  │  │  └─ scenarios/       # complete playable setups (entry office/tier)
│  │  ├─ sim/                # support, turnout, pressure decay, election tally
│  │  ├─ world/              # ONE persistent nested world model + record effects
│  │  ├─ actions/            # campaign actions + effect operators
│  │  ├─ powers/             # governing powers + effect operators
│  │  ├─ legislature/        # chambers, committees, pipeline, passage & veto-override math, omnibus
│  │  ├─ executive/          # appointments, confirmations, executive actions + limits
│  │  ├─ judiciary/          # courts, bench composition, judicial review & legal challenges
│  │  ├─ events/             # event pool + resolution (incl. health/mortality)
│  │  ├─ career/             # lifespan, aging/mortality, progression, eligibility, scoring
│  │  ├─ dynasty/            # lineage, succession, heir/protégé generation, legacy
│  │  ├─ persistence/        # save/load of the long-running world & lineage state
│  │  ├─ ai/                 # objective-function actor (act/react/proact); focus vs ambient fidelity
│  │  ├─ intel/              # fog-of-war estimates, confidence/error bars, deception, post-mortem
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
- **Authority is gated in the reducer (§7.4).** Every governing command is
  validated against the actor's seat, its `powers` list, and the target
  jurisdiction before applying. Illegal commands are refused for player *and* AI
  alike — separation of powers and federalism are engine invariants, not UI
  conventions.

**Tech:** TypeScript (strict) · Node + Vite · Vitest (unit + golden-master
balance snapshots) · CLI first · later React + SVG/Canvas map, deployed free to
GitHub Pages.

---

## 12. Data Schema (v2 starter)

```ts
type IssueId = string; type DemographicId = string;
type UnitId = string;  type PartyId = string;
type OfficeId = string; type TierId = "city" | "state" | "federal";
type TraitId = string; type OperativeId = string; type EndorsementId = string;

interface CandidateStats {              // each 1–10, point-buy at creation (§4.1)
  charisma: number; intelligence: number; stamina: number; fundraising: number;
  composure: number; integrity: number; mediaSavvy: number; negotiation: number;
}

interface Operative {                   // hireable staff; cost scales per hire, discounted by experience
  id: OperativeId; name: string;
  role: "fundraiser" | "pollster" | "field" | "spin_doctor" | "fixer" | "smear";
  baseCost: number;                     // in 🏛️ Political Capital
  effects: Effect[];
}

type DeceptionLevel = "off" | "rare" | "frequent";  // player-set slider (§10.9, §14)

interface IntelEstimate {               // the player's best guess about a rival (§10.9)
  subject: string;                      // CharacterId
  goals: Partial<Record<"survive"|"agenda"|"climb"|"party"|"war"|"ego", number>>;
  threatLevel: number;                  // 0 … 1
  likelyNextMove?: string;              // predicted command/intent
  knownScandals: string[];
  confidence: number;                   // 0 … 1; raised by Intelligence/MediaSavvy + operatives
}

interface Endorsement {                 // deliberate, non-random; bought with capital + standing
  id: EndorsementId; name: string;      // union, paper, interest group, party boss…
  cost: number;                         // 🏛️ Political Capital
  requires?: { relationship?: ActorId; minStanding?: number };
  effects: Effect[];
}

interface Issue { id: IssueId; name: string; tiers: TierId[]; }

interface Demographic {
  id: DemographicId; name: string;
  ideals: Record<IssueId, number>;     // −1 … +1
  salience: Record<IssueId, number>;   // 0 … 1, sum ≈ 1
  baseTurnout: number;                 // 0 … 1
}

type PlaceKind =
  | "ward" | "city" | "county" | "parish" | "borough"   // local naming varies by state
  | "district" | "state" | "nation";

interface Unit {                        // ward / county / parish / state, per tier
  id: UnitId; name: string; tier: TierId;
  kind: PlaceKind;                      // correct local name (parish in LA, borough in AK, …)
  parentId?: UnitId;                    // nesting: ward→city→county→state→nation
  seats: number;                        // prize: council seats / electoral votes / etc.
  baselineLean: number;                 // −1 … +1, historically seeded; immutable anchor (§5.5)
  currentLean: number;                  // −1 … +1, drifts from baseline over time
  mix: Record<DemographicId, number>;   // group shares, sum ≈ 1
}

type PowerId = string;

// Hierarchical authority domain, e.g. "local.zoning", "state.budget",
// "federal.foreign_policy". The prefix must match the office's tier.
type AuthorityDomain = string;

interface Power {
  id: PowerId; name: string;
  tier: TierId;                         // which tier of office may ever hold this
  domain: AuthorityDomain;              // the mandate this power falls under
  reach: "own" | "descendants";         // acts on the office's own node, or down the hierarchy
  collective?: boolean;                 // true = participation in a body's vote, not unilateral
  effects: Effect[];                    // routed through the shared effect system
}

type ProposalType =
  | "ordinance" | "statute" | "act"     // binding law (city / state / federal)
  | "appropriation"                     // budget / spending
  | "resolution"                        // non-binding / procedural
  | "confirmation"                      // approve an appointment
  | "executive_action"                  // order/directive within delegated authority
  | "ballot_measure"                    // referendum / initiative → voters
  | "amendment"                         // charter / state-const / U.S. Const
  | "treaty_or_compact";                // treaty (federal) / interstate compact (state)

type PassageRule =
  | "majority" | "supermajority"
  | "executive_signature"               // legislature passes, executive signs/vetoes
  | "voter_approval";                   // decided at the ballot

interface Proposal {                    // a catalog entry (§7.5); gated like Power
  id: string; title: string;
  tier: TierId;
  type: ProposalType;
  domain: AuthorityDomain;              // subject matter — must be in the mover's office.powers
  reach: "own" | "descendants";
  introduceRights: OfficeId[];          // which seats may sponsor/propose it
  bodyId: LegislativeBodyId;            // the body that processes it (chambers/committees)
  passage: PassageRule;
  effects: Effect[];                    // applied on passage, through the shared effect system

  // Omnibus / riders (§7.7) — state & federal only
  isOmnibus?: boolean;
  riders?: Proposal[];                  // attached measures bundled onto this vehicle
  mustPass?: boolean;                   // anchor status (e.g. a budget) that carries riders

  // Direct-democracy path (§7.12) — for type "ballot_measure"
  byPetition?: boolean;                 // citizen/player initiative, bypassing the legislature
}

type LegislativeBodyId = string; type ChamberId = string; type CommitteeId = string;

interface Committee {
  id: CommitteeId; name: string;
  domains: AuthorityDomain[];           // proposals in these domains are referred here
  chair?: OfficeId;                     // gatekeeper: can schedule / table-to-die / amend
}

interface Chamber {
  id: ChamberId; name: string;         // "City Council", "State Senate", "U.S. House"…
  seats: number;
  committees: Committee[];
  defaultThreshold: PassageRule;        // majority unless a proposal demands more
  cloture?: number;                     // e.g. 60 (federal Senate); enables filibuster
  rulesGatekeeper?: CommitteeId;        // floor-scheduling control (e.g. House Rules)
}

interface LegislativeBody {             // city council / state legislature / Congress
  id: LegislativeBodyId; name: string; tier: TierId;
  chambers: Chamber[];                  // 1 = unicameral (council, Nebraska); 2 = bicameral
  reconciliation: "conference" | "none";
  veto: VetoRule;
  singleSubjectRule?: boolean;          // limits omnibus/riders (many states); federal = false
  impeachment?: ImpeachmentRule;        // legislative removal power (§7.11)
}

interface ImpeachmentRule {             // §7.11
  impeachChamber: ChamberId;            // brings articles (default: lower, majority)
  tryChamber: ChamberId;                // tries & convicts
  convictThreshold: PassageRule;        // typically supermajority (2/3)
  applies: OfficeId[];                  // executives, judges, officers removable here
}

interface DirectDemocracyRule {         // §7.12, per jurisdiction (keyed by UnitId)
  hasInitiative: boolean;               // citizen-proposed law on the ballot
  hasReferendum: boolean;               // approve/reject or veto-repeal a law
  hasRecall: boolean;                   // petition → special election to remove an officeholder
  signatureThreshold: number;           // share of electorate to qualify a petition
}

interface VetoRule {
  executive: OfficeId;                  // mayor / governor / president
  hasVeto: boolean;                     // council-manager cities may be false
  lineItem: boolean;                    // governors often true; U.S. President false
  overrideThreshold: PassageRule;       // default supermajority (⌈2/3·N⌉) in all chambers
  pocketVeto: boolean;
}

// ---- Executive (§7.8) ----
type AppointmentStatus = "nominated" | "confirmed" | "rejected" | "withdrawn";

interface Appointment {
  id: string; office: OfficeId;          // the post being filled (incl. judgeships)
  nominee: string;                       // CharacterId
  confirmBody?: ChamberId;               // upper chamber that confirms (undefined = no confirmation)
  status: AppointmentStatus;
}

interface ExecutiveAction {              // executive order / directive
  id: string; title: string;
  tier: TierId; domain: AuthorityDomain; // gated like any power (§7.4)
  authoritySource: string;               // statute/constitution it relies on (must exist)
  reversible: true;                      // a successor executive can rescind
  durable: false;                        // time-boxed / weaker than legislation
  effects: Effect[];
}

// ---- Judiciary (§7.9) ----
type CourtLevel = "trial" | "appellate" | "supreme";
type SelectionMethod = "appointed" | "elected" | "merit";

interface Judge { id: string; name: string; lean: number; /* −1…+1 */ lifetime: boolean; }

interface Court {
  id: string; name: string; tier: TierId; level: CourtLevel;
  selection: SelectionMethod;
  bench: Judge[];                        // composition → aggregate courtLean
}

interface LegalChallenge {
  id: string;
  target: { kind: "law" | "executive_action"; id: string };
  challenger: ActorId;                   // rival office / interest group / other tier
  court: string;                         // CourtId
  outcome?: "upheld" | "struck_down";
}

interface Office {
  id: OfficeId; name: string; tier: TierId;
  jurisdictionId: UnitId;               // the node in the nested world this seat governs
  termLength: number;                   // turns/years
  termLimit?: number;
  powers: PowerId[];                    // the ONLY powers this seat may invoke (authority gate)
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
  bodies: LegislativeBody[];            // chambers/committees/veto rules per jurisdiction
  courts: Court[];                      // the judiciary per tier (§7.9)
  directDemocracy: Record<UnitId, DirectDemocracyRule>; // initiative/referendum/recall per place (§7.12)
  proposals: Proposal[];               // the catalog (§7.5) available in this world
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
- [x] Scaffold `core` (TS strict, Vitest), seeded RNG.
- [~] Data models + national data ingestion: nested US states/cities/districts,
      **historically-seeded `baselineLean`** per place (state/city/county/parish),
      issue & demographic schema (coarse first pass). *(models done; one nested
      city/state/nation slice seeded — full national ingestion still pending.)*
- [x] A focused **playable slice**: one real city wired for full play (Burlington,
      VT — ward ⊂ city ⊂ state ⊂ nation); rest of the nation coarse.
- [x] Support + turnout simulation; seat tally.
- [x] **Authority gate** in the reducer (§7.4): power-domain + jurisdiction
      validation on every governing command.
- [x] Unit tests: monotonicity, determinism, and **illegal-command refusal**
      (e.g. a council member attempting a federal/foreign power, or acting on a
      jurisdiction they don't govern, is rejected). *(17 tests passing.)*

### M1 — City vertical slice: campaign + govern (CLI) ✓
- [x] Nested state machine: Term → Campaign (weekly) → Govern (quarterly) → end-of-term.
- [x] **Character creation**: 8-stat 1–10 point-buy + background trait (§4.1).
- [x] Campaign Mode loop + first actions (Rally, Ads, Fundraiser, Retail, Position, Attack).
- [x] Govern Mode loop + first powers (Budget, Zoning, Tax).
- [x] Living **city** world model + `recordEffect` feedback into the sim.
- [x] CLI: win a mayoral race, then govern a term, in the terminal
      (`politician --demo` for an auto-playthrough). *(39 core tests passing.)*

### M2 — Make the city a full game (in progress)
- [x] **Heuristic opponent AI** (§10): trait-weighted objective function, greedy
      action selection via one-step sim lookahead; beats idle play, drives all
      CLI opponents.
- [x] Event/news system + starter pool (campaign + governing events), earnest tone.
- [x] City growth/decay + **leaning drift** (`currentLean` vs `baselineLean`,
      §5.5) across multiple terms; record-based re-election advantage.
- [x] Golden-master / determinism regression test for the AI race.
- [ ] **Council legislative pipeline**: committee referral & chair gatekeeping,
      floor vote (passage math), mayor veto + 2/3 override. *(deferred → M2b)*
- [ ] **Executive & courts (city)**: mayoral appointments, executive directives
      with limits, municipal court striking preempted ordinances (§7.8–7.9).
      *(deferred → M2b)*
- [ ] **Operative/staff + endorsement economy** on Political Capital (§4.2).
      *(deferred → M2b)*
- [ ] **Political Intelligence v1** (§10.9): bought oppo-research estimates with
      confidence bars. *(deferred → M2b)*
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
      offices; levels influence each other; leaning drift rolls up tiers.
- [ ] **Bicameral pipeline**: two chambers + conference reconciliation, Senate
      **cloture/filibuster (60)**, governor **line-item veto**, override math;
      Nebraska unicameral special case.
- [ ] **Omnibus & riders** (§7.7): bundling, logrolling for votes, the weight
      penalty, single-subject limits per state, line-item-veto duel.
- [ ] **Full executive & judiciary** (§7.8–7.10): Senate confirmations
      (nuclear-option flag), state/federal court hierarchies, judicial review at
      scale, bench-stacking as a dynasty lever.
- [ ] **Removal & direct democracy** (§7.11–7.12): impeachment/conviction,
      recall, and initiative/referendum petition→ballot campaigns, per
      jurisdiction rules — removal as a career-ender feeding succession.
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
- **Difficulty surface.** What the difficulty toggles expose: AI competence
  (lookahead/efficiency/error), resource handicaps, mortality on/off
  ("no permadeath"), the **AI deception slider** (off / rare / frequent, §10.9),
  and **post-mortem reveal depth** (full on easy → partial on hard).
- **Tuning the smart fast-forward.** Exactly which conditions force a stop, and
  whether the player can set their own interrupt rules.

These don't block engine work — the next concrete step is **M0**.
