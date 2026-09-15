import {
  canPour,
  isWon,
  legalMoves,
  pour,
  runLength,
  stateKey,
  topOf,
  tubeComplete,
  type LevelState,
} from '../tube';

const state = (tubes: number[][], capacity = 4, moves = 0): LevelState => ({ tubes, capacity, moves });

describe('topOf / runLength', () => {
  it('reads the top of a tube, which is the last element', () => {
    expect(topOf([1, 2, 3])).toBe(3);
    expect(topOf([])).toBeUndefined();
  });

  it('counts how many of the top colour sit together', () => {
    expect(runLength([1, 2, 2, 2])).toBe(3);
    expect(runLength([1, 2, 3])).toBe(1);
    expect(runLength([2, 2, 2, 2])).toBe(4);
    expect(runLength([])).toBe(0);
  });
});

describe('canPour', () => {
  it('allows a pour onto the same colour with room', () => {
    expect(canPour(state([[1], [1, 1]]), 0, 1)).toBe(true);
  });

  it('allows a pour into an empty tube', () => {
    expect(canPour(state([[1, 1], []]), 0, 1)).toBe(true);
  });

  it('refuses a pour onto a different colour', () => {
    expect(canPour(state([[1], [2]]), 0, 1)).toBe(false);
  });

  it('refuses a pour from an empty tube', () => {
    expect(canPour(state([[], [1]]), 0, 1)).toBe(false);
  });

  it('refuses a pour into a full tube', () => {
    expect(canPour(state([[1], [1, 1, 1, 1]]), 0, 1)).toBe(false);
  });

  it('refuses a tube pouring into itself', () => {
    expect(canPour(state([[1, 1]]), 0, 0)).toBe(false);
  });

  it('refuses a pour whose whole run would not fit', () => {
    // Three of a colour cannot go where only two will fit: a partial pour makes
    // the move count meaningless and the undo confusing.
    expect(canPour(state([[2, 1, 1, 1], [1, 1]]), 0, 1)).toBe(false);
  });

  it('allows a run that exactly fills the destination', () => {
    expect(canPour(state([[2, 2, 1, 1], [1, 1]]), 0, 1)).toBe(true);
  });

  it('refuses an out-of-range tube index', () => {
    expect(canPour(state([[1], [1]]), 0, 9)).toBe(false);
    expect(canPour(state([[1], [1]]), -1, 1)).toBe(false);
  });
});

describe('pour', () => {
  it('moves the whole run and counts the move', () => {
    const next = pour(state([[1, 2, 2], [2]]), 0, 1);
    expect(next.tubes).toEqual([[1], [2, 2, 2]]);
    expect(next.moves).toBe(1);
  });

  it('does not mutate the state it was given', () => {
    const before = state([[1, 2, 2], [2]]);
    pour(before, 0, 1);
    expect(before.tubes).toEqual([[1, 2, 2], [2]]);
    expect(before.moves).toBe(0);
  });

  it('returns the same state for an illegal pour, without counting a move', () => {
    const before = state([[1], [2]]);
    expect(pour(before, 0, 1)).toBe(before);
  });
});

describe('legalMoves', () => {
  it('lists every legal pour', () => {
    expect(legalMoves(state([[1], [1], []]))).toEqual(
      expect.arrayContaining([
        { from: 0, to: 1 },
        { from: 1, to: 0 },
        { from: 0, to: 2 },
        { from: 1, to: 2 },
      ]),
    );
  });

  it('finds nothing in a stuck position', () => {
    expect(legalMoves(state([[1, 2, 1, 2], [2, 1, 2, 1]]))).toEqual([]);
  });
});

describe('tubeComplete / isWon', () => {
  it('treats an empty tube as done', () => {
    expect(tubeComplete([], 4)).toBe(true);
  });

  it('treats a full single-colour tube as done', () => {
    expect(tubeComplete([3, 3, 3, 3], 4)).toBe(true);
  });

  it('refuses a partly filled tube, even of one colour', () => {
    // Otherwise a level could "win" with colours split across two tubes.
    expect(tubeComplete([3, 3], 4)).toBe(false);
  });

  it('refuses a full mixed tube', () => {
    expect(tubeComplete([3, 3, 3, 1], 4)).toBe(false);
  });

  it('wins only when every tube is done', () => {
    expect(isWon(state([[1, 1, 1, 1], [2, 2, 2, 2], []]))).toBe(true);
    expect(isWon(state([[1, 1, 1, 1], [2, 2, 2], [2]]))).toBe(false);
  });
});

describe('stateKey', () => {
  it('is identical for positions that differ only in tube order', () => {
    // Tube order carries no meaning; a solver that treats the two as different
    // explores the same subtree over and over.
    expect(stateKey(state([[1, 1], [2], []]))).toBe(stateKey(state([[2], [], [1, 1]])));
  });

  it('differs for genuinely different positions', () => {
    expect(stateKey(state([[1, 1], []]))).not.toBe(stateKey(state([[1], [1]])));
  });
});
