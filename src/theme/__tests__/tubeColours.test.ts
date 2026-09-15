import { contrastRatio } from '../color';
import { TUBE_COLOURS, colourAt } from '../tubeColours';
import { darkPalette, lightPalette } from '../tokens';

/** Hue angle in degrees, 0-360. */
function hueOf(hex: string): number {
  const v = hex.replace('#', '');
  const n = Number.parseInt(v, 16);
  const [r, g, b] = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h =
    max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return ((h * 60) % 360 + 360) % 360;
}

/** Shortest angular distance between two hues. */
function hueGap(a: string, b: string): number {
  const diff = Math.abs(hueOf(a) - hueOf(b)) % 360;
  return diff > 180 ? 360 - diff : diff;
}

describe('TUBE_COLOURS', () => {
  it('has one colour for every colour a level can use', () => {
    expect(TUBE_COLOURS).toHaveLength(12);
  });

  it('has no duplicates — two tubes that look identical are unsolvable by sight', () => {
    expect(new Set(TUBE_COLOURS).size).toBe(TUBE_COLOURS.length);
  });

  it.each([
    ['light', lightPalette.surface],
    ['dark', darkPalette.surface],
  ])('stands out from the %s tube background', (_label, surface) => {
    // A band that blends into the empty part of the tube cannot be read at all.
    for (const colour of TUBE_COLOURS) {
      expect(contrastRatio(colour, surface)).toBeGreaterThanOrEqual(1.6);
    }
  });

  it('keeps neighbouring colours apart in HUE, so the first few levels are not four blues', () => {
    // Deliberately not a contrast ratio: WCAG contrast measures luminance, and
    // two colours can be plainly different hues at identical lightness — which
    // is exactly what a naive contrast check rejects. Hue separation is the
    // property actually wanted here.
    for (let i = 1; i < TUBE_COLOURS.length; i += 1) {
      expect(hueGap(TUBE_COLOURS[i]!, TUBE_COLOURS[i - 1]!)).toBeGreaterThanOrEqual(25);
    }
  });
});

describe('colourAt', () => {
  it('maps a colour index to its hue', () => {
    expect(colourAt(0)).toBe(TUBE_COLOURS[0]);
    expect(colourAt(5)).toBe(TUBE_COLOURS[5]);
  });

  it('wraps rather than returning undefined for an out-of-range index', () => {
    expect(colourAt(TUBE_COLOURS.length)).toBe(TUBE_COLOURS[0]);
    expect(colourAt(99)).toBeDefined();
  });
});
