import type { AppLanguage } from '../utils/i18n';

type LocalizedText = Record<AppLanguage, string>;
export type CultureGroupId = 'enclosures' | 'dragon' | 'tortoise' | 'tiger' | 'bird' | 'stories';

export interface CultureStarReference {
  id: string;
  chineseName: string;
  designation: string;
  properName?: string;
}

export interface CultureEntry {
  id: string;
  name: string;
  kind: 'enclosure' | 'mansion' | 'asterism';
  group: CultureGroupId;
  order?: number;
  summary?: LocalizedText;
  sourceScope?: LocalizedText;
  /** Explicitly sourced examples, never a claim to outline the entire region. */
  stars: readonly CultureStarReference[];
  sourceIds: readonly (keyof typeof CULTURE_SOURCES)[];
}

export const CULTURE_SOURCES = {
  glossary: {
    label: '香港太空馆 · 中国星区与星官',
    url: 'https://hk.space.museum/tc/web/spm/resources/teachers-corner/constellations-and-myths/glossary-of-chinese-star-regions-asterisms-and-star-names.html',
  },
  starNames: {
    label: '台北市立天文科学教育馆 · 2017 天文年鉴恒星表',
    url: 'https://www-ws.gov.taipei/001/Upload/439/relfile/21703/3425086/1869002a-73be-4e12-b106-0f90810cca99.pdf',
  },
  qingMansionAnchors: {
    label: '台北天文馆 ·《臺北星空》97期 · 清代距星对照（第19页）',
    url: 'https://www-ws.gov.taipei/001/Upload/439/ckfile/92363ff3-5fed-4804-a365-632641a49c8c.pdf#page=4',
  },
  seasons: {
    label: '香港太空馆 · 四季星空',
    url: 'https://hk.space.museum/tc/web/spm/resources/teachers-corner/starry-sky-of-the-four-seasons.html',
  },
  iau: {
    label: 'IAU · The Constellations',
    url: 'https://iauarchive.eso.org/public/themes/constellations/',
  },
  mansions: {
    label: '故宫博物院 · 二十八宿',
    url: 'https://www.dpm.org.cn/lemmas/244773.html',
  },
  pleiades: {
    label: '中国科学院新疆天文台 · 昴宿星团',
    url: 'https://www.xao.cas.cn/xwdt/kxpj/202404/t20240426_7135728.html',
  },
} as const;

export const CULTURE_GROUPS: readonly { id: CultureGroupId; name: string; description: LocalizedText; color: string }[] = [
  { id: 'enclosures', name: '三垣', color: '#d8b4fe', description: { 'zh-CN': '从宫廷、朝政到市井，读懂星空中的人间秩序。', en: 'Explore the court, government and marketplace imagined in the sky.' } },
  { id: 'dragon', name: '东方青龙', color: '#6ee7b7', description: { 'zh-CN': '角、亢、氐、房、心、尾、箕。方位是传统分组，不代表此刻的地平方位。', en: 'Seven mansions of the eastern symbol. This is a cultural direction, not their current compass bearing.' } },
  { id: 'tortoise', name: '北方玄武', color: '#93c5fd', description: { 'zh-CN': '斗、牛、女、虚、危、室、壁。结合时间和地点，观察它们的周日运动。', en: 'Seven northern-symbol mansions. Change time and location to explore the rotating sky.' } },
  { id: 'tiger', name: '西方白虎', color: '#e2e8f0', description: { 'zh-CN': '奎、娄、胃、昴、毕、觜、参。从熟悉的亮星进入传统星空。', en: 'Seven western-symbol mansions. Begin with familiar bright stars and compare their names.' } },
  { id: 'bird', name: '南方朱雀', color: '#fda4af', description: { 'zh-CN': '井、鬼、柳、星、张、翼、轸。每一宿是理解更广泛星官分布的入口。', en: 'Seven southern-symbol mansions, each an entry point to a wider set of asterisms.' } },
  { id: 'stories', name: '星官拾趣', color: '#fcd34d', description: { 'zh-CN': '同一片天空，不同的命名与想象。', en: 'Shared stars, different cultural interpretations.' } },
];

const reference = (token: string, chineseName: string, designation: string, properName?: string): CultureStarReference => ({
  id: `star:bayer:${token}`, chineseName, designation, properName,
});
const polaris = reference('alpha-umi', '勾陈一（今北极星）', 'α UMi', 'Polaris');
const vega = reference('alpha-lyr', '织女一', 'α Lyr', 'Vega');
const altair = reference('alpha-aql', '河鼓二', 'α Aql', 'Altair');

// Individually checked against the Qing-period distance-star table, not inferred from constellation names.
const qingMansionExamples: Record<string, readonly CultureStarReference[]> = {
  kang: [reference('kappa-vir', '亢宿一', 'κ Vir')],
  shi: [reference('alpha-peg', '室宿一', 'α Peg', 'Markab')],
  'bi-wall': [reference('gamma-peg', '壁宿一', 'γ Peg')],
  zi: [reference('lambda-ori', '觜宿一', 'λ Ori', 'Meissa')],
  jing: [reference('mu-gem', '井宿一', 'μ Gem')],
  xing: [reference('alpha-hya', '星宿一', 'α Hya', 'Alphard')],
};

