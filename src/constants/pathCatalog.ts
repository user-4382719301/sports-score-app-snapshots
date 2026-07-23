import type { CardEvolutionPath, CardStage } from '@/types';
import { colors } from '@/theme';

export interface PathInfo {
  id: CardEvolutionPath;
  name: string;
  /** One-line gameplay identity shown on cards and in the builder. */
  tagline: string;
  /** How the path bends relay rules — mirrored by domain/relayEngine. */
  ruleText: string;
  icon: string;
  color: string;
}

export const PATHS: Record<CardEvolutionPath, PathInfo> = {
  spark: {
    id: 'spark',
    name: 'Spark',
    tagline: 'Fast starter',
    ruleText: 'Earns a +10% reward bonus when placed in the first two slots.',
    icon: 'flash-outline',
    color: '#F2C14E',
  },
  connector: {
    id: 'connector',
    name: 'Connector',
    tagline: 'Lifts the next leg',
    ruleText: 'Adds a +10% reward bonus for the leg that follows it.',
    icon: 'git-merge-outline',
    color: '#38BDF8',
  },
  power: {
    id: 'power',
    name: 'Power',
    tagline: 'Harder objective, bigger payoff',
    ruleText: 'Takes a tougher objective worth +25% relay reward.',
    icon: 'barbell-outline',
    color: '#F87171',
  },
  shield: {
    id: 'shield',
    name: 'Shield',
    tagline: 'One save per relay',
    ruleText: 'Revives the first failed leg once per relay.',
    icon: 'shield-half-outline',
    color: '#34D399',
  },
  closer: {
    id: 'closer',
    name: 'Closer',
    tagline: 'Built for the anchor leg',
    ruleText: 'Earns a +10% reward bonus in the final two slots.',
    icon: 'flag-outline',
    color: '#A78BFA',
  },
  wildcard: {
    id: 'wildcard',
    name: 'Wildcard',
    tagline: 'High risk, high reward',
    ruleText: 'Takes a volatile objective worth +40% relay reward.',
    icon: 'shuffle-outline',
    color: '#FB923C',
  },
};

export interface StageInfo {
  id: CardStage;
  name: string;
  /** Card frame accent; legend-stage cards go gold. */
  color: string;
  minLevel: number;
}

export const STAGES: Record<CardStage, StageInfo> = {
  rookie: { id: 'rookie', name: 'Rookie', color: colors.textMuted, minLevel: 1 },
  pro: { id: 'pro', name: 'Pro', color: colors.live, minLevel: 4 },
  elite: { id: 'elite', name: 'Elite', color: colors.primaryBright, minLevel: 10 },
  legend: { id: 'legend', name: 'Legend', color: colors.gold, minLevel: 18 },
};

export const STAGE_ORDER: CardStage[] = ['rookie', 'pro', 'elite', 'legend'];
