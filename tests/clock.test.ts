import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSyncedSimTimeMs, useAppStore } from '../src/store/useAppStore';

await test('date input and stepping immediately reset playback and cannot be overwritten by UI clock updates', () => {
  const actions = useAppStore.getState();
  actions.setIsPlaying(false);
  const chosen = new Date('2026-12-31T23:30:00Z');
  actions.setCurrentTime(chosen);
  actions.stepCurrentTime(3600000);
  assert.equal(useAppStore.getState().clock.currentTime.toISOString(), '2027-01-01T00:30:00.000Z');
  actions.setIsPlaying(true);
  actions.setTimeSpeed(3600);
  actions.setCurrentTime(chosen);
  const before = useAppStore.getState().clock;
  assert.equal(before.playbackStartSimTimeMs, chosen.getTime());
  assert.equal(getSyncedSimTimeMs(before, before.playbackStartWallTime! + 1000), chosen.getTime() + 3600000);
  actions.stepCurrentTime(86400000);
  const stepped = useAppStore.getState().clock;
  assert.equal(stepped.playbackStartSimTimeMs, getSyncedSimTimeMs(before, stepped.playbackStartWallTime!) + 86400000);
  actions.updateDisplayTime(new Date(0));
  const after = useAppStore.getState().clock;
  assert.equal(after.currentTime, stepped.currentTime);
  assert.equal(after.playbackStartSimTimeMs, stepped.playbackStartSimTimeMs);
  actions.setIsPlaying(false);
});

await test('city presets publish latitude and longitude together and scene preferences remain independent', () => {
  const seen: Array<{ latitude: number; longitude: number }> = [];
  const stop = useAppStore.subscribe((state, previous) => {
    if (state.observer !== previous.observer) seen.push(state.observer);
  });
  const actions = useAppStore.getState();
  actions.setObserverLocation(-33.8688, 151.2093);
  stop();
  assert.deepEqual(seen, [{ latitude: -33.8688, longitude: 151.2093 }]);
  actions.setSkyCulture('chinese');
  actions.setLanguage('en');
  assert.equal(useAppStore.getState().scene.skyCulture, 'chinese');
  actions.setSkyCulture('western');
  assert.equal(useAppStore.getState().scene.language, 'en');
});