const qingMansionScope: LocalizedText = {
  'zh-CN': '本卡星名对应依据《臺北星空》97期的清代距星对照表。“距星”是传统表示天体入宿度的参照星；这里仅用作代表星，不据此复原历代宿界、成员或连线。',
  en: 'This star-name match follows the Qing-period determinative-star table in 臺北星空 no. 97. A determinative star served as a reference for expressing celestial positions. Here it is an example star, not a reconstruction of historical boundaries, membership or lines.',
};

const mansionExamples: Record<string, readonly CultureStarReference[]> = {
  ...qingMansionExamples,
  jiao: [reference('alpha-vir', '角宿一', 'α Vir', 'Spica')],
  xin: [reference('alpha-sco', '心宿二', 'α Sco', 'Antares')],
  mao: [reference('eta-tau', '昴宿六', 'η Tau', 'Alcyone')],
  bi: [reference('alpha-tau', '毕宿五', 'α Tau', 'Aldebaran')],
  shen: [reference('alpha-ori', '参宿四', 'α Ori', 'Betelgeuse')],
};

const mansionSummaries: Record<string, LocalizedText> = {
  kang: { 'zh-CN': '亢宿属于东方青龙。以亢宿一为入口，可在现代室女座内找到这颗恒星，比较同一星光在两套命名体系中的称呼。', en: 'Part of the eastern symbol. 亢宿一 is also κ Vir in modern Virgo, a starting point for comparing names for the same star.' },
  shi: { 'zh-CN': '室宿属于北方玄武。代表星室宿一，也就是现代飞马座的 Markab；一颗入口星并不代表整宿的范围。', en: 'Part of the northern symbol. 室宿一 is Markab in modern Pegasus, a reference point rather than the extent of the mansion.' },
  'bi-wall': { 'zh-CN': '壁宿属于北方玄武。壁宿一位于现代飞马座，可与室宿一对照寻找；这里保留两宿各自的传统名称。', en: 'Part of the northern symbol. 壁宿一 is γ Peg in modern Pegasus. Compare it with 室宿一 while keeping the two traditional mansion names distinct.' },
  zi: { 'zh-CN': '觜读作 zī，属于西方白虎。觜宿一是现代猎户座中的 λ Ori；它与参宿的代表星同在这片现代星座天区，却属于不同的宿。', en: 'Pronounced zī and part of the western symbol. 觜宿一 is λ Ori in modern Orion. It shares that modern constellation with the reference star of 参, while belonging to a different mansion.' },
  jing: { 'zh-CN': '井宿属于南方朱雀。井宿一是现代双子座的 μ Gem，从这颗星可以开始对照传统井宿与现代星座的命名。', en: 'Part of the southern symbol. 井宿一 is μ Gem in modern Gemini, an entry point for comparing traditional and modern star names.' },
  xing: { 'zh-CN': '星宿是南方朱雀七宿之一。这里的“星”是宿名；代表星星宿一，也是现代长蛇座的亮星 Alphard。', en: 'One of the southern symbol’s seven mansions. 星 is this mansion’s name; its reference star 星宿一 is Alphard in modern Hydra.' },
  jiao: { 'zh-CN': '从角宿一开始认识东方青龙。换用现代星座名称，它位于室女座；这里比较的是同一颗星的称呼，而不是两片相等的星区。', en: 'Start with 角宿一 in the eastern symbol. It is also Spica in modern Virgo: two names for a star, not two equal sky regions.' },
  xin: { 'zh-CN': '心宿属于东方青龙。心宿二的红色十分醒目，古称“大火”，也就是现代天蝎座中的 Antares。', en: 'The reddish 心宿二, historically called 大火, is Antares in modern Scorpius.' },
  mao: { 'zh-CN': '昴宿的亮星聚集在 M45 昴宿星团。肉眼能辨认的颗数，会随光害、天气和视力而变；本页用昴宿六作为入口。', en: 'These stars lie in the Pleiades cluster, M45. The number visible to the eye depends on conditions; 昴宿六 is our reference point.' },
  bi: { 'zh-CN': '毕宿属于西方白虎。橙红色的毕宿五，也是在现代金牛座内很醒目的一颗亮星。', en: 'Part of the western symbol. Orange-red 毕宿五 is also the conspicuous Aldebaran in modern Taurus.' },
  shen: { 'zh-CN': '参读作 shēn。传统参宿与现代猎户座共享一些醒目的恒星。本页先从参宿四开始对照，不把两者的成员和范围画等号。', en: 'Pronounced shēn. This traditional grouping shares prominent stars with modern Orion. Start with 参宿四 without equating the two systems.' },
};

