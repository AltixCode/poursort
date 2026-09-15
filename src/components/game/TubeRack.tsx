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
  const tubeWidth = Math.min(58, Math.floor((available - gap * (perRow - 1)) / perRow));
  const unit = Math.min(34, Math.floor((height * 0.42) / (rows * state.capacity)));
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
                      width: unit * 0.5,
                      height: unit * 0.5,
                      borderRadius: unit * 0.25,
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
