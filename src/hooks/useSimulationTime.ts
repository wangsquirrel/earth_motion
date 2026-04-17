import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { getSyncedSimTimeMs, getWallNow, useAppStore } from '../store/useAppStore';

/**
 * A hook that computes the current simulation time imperatively inside useFrame,
 * WITHOUT triggering React state updates. This avoids the costly
 * "advanceTime -> store update -> React re-render -> useMemo recalculation" chain
 * that was previously running at 60fps.
 *
 * Returns a ref whose `.current` always holds the latest simulation Date.
 * Also returns a `getSimDate()` helper for use inside callbacks.
 *
 * The store's `displayTime` is updated at a lower frequency (every ~100ms)
 * for UI elements like the ControlPanel clock.
 */

const DISPLAY_UPDATE_INTERVAL_MS = 100;

export function useSimulationTime() {
  const simDateRef = useRef(useAppStore.getState().clock.currentTime);
  const lastDisplayUpdateRef = useRef(0);

  useFrame(() => {
    const { clock, updateDisplayTime } = useAppStore.getState();

    if (
      !clock.isPlaying ||
      clock.playbackStartWallTime === null ||
      clock.playbackStartSimTimeMs === null
    ) {
      simDateRef.current = clock.currentTime;
      return;
    }

    const wallNow = getWallNow();
    const simTimeMs = getSyncedSimTimeMs(clock, wallNow);
    simDateRef.current = new Date(simTimeMs);

    // Throttled update for the UI display
    if (wallNow - lastDisplayUpdateRef.current > DISPLAY_UPDATE_INTERVAL_MS) {
      lastDisplayUpdateRef.current = wallNow;
      updateDisplayTime(simDateRef.current);
    }
  });

  const getSimDate = useCallback(() => simDateRef.current, []);

  return { simDateRef, getSimDate };
}
