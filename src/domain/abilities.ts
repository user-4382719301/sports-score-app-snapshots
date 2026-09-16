import type { CardAbility, CardEvolutionPath } from '@/types';

/**
 * Signature abilities unlock through play (levels 3 / 8 / 14). The first
 * ability of each path is its "signature". Shield's revive is the only
 * ability with a live mechanical effect in V1 — the rest shape reward
 * bonuses that are computed in domain/rewards.
 */
export const ABILITIES: Record<CardEvolutionPath, CardAbility[]> = {
  spark: [
    { id: 'spark_1', name: 'Jump Start', description: 'This card thrives early — best value in slots 1 and 2.', unlockLevel: 3 },
    { id: 'spark_2', name: 'Ignition', description: 'Milestone XP from first-slot finishes is doubled.', unlockLevel: 8 },
    { id: 'spark_3', name: 'Wildfire', description: 'Perfect relays started by this card grant bonus coins.', unlockLevel: 14 },
  ],
  connector: [
    { id: 'connector_1', name: 'Hand-Off', description: 'Completing a leg eases the next objective by one.', unlockLevel: 3 },
    { id: 'connector_2', name: 'In Stride', description: 'Chemistry bonuses involving this card are stronger.', unlockLevel: 8 },
    { id: 'connector_3', name: 'Perfect Exchange', description: 'Baton passes from this card grant bonus XP.', unlockLevel: 14 },
  ],
  power: [
    { id: 'power_1', name: 'Heavy Lift', description: 'Carries a harder objective for +25% relay reward.', unlockLevel: 3 },
    { id: 'power_2', name: 'Momentum', description: 'Completed power legs grant extra card XP.', unlockLevel: 8 },
    { id: 'power_3', name: 'Unstoppable', description: 'Two power finishes in a row grant a coin bonus.', unlockLevel: 14 },
  ],
  shield: [
    { id: 'shield_1', name: 'Second Wind', description: 'Revives the first failed leg once per relay.', unlockLevel: 3 },
    { id: 'shield_2', name: 'Bulwark', description: 'Shield saves no longer reduce the perfect-relay bonus.', unlockLevel: 8 },
    { id: 'shield_3', name: 'Aegis', description: 'A save also refunds half the failed leg’s base reward.', unlockLevel: 14 },
  ],
  closer: [
    { id: 'closer_1', name: 'Anchor Leg', description: 'Best value in the final two slots (+10% reward).', unlockLevel: 3 },
    { id: 'closer_2', name: 'Ice Veins', description: 'Finishing the fifth leg grants bonus rating.', unlockLevel: 8 },
    { id: 'closer_3', name: 'Walk-Off', description: 'Relay-clinching finishes grant double milestone XP.', unlockLevel: 14 },
  ],
  wildcard: [
    { id: 'wildcard_1', name: 'All In', description: 'Takes a volatile objective for +40% relay reward.', unlockLevel: 3 },
    { id: 'wildcard_2', name: 'House Money', description: 'Failed wildcard legs refund a little card XP.', unlockLevel: 8 },
    { id: 'wildcard_3', name: 'Jackpot', description: 'Completed wildcard legs can drop cosmetic rewards.', unlockLevel: 14 },
  ],
};

export function abilitiesForPath(path: CardEvolutionPath): CardAbility[] {
  return ABILITIES[path];
}

export function signatureAbility(path: CardEvolutionPath): CardAbility {
  const ability = ABILITIES[path][0];
  if (!ability) {
    throw new Error(`Missing signature ability for path ${path}`);
  }
  return ability;
}
