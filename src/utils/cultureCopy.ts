import type { AppLanguage } from './i18n';

const copy = {
  'zh-CN': {
    title: '三垣二十八宿', subtitle: '循着星光，读一段中国星空文化',
    search: '查找星官、恒星或西方专名', searchPlaceholder: '试试：参宿、织女、Vega', all: '全部',
    intro: '三垣与二十八宿提供传统星空的组织框架。四象各含七宿；这不是把天空均分为二十八份，也不等同于现代西方星座。',
    legend: '带金点的条目可圈选代表星；其余条目提供文化分组和来源。',
    mansion: '宿', enclosure: '垣', asterism: '星官', order: '本象第',
    sample: '代表星 · 中西对照', sampleNote: '金色圆环只标记本卡已核实的示例恒星，不是整个星区、宿界或完整成员表。',
    emptyMapping: '本版尚未标定这宿的代表星。可阅读分组和来源；星图不会绘制未经核实的范围或连线。',
    emptySearch: '没有找到匹配项。试试中文星名或 Vega、Altair。',
    select: '选择一垣、一宿或星官，查看文化说明和中西星名对照。',
    hide: '清除高亮', showStars: '开启恒星显示', hiddenStars: '恒星图层已关闭，高亮也已隐藏。',
    horizon: '地平以下的星不会显示；可调整时间、地点，或切换天球参考系查看。',
    celestial: '拖动天球寻找金色圆环；高亮与当前星图使用同一颗恒星、同一组坐标。',
    western: '当前为西方星图。金色圆环仍标记同一批恒星，便于比较命名。',
    sources: '来源与边界', history: '这是现代教学导览，采用现代常用中西星名对应和项目既有 J2000 坐标，不复原某一朝代的完整星图。历代星官、增星与连线存在差异。',
    structure: '“宿”可指天区及其同名星官；“星官”是传统命名的星群。现代 IAU 星座是划定边界的天区，两者不能简单一对一翻译。',
    open: '展开文化探索', close: '收起文化探索', previous: '上一项', next: '下一项',
  },
  en: {
    title: '三垣二十八宿', subtitle: 'Explore the Chinese cultural sky',
    search: 'Find an asterism, star or Western name', searchPlaceholder: 'Try 参宿, 织女 or Vega', all: 'All',
    intro: 'Three Enclosures and Twenty-eight Mansions organize the traditional sky. Each of the four symbols has seven mansions. These are not equal slices or equivalents of modern Western constellations.',
    legend: 'A gold dot marks entries with reference-star highlights. Other entries provide their cultural group and sources.',
    mansion: 'Mansion', enclosure: 'Enclosure', asterism: 'Asterism', order: 'Order in symbol: ',
    sample: 'Reference stars · compare names', sampleNote: 'Gold rings mark only the verified example stars on this card, not region boundaries or a complete membership list.',
    emptyMapping: 'Reference stars for this mansion are not mapped in this edition. Explore its group and sources; no speculative boundary or lines are drawn.',
    emptySearch: 'No matches. Try a Chinese star name, Vega or Altair.',
    select: 'Choose an enclosure, mansion or asterism to explore its context and compare star names.',
    hide: 'Clear highlight', showStars: 'Show stars', hiddenStars: 'The star layer and its highlights are hidden.',
    horizon: 'Stars below the horizon stay hidden. Change time or location, or use the celestial frame.',
    celestial: 'Rotate the sphere to find the gold rings. They use the same stars and coordinates as the chart.',
    western: 'Western chart selected. Gold rings still identify the same stars for comparison.',
    sources: 'Sources & scope', history: 'A modern teaching guide using commonly used star-name correspondences and the project’s existing J2000 coordinates, not a reconstruction of any one historical atlas. Membership, added stars and lines differ across periods.',
    structure: 'A mansion may refer to a sky region or its namesake asterism. Chinese asterisms are named star groups; modern IAU constellations are bounded regions, not one-to-one translations.',
    open: 'Open culture explorer', close: 'Close culture explorer', previous: 'Previous entry', next: 'Next entry',
  },
} as const;

export function getCultureCopy(language: AppLanguage) { return copy[language]; }
