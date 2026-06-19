/**
 * Turnout (GAME_DESIGN.md §5.3).
 *
 * turnout(group, unit) = baseTurnout × (1 + gotvBoost) × enthusiasm
 *
 * For M0, gotvBoost = 0 (no ground game yet) and enthusiasm scales mildly with
 * how well the group's best option aligns — a placeholder hook for events/record.
 */
import type { Demographic } from "../models/types.js";

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

export function turnout(
  group: Demographic,
  opts: { gotvBoost?: number; enthusiasm?: number } = {},
): number {
  const gotvBoost = opts.gotvBoost ?? 0;
  const enthusiasm = opts.enthusiasm ?? 1;
  return clamp01(group.baseTurnout * (1 + gotvBoost) * enthusiasm);
}
