/**
 * PourSort — the rules of pouring, as plain data.
 *
 * A tube is a stack of colours with the *bottom* at index 0, so the top — the
 * only part a pour can touch — is the last element. Capacity is uniform across
 * a level.
 *
 * Pure: no React, no React Native, no Expo.
 */

export type Colour = number;
/** Bottom-first. The last element is the top. */
export type Tube = Colour[];

export interface LevelState {
  tubes: Tube[];
  capacity: number;
  moves: number;
}

export interface Move {
  from: number;
  to: number;
}

export const topOf = (tube: Tube): Colour | undefined => tube[tube.length - 1];

/** How many of the top colour sit together at the top. */
export function runLength(tube: Tube): number {
  const top = topOf(tube);
  if (top === undefined) return 0;
  let n = 0;
  for (let i = tube.length - 1; i >= 0 && tube[i] === top; i -= 1) n += 1;
  return n;
}

/**
 * Whether a pour is legal.
 *
 * Pouring into a tube that already holds one colour and nothing else is
 * pointless but not illegal; pouring a tube onto itself, from an empty tube, or
 * onto a different colour is. A full destination blocks too — a pour that could
 * only move part of a run is disallowed rather than partially applied, because
 * a partial pour makes the move count meaningless and the undo confusing.
 */
export function canPour(state: LevelState, from: number, to: number): boolean {
  if (from === to) return false;
  const source = state.tubes[from];
  const target = state.tubes[to];
  if (!source || !target) return false;
  if (source.length === 0) return false;
  if (target.length >= state.capacity) return false;

  const colour = topOf(source);
  const destination = topOf(target);
  if (destination !== undefined && destination !== colour) return false;

  // The whole run must fit, or the move is not offered.
  return runLength(source) <= state.capacity - target.length;
}

/** Applies a pour, returning a new state. Callers must check `canPour` first. */
export function pour(state: LevelState, from: number, to: number): LevelState {
  if (!canPour(state, from, to)) return state;
  const tubes = state.tubes.map((tube) => [...tube]);
  const source = tubes[from]!;
  const target = tubes[to]!;
  const count = runLength(source);
  for (let i = 0; i < count; i += 1) target.push(source.pop()!);
  return { ...state, tubes, moves: state.moves + 1 };
}

/** Every legal pour from the current state. */
export function legalMoves(state: LevelState): Move[] {
  const moves: Move[] = [];
  for (let from = 0; from < state.tubes.length; from += 1) {
    for (let to = 0; to < state.tubes.length; to += 1) {
      if (canPour(state, from, to)) moves.push({ from, to });
    }
  }
  return moves;
}

/** A tube is done when it is empty, or full and all one colour. */
export function tubeComplete(tube: Tube, capacity: number): boolean {
  if (tube.length === 0) return true;
  if (tube.length !== capacity) return false;
  return tube.every((colour) => colour === tube[0]);
}

export function isWon(state: LevelState): boolean {
  return state.tubes.every((tube) => tubeComplete(tube, state.capacity));
}

/** A canonical key for a state, so a search can recognise a repeat. */
export function stateKey(state: LevelState): string {
  // Tube order carries no meaning — two states differing only by which tube
  // holds which stack are the same position, and a solver that treats them as
  // different explores the same subtree many times over.
  return state.tubes
    .map((tube) => tube.join(','))
    .sort()
    .join('|');
}
