import { generateLevel, shapeForLevel } from '../generate';
import { isSolvable, solve } from '../solve';
import { isWon } from '../tube';

describe('shapeForLevel', () => {
  it('starts gentle', () => {
    expect(shapeForLevel(1).colours).toBe(3);
    expect(shapeForLevel(1).spares).toBe(2);
  });

  it('adds colours as levels go on', () => {
    expect(shapeForLevel(60).colours).toBeGreaterThan(shapeForLevel(1).colours);
  });

  it('never exceeds twelve colours — more will not fit on a phone', () => {
    for (const level of [100, 200, 400, 1000]) {
      expect(shapeForLevel(level).colours).toBeLessThanOrEqual(12);
    }
  });

  it('keeps two spare tubes until deep into the game', () => {
    expect(shapeForLevel(30).spares).toBe(2);
  });
});

describe('generateLevel', () => {
  it('is deterministic for a seed', () => {
    expect(generateLevel(10, 4242)).toEqual(generateLevel(10, 4242));
  });

  it('gives different levels for different seeds', () => {
    expect(generateLevel(10, 1)).not.toEqual(generateLevel(10, 2));
  });

  it.each([1, 5, 12, 25, 40])('produces a solvable level %i', (level) => {
    // An unsolvable level is unforgivable in a genre with no fail state: the
    // player cannot tell it apart from being stuck.
    const { state } = generateLevel(level, level * 97 + 5);
    expect(isSolvable(state)).toBe(true);
  });

  it.each([1, 5, 12, 25, 40])('does not hand out an already-finished level %i', (level) => {
    const { state } = generateLevel(level, level * 31 + 7);
    expect(isWon(state)).toBe(false);
  });

  it('reports a par that the solver agrees with', () => {
    const { state, par } = generateLevel(15, 808);
    expect(solve(state)?.length).toBe(par);
    expect(par).toBeGreaterThanOrEqual(3);
  });

  it('conserves every unit of colour — a scramble must not lose one', () => {
    const { state } = generateLevel(20, 55);
    const counts = new Map<number, number>();
    state.tubes.flat().forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
    for (const [, n] of counts) expect(n).toBe(state.capacity);
  });

  it('holds up across many seeds', () => {
    for (let seed = 0; seed < 12; seed += 1) {
      const { state, par } = generateLevel(8, seed);
      expect(isSolvable(state)).toBe(true);
      expect(par).toBeGreaterThanOrEqual(3);
    }
  });
});
