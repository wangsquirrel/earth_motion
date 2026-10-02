import type { AppLanguage } from './i18n';

const copy = {
  en: {
    title: 'Precession · shared simulation time', enabled: 'Show precession', compare: 'Compare today',
    year: 'Simulation year (CE)', pole: 'Epoch north pole', equator: 'Epoch equator', equinox: 'Epoch equinox', today: 'Today’s pole',
    legend: 'Gold: epoch pole / equator / equinox · cyan: dated pole path · pink: today',
    limits: '1000–3000 CE: Astronomy Engine P03 precession + nutation. A bounded segment, not a full 26,000-year cycle. Stars remain J2000 without proper motion; historical skies and ancient Earth rotation are approximate. Dates use the proleptic Gregorian calendar.',
    outside: 'Outside the supported epoch window: the precession overlay is hidden; simulation continues.',
    context: '紫微垣 represents the northern celestial court. 勾陈一 (Polaris) is today’s pole star, but a named star is not the pole itself. Compare 1000 CE with today to see its changing offset. Cultural names are not a reconstruction of the sky culture of that date.',
    explore: 'Explore 紫微垣', now: 'Return to today',
  },
  'zh-CN': {
    title: '岁差 · 共用模拟时间', enabled: '显示岁差', compare: '对比今天',
    year: '模拟年份（公元）', pole: '当日北天极', equator: '当日天赤道', equinox: '当日春分点', today: '今天的北天极',
    legend: '金色：当日天极／赤道／春分点 · 青色：标年天极轨迹 · 粉色：今天',
    limits: '范围为公元1000–3000年，采用 Astronomy Engine 的 P03 岁差与章动模型。只显示有限轨迹，不是精确的约26000年整周期。恒星固定于 J2000，未计自行；历史星空与古代地球自转仅为近似。日期采用向前延伸的公历。',
    outside: '当前日期超出支持范围：隐藏岁差图层，模拟仍正常运行。',
    context: '紫微垣以北天宫廷组织星官。勾陈一是今天的北极星，但星名不等于天极。对比公元1000年与今天，可观察它到天极的距离变化；现有星官名称并非所选年代的星图复原。',
    explore: '探索紫微垣', now: '回到今天',
  },
};
export function getPrecessionCopy(language: AppLanguage) { return copy[language]; }
