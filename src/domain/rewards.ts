import type {
  ChemistryBonus,
  ObjectiveDifficulty,
  PlayerCard,
  Relay,
  RelayReward,
  RiskTier,
} from '@/types';

/** Base coins earned per completed leg, by objective difficulty. */
export const BASE_COINS: Record<ObjectiveDifficulty, number> = { 1: 40, 2: 70, 3: 110 };

/** Card XP granted to a card that completes its leg, by difficulty. */
export const LEG_CARD_XP: Record<ObjectiveDifficulty, number> = { 1: 30, 2: 50, 3: 80 };

/** Small consolation XP so failed legs still feel like part of the season. */
export const FAILED_LEG_CARD_XP = 10;

export interface PathBonus {
  id: string;
  label: string;
  bonus: number;
}

/**
 * Path-position bonuses. Spark wants the first two slots, Closer the last
 * two; Power and Wildcard are paid for carrying harder objectives.
 */
export function computePathBonuses(
  legs: Pick<Relay['legs'][number], 'cardId' | 'slot'>[],
  cardsById: Record<string, PlayerCard>,
): PathBonus[] {
  const bonuses: PathBonus[] = [];
  for (const leg of legs) {
    const card = cardsById[leg.cardId];
    if (!card) {
      continue;
    }
    switch (card.evolutionPath) {
      case 'spark':
        if (leg.slot <= 1) {
          bonuses.push({ id: `spark_${leg.slot}`, label: `Spark in slot ${leg.slot + 1}`, bonus: 0.1 });
        }
        break;
      case 'closer':
        if (leg.slot >= 3) {
          bonuses.push({ id: `closer_${leg.slot}`, label: `Closer in slot ${leg.slot + 1}`, bonus: 0.1 });
        }
        break;
      case 'power':
        bonuses.push({ id: `power_${leg.slot}`, label: 'Power objective', bonus: 0.25 });
        break;
      case 'wildcard':
        bonuses.push({ id: `wildcard_${leg.slot}`, label: 'Wildcard objective', bonus: 0.4 });
        break;
      default:
        break;
    }
  }
  return bonuses;
}

export function computeRewardMultiplier(
  pathBonuses: PathBonus[],
  chemistry: ChemistryBonus[],
): number {
  const total =
    1 +
    pathBonuses.reduce((sum, b) => sum + b.bonus, 0) +
    chemistry.reduce((sum, b) => sum + b.bonus, 0);
  return Math.round(total * 100) / 100;
}

export function computeRiskTier(
  difficulties: ObjectiveDifficulty[],
): RiskTier {
  if (difficulties.length === 0) {
    return 'low';
  }
  const avg = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;
  if (avg < 1.6) {
    return 'low';
  }
  if (avg < 2.3) {
    return 'medium';
  }
  return 'high';
}

/**
 * Final payout for a finished relay. Completing all five legs multiplies the
 * pot; a perfect run (no shield save) adds 25% on top. Kept deliberately
 * arithmetic-simple so the numbers on screen can be checked by hand.
 */
export function computeRelayReward(relay: Relay): RelayReward {
  const completedLegs = relay.legs.filter((leg) => leg.status === 'completed');
  const baseCoins = completedLegs.reduce(
    (sum, leg) => sum + BASE_COINS[leg.objective.difficulty],
    0,
  );
  const allFive = completedLegs.length === relay.legs.length && relay.legs.length > 0;
  const perfect = allFive && !relay.shieldUsed;

  let coins = baseCoins * relay.rewardMultiplier;
  if (allFive) {
    coins *= 1.5;
  }
  if (perfect) {
    coins *= 1.25;
  }
  coins = Math.round(coins);

  const cardXpPerLeg = 0; // per-leg XP is granted as legs resolve, not at payout
  const accountXp = Math.round(coins / 2);
  const ratingDelta = completedLegs.length * 8 + (allFive ? 25 : relay.status === 'failed' ? -15 : 0);

  return { coins, cardXpPerLeg, accountXp, ratingDelta };
}
