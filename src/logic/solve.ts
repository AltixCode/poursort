import { isWon, legalMoves, pour, stateKey, type LevelState, type Move } from './tube';

/**
 * Breadth-first solver.
 *
 * Used twice: to prove a generated level is solvable at all, and to give the
 * player a hint that is a real next move rather than a guess. BFS rather than
 * depth-first because the shortest solution is also the level's par, and par is
 * what the star rating is scored against.
 *
 * States are keyed with tube order removed, so the frontier does not re-explore
 * the same position under a different arrangement — without that the search
 * blows up well before a 12-tube level.
 */

export interface Solution {
  moves: Move[];
  /** Shortest number of pours. This is the level's par. */
  length: number;
}

export function solve(start: LevelState, maxStates = 200_000): Solution | null {
  if (isWon(start)) return { moves: [], length: 0 };

  const seen = new Set<string>([stateKey(start)]);
  let frontier: { state: LevelState; moves: Move[] }[] = [{ state: start, moves: [] }];
  let explored = 0;

  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const node of frontier) {
      for (const move of legalMoves(node.state)) {
        const child = pour(node.state, move.from, move.to);
        const key = stateKey(child);
        if (seen.has(key)) continue;
        seen.add(key);
        explored += 1;

        const moves = [...node.moves, move];
        if (isWon(child)) return { moves, length: moves.length };
        // A bounded search: a generator that can hang is worse than one that
        // occasionally rejects a level and tries again.
        if (explored > maxStates) return null;
        next.push({ state: child, moves });
      }
    }
    frontier = next;
  }
  return null;
}

/** The first move of a shortest solution, or null when there is none. */
export function hintFor(state: LevelState): Move | null {
  return solve(state)?.moves[0] ?? null;
}

/** True when the level can still be finished from here. */
export function isSolvable(state: LevelState): boolean {
  return solve(state) !== null;
}
