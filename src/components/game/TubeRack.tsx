import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';

import { t } from '@/i18n';
import { runLength, topOf, type LevelState } from '@/logic/tube';
import { colourAt } from '@/theme/tubeColours';
import { useTheme } from '@/theme';

/**
 * The rack of tubes.
 *
 * Sized from the window so eight tubes and fourteen both fit without scrolling
 * — a level you have to scroll to see is unplayable, and this genre routinely
 * goes from four tubes to fourteen.
 *
 * A tube is drawn bottom-up because that is how liquid sits; the array is also
 * bottom-first, so the two agree and there is no reversal to get wrong.
 */
export function TubeRack({
  state,
  selected,
  onSelect,
}: {
  state: LevelState;
  selected: number | null;
  onSelect: (index: number) => void;
}) {
  const { width, height } = useWindowDimensions();
  const { colors, spacing, radius } = useTheme();

  const count = state.tubes.length;
  const perRow = count <= 7 ? count : Math.ceil(count / 2);
  const rows = Math.ceil(count / perRow);

  const gap = spacing.md;
  const available = width - spacing.base * 2;

  // Sized from the space there is, not from fixed maxima. The old caps of 58pt
  // wide and 34pt per unit were set against a small phone: on a 6.9" screen they
  // left the rack occupying the top third and the rest of the display empty,
  // which reads as an app that has never been opened on a modern device.
  const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

  // The ceiling has to scale with the display, or it becomes the same bug one
  // size up. 52pt was chosen against a 6.9" phone; on a 13" iPad the height
  // term offers roughly 180pt per unit and the constant throws it away, so the
  // rack sits in the top 45% of the screen with a large dead region beneath --
  // which is the very thing the comment above describes, recurring at tablet
  // scale. Measured on iPad 13 during QA: board and controls occupying y=0-700
  // of 1376pt.
  //
  // The 96 above was still the binding constraint, because it was chosen to keep
  // a tube proportional to its width -- and on a 13" iPad the width is already
  // spent: five tubes side by side leave about 185pt each, so no amount of
  // vertical room can make a tube wider. Measured post-scale during QA: the rack
  // and its controls ended at 656pt of 1376, so 52% of the display was empty.
  //
  // The room that is left is vertical, so the tube takes it vertically and stops
  // being width-proportional on a tablet. A test tube is a tall narrow vessel;
  // letting it be one is closer to the object than holding it to a phone's
  // aspect ratio. Deliberately stopping short of filling the screen -- this
  // changes the character of the segments, which become squarer, and that is a
  // judgement better made against a device than in arithmetic.
  const isTablet = width >= 700;
  const heightFraction = isTablet ? 0.6 : 0.52;
  const maxUnit = isTablet ? 150 : 52;
  const unit = clamp(
    Math.floor((height * heightFraction) / (rows * state.capacity)),
    18,
    maxUnit,
  );
  // Tube width follows the unit so a tube keeps its proportions rather than
  // becoming a wide letterbox on a tablet.
  const tubeWidth = clamp(
    Math.floor((available - gap * (perRow - 1)) / perRow),
    26,
    Math.round(unit * 1.9),
  );
  const tubeHeight = unit * state.capacity;

  return (
    <View style={{ alignItems: 'center', gap, marginTop: spacing.lg }}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row', gap, justifyContent: 'center' }}>
          {state.tubes.slice(row * perRow, row * perRow + perRow).map((tube, i) => {
            const index = row * perRow + i;
            const isSelected = selected === index;
            const top = topOf(tube);
            const contents =
              tube.length === 0
                ? t('tubeEmpty')
                : t('colourCount', { count: runLength(tube) });
            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={t('tubeA11y', { number: index + 1, contents })}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  void Haptics.selectionAsync();
                  onSelect(index);
                }}
                style={{
                  width: tubeWidth,
                  height: tubeHeight + spacing.md,
                  justifyContent: 'flex-end',
                  paddingBottom: isSelected ? spacing.md : 0,
                }}
              >
                <View
                  style={{
                    width: tubeWidth,
                    height: tubeHeight,
                    justifyContent: 'flex-end',
                    overflow: 'hidden',
                    borderRadius: radius.md,
                    borderBottomLeftRadius: radius.xl,
                    borderBottomRightRadius: radius.xl,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.accent : colors.border,
                    backgroundColor: colors.surface,
                  }}
                >
                  {/* Bottom-first, matching the data, so nothing has to be reversed. */}
                  {tube.map((colour, depth) => (
                    <View
                      key={depth}
                      style={{ height: unit, backgroundColor: colourAt(colour) }}
                    />
                  ))}
                </View>
                {top !== undefined && isSelected ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      alignSelf: 'center',
                      // Sized from the tube's width, not from `unit`. This dot
                      // is a round marker sitting above a tube, so the tube's
                      // horizontal measure is the one it belongs to -- keyed to
                      // `unit` it became a 75pt blob the moment segments grew.
                      width: tubeWidth * 0.4,
                      height: tubeWidth * 0.4,
                      borderRadius: tubeWidth * 0.2,
                      backgroundColor: colourAt(top),
                    }}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
