import { makeRng, shuffled, type Rng } from './rng';
import { solve } from './solve';
import { isWon, type Colour, type LevelState, type Tube } from './tube';

/**
 * Generates a solvable PourSort level.
 *
 * Forwards — shuffle colours into tubes and hope — produces unsolvable layouts
 * often enough to matter, and an unsolvable level is unforgivable in a genre
 * with no fail state: the player cannot tell it apart from being stuck.
 *
 * So it works backwards from a finished board, moving single units between
 * tubes at random. Every state reached that way is reachable *from* the
 * solution, which makes it solvable by construction; the solver then only has
 * to confirm it and measure par.
 */

export interface GeneratedLevel {
  state: LevelState;
  /** Shortest solution length — what the star rating is scored against. */
  par: number;
}

/** The finished board: one full tube per colour, plus the empty spares. */
function solvedState(colours: number, capacity: number, spares: number): LevelState {
  const tubes: Tube[] = [];
  for (let colour = 0; colour < colours; colour += 1) {
    tubes.push(Array.from({ length: capacity }, () => colour as Colour));
  }
  for (let i = 0; i < spares; i += 1) tubes.push([]);
  return { tubes, capacity, moves: 0 };
}

/**
 * Scrambles by moving ONE unit at a time, which is not a legal pour.
 *
 * That is deliberate. Scrambling with legal reverse pours only ever reaches
 * positions a single pour away from being tidy, and the levels come out
 * trivial. Single-unit moves reach genuinely mixed boards, and solvability is
 * preserved because the solver is asked to confirm it afterwards.
 */
function scramble(state: LevelState, steps: number, rng: Rng): LevelState {
  const tubes = state.tubes.map((tube) => [...tube]);
  for (let step = 0; step < steps; step += 1) {
    const sources = shuffled(
      tubes.map((_, i) => i).filter((i) => tubes[i]!.length > 0),
      rng,
    );
    let moved = false;
    for (const from of sources) {
      const targets = shuffled(
        tubes.map((_, i) => i).filter((i) => i !== from && tubes[i]!.length < state.capacity),
        rng,
      );
      const to = targets[0];
      if (to === undefined) continue;
      tubes[to]!.push(tubes[from]!.pop()!);
      moved = true;
      break;
    }
    if (!moved) break;
  }
  return { ...state, tubes, moves: 0 };
}

export interface LevelShape {
  colours: number;
  capacity: number;
  /** Empty tubes. Two is the genre standard; one is much harder. */
  spares: number;
}

/**
 * Difficulty by level number: more colours, then fewer spare tubes.
 *
 * The curve is deliberately gentle for the first dozen — this genre's appeal is
 * that it never punishes, and a level 5 that needs real planning loses players
 * who came for something calm.
 */
export function shapeForLevel(level: number): LevelShape {
  const colours = Math.min(12, 3 + Math.floor(level / 6));
  const spares = level > 60 && level % 3 === 0 ? 1 : 2;
  return { colours, capacity: 4, spares };
}

export function generateLevel(level: number, seed: number): GeneratedLevel {
  const shape = shapeForLevel(level);
  const rng = makeRng(seed);
  const target = solvedState(shape.colours, shape.capacity, shape.spares);

  // More scrambling for later levels, but bounded: past a point extra steps stop
  // adding difficulty and only cost generation time.
  const steps = Math.min(90, 12 + level * 2);

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = scramble(target, steps, rng);
    // A scramble that happens to land back on a finished board is not a level.
    if (isWon(candidate)) continue;

    const solution = solve(candidate);
    if (!solution) continue;
    // A level solvable in one or two pours is not worth a screen.
    if (solution.length < 3) continue;

    return { state: candidate, par: solution.length };
  }

  throw new Error(`PourSort: no solvable level ${level} for seed ${seed}`);
}
