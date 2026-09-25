import { useRef, useCallback, useLayoutEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { getSyncedSimTimeMs, getWallNow, useAppStore } from '../store/useAppStore';

const DISPLAY_UPDATE_INTERVAL_MS = 100;

/** One simulation clock per mounted scene. Input synchronizes immediately, even in demand mode. */
export function useSimulationTime() {
  const [initialDate] = useState(() => new Date(getSyncedSimTimeMs(useAppStore.getState().clock, getWallNow())));
  const simDateRef = useRef(initialDate);
  const lastDisplayUpdateRef = useRef(0);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    const sync = () => simDateRef.current.setTime(getSyncedSimTimeMs(useAppStore.getState().clock, getWallNow()));
    sync();
    const unsubscribe = useAppStore.subscribe((state, previous) => {
      const clockInputChanged = state.clock.currentTime !== previous.clock.currentTime
        || state.clock.playbackStartWallTime !== previous.clock.playbackStartWallTime
        || state.clock.isPlaying !== previous.clock.isPlaying
        || state.clock.timeSpeed !== previous.clock.timeSpeed;
      if (clockInputChanged) sync();
      if (clockInputChanged || state.observer !== previous.observer
        || state.scene !== previous.scene || state.display !== previous.display) {
        invalidate();
      }
    });
    invalidate();
    return unsubscribe;
  }, [invalidate]);

  // Run before any rotating groups, body projections or billboards.
  useFrame(() => {
    const { clock, updateDisplayTime } = useAppStore.getState();
    const wallNow = getWallNow();
    const simTimeMs = getSyncedSimTimeMs(clock, wallNow);
    simDateRef.current.setTime(simTimeMs);
    if (clock.isPlaying && wallNow - lastDisplayUpdateRef.current > DISPLAY_UPDATE_INTERVAL_MS) {
      lastDisplayUpdateRef.current = wallNow;
      updateDisplayTime(new Date(simTimeMs));
    }
  }, -2);

  const getSimDate = useCallback(() => simDateRef.current, []);
  return { simDateRef, getSimDate };
}
