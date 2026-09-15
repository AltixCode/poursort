import { useMemo } from 'react';

import { generateLevel, type GeneratedLevel } from '@/logic/generate';
import { seedFromKey } from '@/logic/rng';

/**
 * The level's board.
 *
 * Generation is deterministic from the level number, so every player gets the
 * same level 37 without any content being shipped or fetched. Memoised because
 * a later level costs real work and regenerating on each render would stutter.
 */
export function useLevel(level: number): GeneratedLevel {
  return useMemo(() => generateLevel(level, seedFromKey(`poursort:${level}`)), [level]);
}
