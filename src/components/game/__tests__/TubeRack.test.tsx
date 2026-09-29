import React from 'react';

import { renderWithProviders } from '@/components/__tests__/renderWithProviders';
import { TUBE_COLOURS } from '@/theme/tubeColours';
import type { LevelState } from '@/logic/tube';
import { TubeRack } from '../TubeRack';

/**
 * Beta feedback (items 3 & 4 of the 2026-09 TestFlight round):
 *
 * - "Instead of having the bottom-est color on the tube that's gonna be
 *   moved, it should be the top color as the logic is to pour the top-most
 *   liquid to other tubes."
 * - "This yellow-green-yellow tube can't be poured outside. Other full,
 *   multicolor tubes don't have this problem."
 *
 * Both trace back to the same root cause: before the "liquid visual stack
 * order" fix, a tube's segments were rendered bottom-first without being
 * reversed, so the DATA-model top (`tube[tube.length - 1]`, the only colour
 * `canPour`/`pour` ever touch) rendered at the visual FLOOR of the tube, and
 * the data-model bottom rendered next to the mouth. `pour()` itself always
 * moved the correct (last) element — the bug was purely that the screen
 * showed the wrong colour sitting at the mouth, so players who poured "the
 * top colour they could see" watched the wrong band leave, and a
 * yellow-?-yellow tube looked stuck because the visible "top" colour didn't
 * match what a destination tube expected even when a legal pour existed.
 *
 * This is now fixed (see TubeRack.tsx's `.slice().reverse()`), and these
 * tests pin the correct order down as a regression guard: the segment
 * nearest the tube's open mouth must always be `topOf(tube)`.
 */
describe('TubeRack visual stack order', () => {
  const level = (tubes: number[][], capacity = 3): LevelState => ({
    tubes,
    capacity,
    moves: 0,
  });

  const renderedColourOrder = (json: ReturnType<typeof renderSegments>) => json;

  function renderSegments(tree: unknown): string[] {
    const found: string[] = [];
    const colours = new Set<string>(TUBE_COLOURS as unknown as string[]);
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      const n = node as { props?: { style?: unknown }; children?: unknown[] };
      const style = n.props?.style as
        { backgroundColor?: string; height?: number } | undefined;
      if (style && typeof style === 'object' && 'backgroundColor' in style) {
        const bg = style.backgroundColor;
        if (bg && colours.has(bg)) found.push(bg);
      }
      (n.children ?? []).forEach(walk);
    };
    walk(tree);
    return found;
  }

  it('renders the top-of-stack (last array element) closest to the tube mouth, not the bottom', async () => {
    // Bottom = colour 0, top (nearest the mouth) = colour 1 — distinct colours
    // so the render order is unambiguous.
    const state = level([[0, 1]], 3);
    const { toJSON } = await renderWithProviders(
      <TubeRack state={state} selected={null} onSelect={() => {}} />,
    );
    const order = renderedColourOrder(renderSegments(toJSON()));
    // First rendered segment is visually topmost in a flex column, so it must
    // be the data-model top: colour 1.
    expect(order[0]).toBe(TUBE_COLOURS[1]);
    expect(order[1]).toBe(TUBE_COLOURS[0]);
  });

  it('renders a full yellow-green-yellow-shaped tube (top == bottom, distinct middle) in mouth-to-floor order', async () => {
    // Colours 0/1/0 stand in for yellow/green/yellow. Full (length === capacity).
    const state = level([[0, 1, 0]], 3);
    const { toJSON } = await renderWithProviders(
      <TubeRack state={state} selected={null} onSelect={() => {}} />,
    );
    const order = renderedColourOrder(renderSegments(toJSON()));
    expect(order).toEqual([TUBE_COLOURS[0], TUBE_COLOURS[1], TUBE_COLOURS[0]]);
  });
});
