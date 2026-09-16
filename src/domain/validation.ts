import type { Game, PlayerCard } from '@/types';
import { RELAY_SIZE } from './relayEngine';

export type SelectionIssueCode =
  | 'relay_full'
  | 'duplicate_player'
  | 'game_started'
  | 'game_finished'
  | 'no_game_today';

export interface SelectionCheck {
  ok: boolean;
  code?: SelectionIssueCode;
  message?: string;
}

const MESSAGES: Record<SelectionIssueCode, string> = {
  relay_full: 'Your relay already has five runners.',
  duplicate_player: 'That player is already in your relay.',
  game_started: 'This game is underway — players lock at first pitch, tip, puck drop, or kickoff.',
  game_finished: 'This game has ended, so the player is no longer eligible.',
  no_game_today: 'No game scheduled today for this player.',
};

function issue(code: SelectionIssueCode): SelectionCheck {
  return { ok: false, code, message: MESSAGES[code] };
}

/**
 * Gate for adding a card to the draft: no started games, no duplicates,
 * never more than five.
 */
export function canAddCard(
  draftCardIds: string[],
  card: PlayerCard,
  game: Game | undefined,
  now: Date = new Date(),
): SelectionCheck {
  if (draftCardIds.includes(card.id)) {
    return issue('duplicate_player');
  }
  if (draftCardIds.length >= RELAY_SIZE) {
    return issue('relay_full');
  }
  if (!game) {
    return issue('no_game_today');
  }
  if (game.status === 'final') {
    return issue('game_finished');
  }
  if (game.status === 'live' || new Date(game.startTime).getTime() <= now.getTime()) {
    return issue('game_started');
  }
  return { ok: true };
}

/** A card is selectable at all only when its game hasn't started. */
export function isCardEligible(game: Game | undefined, now: Date = new Date()): boolean {
  return (
    game !== undefined &&
    game.status === 'scheduled' &&
    new Date(game.startTime).getTime() > now.getTime()
  );
}

export interface DraftValidation {
  complete: boolean;
  messages: string[];
}

export function validateDraft(
  draftCardIds: string[],
  gamesByCardId: Record<string, Game | undefined>,
  now: Date = new Date(),
): DraftValidation {
  const messages: string[] = [];
  if (draftCardIds.length < RELAY_SIZE) {
    messages.push(`Add ${RELAY_SIZE - draftCardIds.length} more to fill your relay.`);
  }
  for (const cardId of draftCardIds) {
    const game = gamesByCardId[cardId];
    if (!isCardEligible(game, now)) {
      messages.push('A selected player’s game has started — replace them to save.');
      break;
    }
  }
  return { complete: draftCardIds.length === RELAY_SIZE && messages.length === 0, messages };
}
