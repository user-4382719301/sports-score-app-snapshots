import type { ChemistryBonus, Player, RelayLeg } from '@/types';

/**
 * Connection bonuses shown in the builder and folded into the reward
 * multiplier. Deliberately tiny and legible — two rules only.
 */
export function computeChemistry(
  legs: Pick<RelayLeg, 'playerId'>[],
  playersById: Record<string, Player>,
): ChemistryBonus[] {
  const bonuses: ChemistryBonus[] = [];

  for (let i = 0; i < legs.length - 1; i += 1) {
    const current = playersById[legs[i]?.playerId ?? ''];
    const next = playersById[legs[i + 1]?.playerId ?? ''];
    if (current && next && current.teamId === next.teamId) {
      bonuses.push({
        id: `teammates_${i}`,
        label: `Teammates linked (legs ${i + 1}–${i + 2})`,
        bonus: 0.05,
      });
    }
  }

  const sportCounts = new Map<string, number>();
  for (const leg of legs) {
    const player = playersById[leg.playerId];
    if (player) {
      sportCounts.set(player.sport, (sportCounts.get(player.sport) ?? 0) + 1);
    }
  }
  for (const [sport, count] of sportCounts) {
    if (count >= 3) {
      bonuses.push({
        id: `rhythm_${sport}`,
        label: `${sport.toUpperCase()} rhythm (${count} legs)`,
        bonus: 0.05,
      });
    }
  }

  return bonuses;
}
