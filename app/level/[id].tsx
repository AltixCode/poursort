import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { BannerAdSlot } from '@/components/BannerAdSlot';
import { TubeRack } from '@/components/game/TubeRack';
import { Button, Screen, Text } from '@/components/ui';
import { useLevel } from '@/hooks/useLevel';
import { t } from '@/i18n';
import { shouldShowInterstitial } from '@/monetization/adPolicy';
import { showInterstitial } from '@/monetization/interstitial';
import { isRewardedReady, showRewarded } from '@/monetization/rewarded';
import { hintFor } from '@/logic/solve';
import { TOTAL_LEVELS } from '@/logic/stars';
import { canPour, isWon, legalMoves, pour, type LevelState } from '@/logic/tube';
import { useLevelsStore } from '@/store/useLevelsStore';
import { usePremiumStore } from '@/store/usePremiumStore';
import { useTheme } from '@/theme';

/** One free hint per level; a rewarded ad buys another. */
const FREE_HINTS = 1;

export default function LevelRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const level = Math.max(1, Math.min(TOTAL_LEVELS, Number(params.id ?? 1) || 1));
  // Keyed so moving to another level REMOUNTS: resetting from an effect leaves
  // one frame showing the previous level's tubes.
  return <LevelSession key={level} level={level} />;
}

function LevelSession({ level }: { level: number }) {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { state: initial, par } = useLevel(level);

  const [history, setHistory] = useState<LevelState[]>([initial]);
  const [selected, setSelected] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  // A latch, not state: nothing renders from it, and calling setState in the
  // win effect would cascade a render for no visible change.
  const recorded = useRef(false);

  const state = history[history.length - 1]!;
  const won = isWon(state);
  const stuck = !won && legalMoves(state).length === 0;

  const recordClear = useLevelsStore((s) => s.recordClear);
  const isPremium = usePremiumStore((s) => s.isPremium);

  useEffect(() => {
    if (!won || recorded.current) return;
    recorded.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    recordClear(level, state.moves, par);

    // After the win is on screen, behind its own pacing — never during play.
    if (
      shouldShowInterstitial({
        gamesPlayed: level,
        lastInterstitialAt: 0,
        now: Date.now(),
        adsRemoved: isPremium,
      })
    ) {
      showInterstitial();
    }
  }, [won, level, state.moves, par, recordClear, isPremium]);

  const select = useCallback(
    (index: number) => {
      if (won) return;
      if (selected === null) {
        if (state.tubes[index]?.length) setSelected(index);
        return;
      }
      if (selected === index) {
        setSelected(null);
        return;
      }
      if (canPour(state, selected, index)) {
        setHistory((h) => [...h, pour(state, selected, index)]);
        setSelected(null);
      } else {
        // Tapping an illegal target picks it up instead of doing nothing, which
        // is what players actually mean when they change their mind mid-move.
        setSelected(state.tubes[index]?.length ? index : null);
      }
    },
    [selected, state, won],
  );

  const undo = useCallback(() => {
    setSelected(null);
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  }, []);

  const restart = useCallback(() => {
    setSelected(null);
    setHistory([initial]);
  }, [initial]);

  const applyHint = useCallback(() => {
    const move = hintFor(state);
    if (!move) return false;
    setHistory((h) => [...h, pour(state, move.from, move.to)]);
    setSelected(null);
    return true;
  }, [state]);

  const onHint = useCallback(() => {
    const allowance = isPremium ? Number.POSITIVE_INFINITY : FREE_HINTS;
    if (hintsUsed < allowance) {
      if (applyHint()) setHintsUsed((n) => n + 1);
      return;
    }
    if (!isRewardedReady()) {
      Alert.alert(t('noHintsLeft'), t('adNotReady'));
      return;
    }
    void showRewarded().then((earned) => {
      if (earned && applyHint()) setHintsUsed((n) => n + 1);
    });
  }, [applyHint, hintsUsed, isPremium]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen scroll>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: spacing.base,
          }}
        >
          <Text variant="title">{t('levelLabel', { number: level })}</Text>
          <Text variant="caption" tone="muted">
            {t('movesLabel')} {state.moves} · {t('parLabel', { count: par })}
          </Text>
        </View>

        <TubeRack state={state} selected={selected} onSelect={select} />

        {won ? (
          <View style={{ alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm }}>
            <Text variant="heading" tone="accent">
              {t('solvedTitle')}
            </Text>
            <Text variant="caption" tone="muted">
              {t('solvedInMoves', { count: state.moves })}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
              <Button
                label={t('nextLevel')}
                onPress={() => router.replace(`/level/${Math.min(TOTAL_LEVELS, level + 1)}`)}
              />
              <Button label={t('backToLevels')} variant="ghost" onPress={() => router.replace('/')} />
            </View>
          </View>
        ) : (
          <>
            {stuck ? (
              <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
                <Text variant="bodyStrong" tone="danger">
                  {t('stuckTitle')}
                </Text>
                <Text variant="caption" tone="muted" align="center" style={{ marginTop: 2 }}>
                  {t('stuckBody')}
                </Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
              <Button
                label={t('undo')}
                variant="secondary"
                disabled={history.length === 1}
                onPress={undo}
                style={{ flex: 1 }}
              />
              <Button label={t('hint')} variant="secondary" onPress={onHint} style={{ flex: 1 }} />
              <Button label={t('restart')} variant="ghost" onPress={restart} style={{ flex: 1 }} />
            </View>
          </>
        )}
      </Screen>
      <BannerAdSlot />
    </View>
  );
}
