/** Pure formatting helpers for the terminal harness. */
import type { CityWorldState, ElectionResult, Scenario, TermState } from "@the-politician/core";

const bar = (v: number, width = 12): string => {
  const filled = Math.round(Math.max(0, Math.min(1, v)) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
};

export function nameOf(scenario: Scenario, id: string): string {
  return scenario.candidates.find((c) => c.id === id)?.name ?? id;
}

export function renderWorld(w: CityWorldState): string {
  return [
    `  Economy        ${bar(w.economy)} ${(w.economy * 100).toFixed(0)}%`,
    `  Tax rate       ${bar(w.taxRate)} ${(w.taxRate * 100).toFixed(0)}%`,
    `  Safety         ${bar(w.services.safety)} ${(w.services.safety * 100).toFixed(0)}%`,
    `  Housing        ${bar(w.services.housing)} ${(w.services.housing * 100).toFixed(0)}%`,
    `  Infrastructure ${bar(w.services.infrastructure)} ${(w.services.infrastructure * 100).toFixed(0)}%`,
    `  Treasury       ${w.treasury >= 0 ? "+" : ""}${w.treasury.toFixed(0)}k`,
  ].join("\n");
}

export function renderElection(scenario: Scenario, result: ElectionResult): string {
  const total = Object.values(result.votesByCandidate).reduce((a, b) => a + b, 0) || 1;
  const rows = Object.entries(result.votesByCandidate)
    .sort((a, b) => b[1] - a[1])
    .map(([id, v]) => {
      const pct = (v / total) * 100;
      return `  ${nameOf(scenario, id).padEnd(14)} ${bar(v / total)} ${pct.toFixed(1)}%  (${result.seatsByCandidate[id] ?? 0} wards)`;
    });
  return rows.join("\n");
}

export function renderPressure(state: TermState, candidateId: string): string {
  return state.units
    .map((u) => {
      const p = state.campaign.pressure[candidateId]?.[u] ?? 0;
      return `    ${u.padEnd(7)} ${bar(p / (p + 1))} ${p.toFixed(1)}`;
    })
    .join("\n");
}

export const hr = "─".repeat(56);