const mansionRows = [
  ['dragon', ['jiao', 'kang', 'di', 'fang', 'xin', 'wei', 'ji'], '角亢氐房心尾箕'],
  ['tortoise', ['dou', 'niu', 'nv', 'xu', 'wei-roof', 'shi', 'bi-wall'], '斗牛女虚危室壁'],
  ['tiger', ['kui', 'lou', 'wei-stomach', 'mao', 'bi', 'zi', 'shen'], '奎娄胃昴毕觜参'],
  ['bird', ['jing', 'gui', 'liu', 'xing', 'zhang', 'yi', 'zhen'], '井鬼柳星张翼轸'],
] as const;

export const CHINESE_SKY_ENTRIES: readonly CultureEntry[] = [
  {
    id: 'ziwei', name: '紫微垣', kind: 'enclosure', group: 'enclosures', stars: [polaris], sourceIds: ['glossary', 'starNames'],
    summary: { 'zh-CN': '以北天的宫廷意象组织星官。这里用勾陈一作观星入口；它是今天的北极星，但不等于北天极，古今极星也并非不变。', en: 'A northern celestial court. 勾陈一 is a useful starting point: today’s Polaris is close to, but not exactly at, the north celestial pole.' },
  },
  {
    id: 'taiwei', name: '太微垣', kind: 'enclosure', group: 'enclosures', stars: [reference('beta-leo', '五帝座一', 'β Leo', 'Denebola')], sourceIds: ['glossary', 'starNames'],
    summary: { 'zh-CN': '星官名称体现朝廷与官署。五帝座一可帮助定位这片星区，但单颗代表星不能代替整个垣的范围。', en: 'Its names evoke the imperial administration. 五帝座一 is a reference star, not the extent of the enclosure.' },
  },
  {
    id: 'tianshi', name: '天市垣', kind: 'enclosure', group: 'enclosures', stars: [reference('alpha-her', '帝座', 'α Her', 'Rasalgethi')], sourceIds: ['glossary', 'starNames'],
    summary: { 'zh-CN': '将市井活动写入星空：帝座、列肆、市楼等星官共同构成天上的市场意象。', en: 'A celestial marketplace, with asterisms named for a throne, shops and market offices.' },
  },
  ...mansionRows.flatMap(([group, ids, names]) => ids.map((id, index): CultureEntry => ({
    id, name: `${names[index]}宿`, kind: 'mansion', group, order: index + 1,
    summary: mansionSummaries[id], stars: mansionExamples[id] ?? [],
    sourceScope: qingMansionExamples[id] ? qingMansionScope : undefined,
    sourceIds: qingMansionExamples[id] ? ['glossary', 'qingMansionAnchors'] : id === 'mao' ? ['glossary', 'starNames', 'pleiades'] : mansionExamples[id] ? ['glossary', 'starNames', 'seasons'] : ['glossary', 'mansions'],
  }))),
  {
    id: 'beidou', name: '北斗', kind: 'asterism', group: 'stories', sourceIds: ['glossary', 'starNames', 'seasons'],
    stars: [reference('alpha-uma', '天枢', 'α UMa'), reference('beta-uma', '天璇', 'β UMa'), reference('gamma-uma', '天玑', 'γ UMa'), reference('delta-uma', '天权', 'δ UMa'), reference('epsilon-uma', '玉衡', 'ε UMa'), reference('zeta-uma', '开阳', 'ζ UMa'), reference('eta-uma', '摇光', 'η UMa')],
    summary: { 'zh-CN': '七颗亮星组成熟悉的斗形，位于现代大熊座之内。北斗只是其中的一组星，不能与整个大熊座画等号。', en: 'Seven stars trace the familiar dipper inside modern Ursa Major. The asterism is only part of that constellation.' },
  },
  {
    id: 'zhinu', name: '织女', kind: 'asterism', group: 'stories', stars: [vega], sourceIds: ['glossary', 'starNames'],
    summary: { 'zh-CN': '织女一是天琴座的亮星 Vega。星官名称与七夕传说相连，这里只标记已核实的代表星。', en: '织女一 is Vega in Lyra. Its traditional name also connects the starry sky with the Qixi story.' },
  },
  {
    id: 'hegu', name: '河鼓', kind: 'asterism', group: 'stories', stars: [altair], sourceIds: ['glossary', 'starNames'],
    summary: { 'zh-CN': '河鼓二是 Altair，俗称牛郎星。河鼓与牛宿是不同的星官，不应把牛郎星直接标成牛宿。', en: '河鼓二 is Altair, popularly associated with the Cowherd. 河鼓 and the mansion’s namesake asterism 牛 are distinct.' },
  },
];

const entriesById = new Map(CHINESE_SKY_ENTRIES.map((entry) => [entry.id, entry]));
export function getCultureEntry(id: string | null): CultureEntry | undefined {
  return id ? entriesById.get(id) : undefined;
}

export function searchCultureEntries(query: string, group?: CultureGroupId) {
  const normalized = query.trim().toLowerCase();
  return CHINESE_SKY_ENTRIES.filter((entry) => (!group || entry.group === group) && (
    !normalized || [entry.name, ...entry.stars.flatMap((star) => [star.chineseName, star.designation, star.properName ?? ''])]
      .join(' ').toLowerCase().includes(normalized)
  ));
}
