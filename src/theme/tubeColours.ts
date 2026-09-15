/**
 * Tube colours.
 *
 * Twelve distinct hues, because a level may use up to twelve. They are drawn at
 * full strength — unlike a grid tint, a liquid band is the thing being judged,
 * so it must not be washed out against the surface.
 *
 * Colour alone never carries meaning that matters: a tube's contents are also
 * exposed to a screen reader as a count of the top band, so a player who cannot
 * separate two hues can still read the rack. The set is ordered so that
 * adjacent entries are far apart in hue — a level using the first four must not
 * be four blues.
 *
 * This is a palette file, which is the one place colours are allowed to be
 * written down.
 */
export const TUBE_COLOURS = [
  '#7C5CFF',
  '#F59E0B',
  '#10B981',
  '#EC4899',
  '#0EA5E9',
  '#F97316',
  '#14B8A6',
  '#8B5CF6',
  '#DC2626',
  '#2563EB',
  '#65A30D',
  '#DB2777',
] as const;

export const colourAt = (index: number): string =>
  TUBE_COLOURS[index % TUBE_COLOURS.length] ?? TUBE_COLOURS[0];
