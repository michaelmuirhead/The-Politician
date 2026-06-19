# @the-politician/core

The deterministic, side-effect-free simulation engine (GAME_DESIGN.md §11).
Zero UI dependencies — every system here is unit-testable headlessly.

## Status: M0 + M1 complete

**M1 (city vertical slice)** adds, on top of M0:

- **Character creation** (`career/creation.ts`) — 8-stat 1–10 point-buy +
  background traits with stat modifiers (§4.1).
- **Campaign Mode** (`campaign/`) — weekly turns; Rally / Ads / Retail / Attack /
  Fundraiser / Stake-Position actions spend AP/Money/Capital and build per-unit
  campaign pressure that decays each week (§6).
- **City world model** (`world/`) — economy, taxes, services, treasury; power
  effects and a per-quarter tick, plus `recordEffect` feeding the support sim.
- **Term state machine** (`term.ts`) — Campaign → Election → Govern → End,
  composing the gate, world and sim. See `term.test.ts` for a full playthrough.

The terminal harness lives in `packages/cli`: `node dist/index.js --demo` for a
deterministic auto-playthrough, or no flag for interactive play.

## M0 foundations

The first milestone (GAME_DESIGN.md §13) is in place:

- **Seeded RNG** (`src/rng.ts`) — reproducible, deterministic streams.
- **Data models** (`src/models/`) — the M0 subset of the §12 schema.
- **Support + turnout + election tally** (`src/sim/`) — the shared engine (§5).
- **Authority gate** (`src/authority/`) — the §7.4 invariant, enforced in the
  pure reducer (`src/engine.ts`): a governing command is allowed only if the
  actor holds the office, the power is in that office's grant, and the target
  jurisdiction is within authority.
- **Playable slice** (`src/data/burlingtonVT.ts`) — Burlington, VT, nested
  ward ⊂ city ⊂ state ⊂ nation. Magnitudes are a coarse first pass pending the
  real national data pipeline.

## Commands

```bash
npm install              # from the repo root (workspaces)
npm test  --workspaces   # run all suites
npm run typecheck --workspaces
```

Or directly in this package: `npm test`, `npm run typecheck`, `npm run build`.

## Tests

- `sim/determinism.test.ts` — same seed ⇒ identical results; noise diverges
  across seeds; seats are conserved.
- `sim/monotonicity.test.ts` — aligning toward a group's ideal never lowers
  affinity/share; charisma is monotonic.
- `authority/gate.test.ts` — legal commands apply; illegal ones (cross-tier
  power, out-of-jurisdiction, ungranted power, non-officeholder, tier mismatch)
  are refused and leave state unchanged.
