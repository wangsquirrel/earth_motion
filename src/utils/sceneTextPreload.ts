import { SCENE_LABEL_FONT_URL } from '../components/scene/sceneLabel.constants';
import { getDirectionLabels, getLanguageCopy, getLocalizedBodyLabel, getMonthLabels, type AppLanguage } from './i18n';
import { warmupTroikaFont } from './troikaText';

const BODY_NAMES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
const LANGUAGES: AppLanguage[] = ['zh-CN', 'en'];
const COMMON_STAR_LABELS = [
  '北极星',
  '天狼星',
  '参宿四',
  '织女一',
  '河鼓二',
  '天津四',
  'Polaris',
  'Sirius',
  'Betelgeuse',
  'Vega',
  'Altair',
  'Deneb',
];
const COMMON_WESTERN_SYSTEM_LABELS = [
  '白羊座',
  '金牛座',
  '双子座',
  '巨蟹座',
  '狮子座',
  '处女座',
  '天秤座',
  '天蝎座',
  '射手座',
  '摩羯座',
  '水瓶座',
  '双鱼座',
  '小熊座',
  '大熊座',
  '猎户座',
  '天鹰座',
  '天鹅座',
  '天琴座',
  '室女座',
  '人马座',
  '南鱼座',
  '蝘蜓座',
  '蝎虎座',
];
const COMMON_GREEK_GLYPHS = ['αβγδεζηθικλμνξοπρστυφχψω'];

function collectUniqueCharacters(values: string[]) {
  return [...new Set(values.join(''))].join('');
}

export const SCENE_TEXT_PRELOAD_CHARACTERS = collectUniqueCharacters([
  ...COMMON_STAR_LABELS,
  ...COMMON_WESTERN_SYSTEM_LABELS,
  ...COMMON_GREEK_GLYPHS,
  ...LANGUAGES.flatMap((language) => [
    ...getDirectionLabels(language),
    ...getMonthLabels(language),
    getLanguageCopy(language).scene.zenith,
    getLanguageCopy(language).scene.celestialEquator,
    ...BODY_NAMES.map((body) => getLocalizedBodyLabel(body, language)),
  ]),
]);

export function warmupSceneText() {
  return warmupTroikaFont(SCENE_LABEL_FONT_URL, SCENE_TEXT_PRELOAD_CHARACTERS);
}
