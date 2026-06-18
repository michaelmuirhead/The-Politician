# The Politician

A turn-based political **career & dynasty life-sim** set in a single,
persistent, real United States — across three nested tiers of government:
**city, state, and federal**. Create a character and live out their political
life: campaign to get elected, then govern and shape a living world.

Stay a beloved (or notorious) small-town mayor for your whole career, climb to
the statehouse and stop there, or claw your way from a city council seat all the
way to the top. How far you rise depends on how good — or how bad — you are.
Careers span decades and end in retirement or death; when one life ends, an
heir or protégé can carry the lineage on across generations.

Inspired by _The Political Machine_, _The Campaign Trail_ / _President
Infinity_, and _Democracy_, blended with life-sim career progression and
city-builder world dynamics.

## Two modes, three tiers, one engine

- **Campaign Mode** — get elected: rallies, ads, fundraising, retail politics,
  issue positioning, and ground game across constituency units.
- **Govern Mode** — once in office, wield your seat's powers over a budget and a
  living world (a city that grows or decays, an economy that shifts), building
  the record that defines your career.
- **Career & dynasty** — live many terms over a character's lifespan; re-run,
  climb a tier, or settle in for life. Characters age and can die, even in
  office; play continues through heirs and protégés across generations. Every
  tier is deep enough for a full game.

📄 **See [GAME_DESIGN.md](./GAME_DESIGN.md)** for the full design: the vision,
tiers, nested game loops, simulation model, campaign actions, governing powers,
the living world, career progression, architecture, data schema, and the
milestone roadmap.

## Status

Design phase. Implementation begins with a pure, headless TypeScript
simulation core (`packages/core`) driven first by a terminal harness
(`packages/cli`) — starting with the **city tier as a full vertical slice**
(campaign + govern) — with state/federal tiers and a web UI to follow.
