import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHINESE_SKY_ENTRIES, CULTURE_GROUPS, CULTURE_SOURCES, getCultureEntry, searchCultureEntries } from '../src/data/chineseSkyCulture';
import { CATALOG, getStarDisplayName } from '../src/utils/stars';
import { buildCelestialStarRenderData } from '../src/utils/starField';
import { selectCultureReferenceStars } from '../src/utils/cultureHighlights';
import { getCultureCopy } from '../src/utils/cultureCopy';
import { useAppStore } from '../src/store/useAppStore';
import ChineseSkyExplorer from '../src/components/ui/ChineseSkyExplorer';

await test('cultural roster has three enclosures and exactly seven ordered mansions per symbol', () => {
  assert.equal(new Set(CHINESE_SKY_ENTRIES.map((entry) => entry.id)).size, CHINESE_SKY_ENTRIES.length);
  assert.deepEqual(CHINESE_SKY_ENTRIES.filter((entry) => entry.kind === 'enclosure').map((entry) => entry.name), ['紫微垣', '太微垣', '天市垣']);
  const rows = [
    ['dragon', '角亢氐房心尾箕'], ['tortoise', '斗牛女虚危室壁'],
    ['tiger', '奎娄胃昴毕觜参'], ['bird', '井鬼柳星张翼轸'],
  ];
  for (const [group, names] of rows) {
    const entries = CHINESE_SKY_ENTRIES.filter((entry) => entry.group === group);
    assert.equal(entries.map((entry) => entry.name[0]).join(''), names);
    assert.deepEqual(entries.map((entry) => entry.order), [1, 2, 3, 4, 5, 6, 7]);
    assert.ok(entries.every((entry) => entry.kind === 'mansion'));
  }
  assert.equal(CHINESE_SKY_ENTRIES.filter((entry) => entry.kind === 'mansion').length, 28);
});

await test('reviewed examples resolve to real catalog identities with explicit source links', () => {
  for (const entry of CHINESE_SKY_ENTRIES) {
    assert.ok(CULTURE_GROUPS.some((group) => group.id === entry.group));
    assert.ok(entry.sourceIds.length > 0);
    for (const source of entry.sourceIds) assert.match(CULTURE_SOURCES[source].url, /^https:\/\//);
    assert.equal(new Set(entry.stars.map((star) => star.id)).size, entry.stars.length);
    for (const star of entry.stars) {
      const source = CATALOG.find((item) => item.id === star.id);
      assert.ok(source, `missing ${star.id} for ${entry.id}`);
      assert.ok(Number.isFinite(source.raHours) && Number.isFinite(source.decDegrees));
      assert.ok(star.chineseName && star.designation);
      assert.ok(entry.sourceIds.includes('starNames'));
    }
  }
  assert.equal(getCultureEntry('hegu')!.stars[0].id, 'star:bayer:alpha-aql');
  assert.equal(getCultureEntry('ziwei')!.stars[0].id, 'star:bayer:alpha-umi');
  assert.equal(getCultureEntry('beidou')!.stars.length, 7);
  assert.equal(getCultureEntry('shen')!.stars[0].chineseName, '参宿四');
});

await test('search accepts Chinese names, Western proper names and symbol filters', () => {
  assert.deepEqual(searchCultureEntries(' VEGA ').map((entry) => entry.id), ['zhinu']);
  assert.deepEqual(searchCultureEntries('心宿二').map((entry) => entry.id), ['xin']);
  assert.deepEqual(searchCultureEntries('α Her').map((entry) => entry.id), ['tianshi']);
  assert.equal(searchCultureEntries('', 'tiger').length, 7);
  assert.equal(searchCultureEntries('Vega', 'tiger').length, 0);
  assert.equal(searchCultureEntries('no-such-asterism').length, 0);
  assert.equal(getCultureEntry(null), undefined);
  assert.equal(getCultureEntry('invalid'), undefined);
});

await test('Orion belt identity correction keeps epsilon as 参宿二 and delta as 参宿三', () => {
  const cases = [
    ['star:bayer:epsilon-ori', '参宿二', 'Epsilon Ori'],
    ['star:bayer:delta-ori', '参宿三', 'Delta Ori'],
  ];
  for (const [id, chineseName, designation] of cases) {
    const stars = CATALOG.filter((star) => star.id === id);
    assert.ok(stars.length > 0);
    for (const star of stars) {
      assert.equal(star.names.chineseAsterism, chineseName);
      assert.equal(star.names.westernDesignation, designation);
      for (const language of ['zh-CN', 'en'] as const) assert.equal(getStarDisplayName(star, 'chinese', language), chineseName);
    }
  }
});

await test('highlights preserve original stars and work across both language and chart systems', () => {
  for (const language of ['zh-CN', 'en'] as const) for (const culture of ['chinese', 'western'] as const) {
    const stars = buildCelestialStarRenderData(CATALOG, 10, 1.04, culture, language);
    const original = JSON.stringify(stars);
    const bigDipper = selectCultureReferenceStars(stars, 'beidou');
    assert.equal(bigDipper.length, 7);
    assert.ok(bigDipper.every((star) => stars.includes(star)));
    assert.equal(JSON.stringify(stars), original);
    assert.equal(selectCultureReferenceStars([...stars, ...stars], 'beidou').length, 7);
    assert.deepEqual(selectCultureReferenceStars(stars, 'kang'), []);
    assert.deepEqual(selectCultureReferenceStars(stars, null), []);
    assert.deepEqual(selectCultureReferenceStars(stars, 'invalid'), []);
  }
});

await test('culture selection is reversible and does not change clock, observer, language or chart system', () => {
  const state = useAppStore.getState();
  const snapshot = { scene: state.scene, clock: state.clock, observer: state.observer, display: state.display };
  state.setSelectedCultureEntryId('ziwei');
  state.setSelectedCultureEntryId('ziwei');
  assert.equal(useAppStore.getState().selectedCultureEntryId, 'ziwei');
  for (const [key, value] of Object.entries(snapshot)) assert.equal(useAppStore.getState()[key as keyof typeof snapshot], value);
  state.setLanguage('en');
  state.setSkyCulture('western');
  state.setShowStars(false);
  assert.equal(useAppStore.getState().selectedCultureEntryId, 'ziwei');
  state.setSelectedCultureEntryId(null);
  assert.equal(useAppStore.getState().selectedCultureEntryId, null);
  useAppStore.setState(snapshot);
});

await test('bilingual copy preserves cultural names and the explorer starts collapsed with accessible controls', () => {
  for (const language of ['zh-CN', 'en'] as const) {
    const copy = getCultureCopy(language);
    assert.equal(copy.title, '三垣二十八宿');
    for (const text of Object.values(copy)) assert.ok(text.trim().length > 0);
    for (const group of CULTURE_GROUPS) assert.ok(group.description[language]);
  }
  const html = renderToStaticMarkup(createElement(ChineseSkyExplorer));
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls=/);
  assert.match(html, /三垣二十八宿/);
  assert.doesNotMatch(html, /type="search"/);
});
