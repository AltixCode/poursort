/** Free players may finish this many levels before the unlock is needed. */
export const FREE_LEVELS = 40;

/** Levels the app ships. */
export const TOTAL_LEVELS = 400;

/**
 * Stars for finishing a level in `moves` against `par`.
 *
 * Three for par (or better — the solver's par is the shortest solution, so
 * "better" should be impossible, but a rule that punishes an unexpected route
 * is worse than one that rewards it), two within a quarter over, one otherwise.
 * Finishing always earns at least one: this genre has no fail state, and a
 * zero-star result reads as a loss.
 */
export function starsFor(moves: number, par: number): 1 | 2 | 3 {
  if (moves <= par) return 3;
  if (moves <= Math.ceil(par * 1.25)) return 2;
  return 1;
}

export function isLevelUnlocked(level: number, highestCleared: number, isPremium: boolean): boolean {
  if (level < 1 || level > TOTAL_LEVELS) return false;
  // Never gate a level the player has already reached by playing.
  if (level <= highestCleared + 1 && level <= FREE_LEVELS) return true;
  return isPremium && level <= highestCleared + 1;
}

/**
 * Whether a level is closed because it has to be BOUGHT, rather than because
 * the player has not got there yet.
 *
 * The level select drew a padlock on both and sent both to the paywall, which
 * put a wall of padlocks directly beneath a card reading "The first 40 are
 * always free" and offered to sell level 2 -- a free level the player simply
 * had not reached. A padlock means "paid"; progression is not a padlock.
 */
export function isLevelBehindPurchase(level: number, isPremium: boolean): boolean {
  if (level < 1 || level > TOTAL_LEVELS) return false;
  return level > FREE_LEVELS && !isPremium;
}
