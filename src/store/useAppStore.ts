import { create } from 'zustand';
import type { AppLanguage } from '../utils/i18n';

interface SceneState {
  viewMode: 'earth' | 'space';
  referenceFrame: 'observer' | 'celestial';
  skyCulture: 'western' | 'chinese';
  language: AppLanguage;
}

interface ObserverState {
  latitude: number;
}

interface ClockState {
  currentTime: Date;
  isPlaying: boolean;
  timeSpeed: number;
  playbackStartWallTime: number | null;
  playbackStartSimTimeMs: number | null;
  /**
   * Low-frequency timestamp for UI display (updated ~10 times/sec by useSimulationTime).
   * 3D scene code should use `useSimulationTime()` instead of subscribing to this.
   */
  displayTime: Date;
}

interface DisplayState {
  showDiurnalArc: boolean;
  showAnnualTrail: boolean;
  showMilkyWay: boolean;
  showStars: boolean;
  showCelestialObserverOverlay: boolean;
  showMoon: boolean;
  showPlanets: boolean;
}

interface AppState {
  scene: SceneState;
  observer: ObserverState;
  clock: ClockState;
  display: DisplayState;
  
  // Actions
  setViewMode: (mode: 'earth' | 'space') => void;
  setReferenceFrame: (frame: 'observer' | 'celestial') => void;
  setSkyCulture: (culture: 'western' | 'chinese') => void;
  setLanguage: (language: AppLanguage) => void;
  setLatitude: (lat: number) => void;
  setCurrentTime: (date: Date) => void;
  setIsPlaying: (playing: boolean) => void;
  setTimeSpeed: (speed: number) => void;
  setShowDiurnalArc: (show: boolean) => void;
  setShowAnnualTrail: (show: boolean) => void;
  setShowMilkyWay: (show: boolean) => void;
  setShowStars: (show: boolean) => void;
  setShowCelestialObserverOverlay: (show: boolean) => void;
  setShowMoon: (show: boolean) => void;
  setShowPlanets: (show: boolean) => void;
  /**
   * Called by useSimulationTime at ~10fps to update the UI clock display.
   * DO NOT call this every frame from requestAnimationFrame.
   */
  updateDisplayTime: (date: Date) => void;
  /**
   * @deprecated Use useSimulationTime() hook inside 3D scene components instead.
   * Kept only for backward-compatibility with ControlPanel's rAF loop.
   */
  advanceTime: (wallNow: number) => void;
}

export function getWallNow() {
  return performance.now();
}

export function getSyncedSimTimeMs(clock: ClockState, wallNow: number) {
  if (
    !clock.isPlaying ||
    clock.playbackStartWallTime === null ||
    clock.playbackStartSimTimeMs === null
  ) {
    return clock.currentTime.getTime();
  }

  return clock.playbackStartSimTimeMs + (wallNow - clock.playbackStartWallTime) * clock.timeSpeed;
}

export const useAppStore = create<AppState>((set) => {
  const initialCurrentTime = new Date();
  const initialWallNow = getWallNow();

  return ({
    scene: {
      viewMode: 'space',
      referenceFrame: 'observer',
      skyCulture: 'chinese',
      language: 'zh-CN',
    },
    observer: {
      latitude: 40,
    },
    clock: {
      currentTime: initialCurrentTime,
      isPlaying: true,
      timeSpeed: 3600,
      playbackStartWallTime: initialWallNow,
      playbackStartSimTimeMs: initialCurrentTime.getTime(),
      displayTime: initialCurrentTime,
    },
    // Display flags stay shared across Earth/Space so both views can honor the same visibility contract.
    display: {
      showDiurnalArc: true,
      showAnnualTrail: true,
      showMilkyWay: true,
      showStars: true,
      showCelestialObserverOverlay: false,
      showMoon: true,
      showPlanets: true,
    },

    setViewMode: (mode) => set((state) => ({ scene: { ...state.scene, viewMode: mode } })),
    setReferenceFrame: (frame) => set((state) => ({ scene: { ...state.scene, referenceFrame: frame } })),
    setSkyCulture: (culture) => set((state) => ({ scene: { ...state.scene, skyCulture: culture } })),
    setLanguage: (language) => set((state) => ({ scene: { ...state.scene, language } })),
    setLatitude: (lat) => set((state) => ({ observer: { ...state.observer, latitude: lat } })),
    setCurrentTime: (date) =>
      set((state) => {
        const wallNow = getWallNow();

        return {
          clock: {
            ...state.clock,
            currentTime: date,
            displayTime: date,
            playbackStartWallTime: state.clock.isPlaying ? wallNow : null,
            playbackStartSimTimeMs: state.clock.isPlaying ? date.getTime() : null,
          },
        };
      }),
    setIsPlaying: (playing) =>
      set((state) => {
        const wallNow = getWallNow();
        const syncedSimTimeMs = getSyncedSimTimeMs(state.clock, wallNow);
        const syncedDate = new Date(syncedSimTimeMs);

        return {
          clock: {
            ...state.clock,
            currentTime: syncedDate,
            displayTime: syncedDate,
            isPlaying: playing,
            playbackStartWallTime: playing ? wallNow : null,
            playbackStartSimTimeMs: playing ? syncedSimTimeMs : null,
          },
        };
      }),
    setTimeSpeed: (speed) =>
      set((state) => {
        const wallNow = getWallNow();
        const syncedSimTimeMs = getSyncedSimTimeMs(state.clock, wallNow);
        const syncedDate = new Date(syncedSimTimeMs);

        return {
          clock: {
            ...state.clock,
            currentTime: syncedDate,
            displayTime: syncedDate,
            timeSpeed: speed,
            playbackStartWallTime: state.clock.isPlaying ? wallNow : null,
            playbackStartSimTimeMs: state.clock.isPlaying ? syncedSimTimeMs : null,
          },
        };
      }),
    setShowDiurnalArc: (show) => set((state) => ({ display: { ...state.display, showDiurnalArc: show } })),
    setShowAnnualTrail: (show) => set((state) => ({ display: { ...state.display, showAnnualTrail: show } })),
    setShowMilkyWay: (show) => set((state) => ({ display: { ...state.display, showMilkyWay: show } })),
    setShowStars: (show) => set((state) => ({ display: { ...state.display, showStars: show } })),
    setShowCelestialObserverOverlay: (show) => set((state) => ({ display: { ...state.display, showCelestialObserverOverlay: show } })),
    setShowMoon: (show) => set((state) => ({ display: { ...state.display, showMoon: show } })),
    setShowPlanets: (show) => set((state) => ({ display: { ...state.display, showPlanets: show } })),
  updateDisplayTime: (date) =>
      set((state) => ({
        clock: {
          ...state.clock,
          displayTime: date,
        },
      })),
    advanceTime: (wallNow) =>
      set((state) => {
        const syncedSimTimeMs = getSyncedSimTimeMs(state.clock, wallNow);

        return {
          clock: {
            ...state.clock,
            currentTime: new Date(syncedSimTimeMs),
          },
        };
      }),
  });
});
