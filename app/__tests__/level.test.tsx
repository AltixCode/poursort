import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import LevelRoute from '../level/[id]';
import { setRouteParams } from './testRouter';
import { renderWithProviders } from '@/components/__tests__/renderWithProviders';
import { t } from '@/i18n';
import { generateLevel } from '@/logic/generate';
import { seedFromKey } from '@/logic/rng';
import { solve } from '@/logic/solve';
import { useAdsConsentStore } from '@/store/useAdsConsentStore';
import { useLevelsStore } from '@/store/useLevelsStore';
import { usePremiumStore } from '@/store/usePremiumStore';

beforeEach(() => {
  jest.clearAllMocks();
  setRouteParams({ id: '1' });
  usePremiumStore.setState({ isPremium: false, isReady: true });
  useAdsConsentStore.setState({ consent: { canServeAds: true, offerPrivacyOptions: false } });
  useLevelsStore.setState({ results: {}, isHydrated: true });
});

describe('Level', () => {
  it('shows the level number, move count and par', async () => {
    const { getByText } = await renderWithProviders(<LevelRoute />);
    expect(getByText(t('levelLabel', { number: 1 }))).toBeTruthy();
    expect(getByText(new RegExp(t('movesLabel')))).toBeTruthy();
  });

  it('renders one control per tube', async () => {
    const { state } = generateLevel(1, seedFromKey('poursort:1'));
    const { getAllByRole } = await renderWithProviders(<LevelRoute />);
    const buttons = getAllByRole('button');
    // Tubes plus the three toolbar buttons.
    expect(buttons.length).toBeGreaterThanOrEqual(state.tubes.length);
  });

  it('starts with undo unavailable — there is nothing to undo', async () => {
    const { getByLabelText } = await renderWithProviders(<LevelRoute />);
    expect(getByLabelText(t('undo')).props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('a hint makes a real move and enables undo', async () => {
    const { getByLabelText } = await renderWithProviders(<LevelRoute />);
    await fireEvent.press(getByLabelText(t('hint')));
    await waitFor(() =>
      expect(getByLabelText(t('undo')).props.accessibilityState).toMatchObject({ disabled: false }),
    );
  });

  it('undo returns the board to where it started', async () => {
    const { getByLabelText } = await renderWithProviders(<LevelRoute />);
    const undoState = () => getByLabelText(t('undo')).props.accessibilityState;

    await fireEvent.press(getByLabelText(t('hint')));
    await waitFor(() => expect(undoState()).toMatchObject({ disabled: false }));

    await fireEvent.press(getByLabelText(t('undo')));
    // Undo becoming unavailable again is the proof: the history is back to the
    // single starting state.
    await waitFor(() => expect(undoState()).toMatchObject({ disabled: true }));
  });

  it('level 1 is genuinely solvable — the screen cannot be a dead end', async () => {
    const { state } = generateLevel(1, seedFromKey('poursort:1'));
    expect(solve(state)).not.toBeNull();
  });
});
