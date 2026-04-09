// Star catalog and constellation data
// Designed for extensibility - add stars to CATALOG, define constellations separately
// Data based on Yale Bright Star Catalog and other standard catalogs
import type { AppLanguage } from './i18n';

export type SkyCulture = 'western' | 'chinese';

export interface StarNames {
  chineseAsterism?: string;
  westernProper?: string;
  westernDesignation?: string;
  westernSystemName?: string;
}

export interface ConstellationNames {
  chineseAsterism?: string;
  westernConstellation?: string;
  westernSystemName?: string;
}

export interface StarData {
  id: string;
  names: StarNames;
  raHours: number;
  raMinutes: number;
  raSeconds: number;
  decDegrees: number;
  decMinutes: number;
  decSeconds: number;
  magnitude: number;
  color: string;
  /** Catalog source, e.g. 'common' | 'big-dipper' | 'zodiac' | 'constellation' */
  catalog?: string;
}

export interface ConstellationLine {
  /** Stable star id */
  from: string;
  /** Stable star id */
  to: string;
}

export interface Constellation {
  id: string;
  names: ConstellationNames;
  system: SkyCulture;
  lines: ConstellationLine[];
}

const WESTERN_COMMON_STAR_NAMES: Record<string, string> = {
  'star:bayer:alpha-umi': 'Polaris',
  'star:bayer:alpha-cma': 'Sirius',
  'star:bayer:alpha-ori': 'Betelgeuse',
  'star:bayer:alpha-lyr': 'Vega',
  'star:bayer:alpha-aql': 'Altair',
  'star:bayer:alpha-cyg': 'Deneb',
  'star:bayer:alpha-cmi': 'Procyon',
  'star:bayer:alpha-car': 'Canopus',
  'star:bayer:alpha-boo': 'Arcturus',
  'star:bayer:alpha-vir': 'Spica',
  'star:bayer:alpha-sco': 'Antares',
  'star:bayer:alpha-tau': 'Aldebaran',
  'star:bayer:alpha-psa': 'Fomalhaut',
  'star:bayer:alpha-gem': 'Castor',
  'star:bayer:beta-gem': 'Pollux',
  'star:bayer:alpha-leo': 'Regulus',
  'star:bayer:alpha-cen': 'Rigil Kentaurus',
  'star:bayer:beta-cen': 'Hadar',
};

const GREEK_NAME_BY_TOKEN: Record<string, string> = {
  alpha: 'Alpha',
  beta: 'Beta',
  gamma: 'Gamma',
  delta: 'Delta',
  epsilon: 'Epsilon',
  zeta: 'Zeta',
  eta: 'Eta',
  theta: 'Theta',
  iota: 'Iota',
  kappa: 'Kappa',
  lambda: 'Lambda',
  mu: 'Mu',
  nu: 'Nu',
  xi: 'Xi',
  omicron: 'Omicron',
  pi: 'Pi',
  rho: 'Rho',
  sigma: 'Sigma',
  tau: 'Tau',
  upsilon: 'Upsilon',
  phi: 'Phi',
  chi: 'Chi',
  psi: 'Psi',
  omega: 'Omega',
};

function containsCjk(value: string) {
  return /[\u4e00-\u9fff]/.test(value);
}

function deriveWesternEnglishStarName(star: StarData) {
  if (star.names.westernProper) {
    return star.names.westernProper;
  }

  if (star.names.westernDesignation) {
    return star.names.westernDesignation;
  }

  if (star.names.westernSystemName && !containsCjk(star.names.westernSystemName)) {
    return star.names.westernSystemName;
  }

  if (WESTERN_COMMON_STAR_NAMES[star.id]) {
    return WESTERN_COMMON_STAR_NAMES[star.id];
  }

  const bayerMatch = star.id.match(/^star:bayer:([a-z]+)-([a-z]+)$/);
  if (bayerMatch) {
    const [, greekToken, constellationToken] = bayerMatch;
    return `${GREEK_NAME_BY_TOKEN[greekToken] ?? greekToken} ${constellationToken.toUpperCase()}`;
  }

  const flamsteedMatch = star.id.match(/^star:flamsteed:(\d+)-([a-z]+)$/);
  if (flamsteedMatch) {
    const [, number, constellationToken] = flamsteedMatch;
    return `${number} ${constellationToken.toUpperCase()}`;
  }

  return '';
}

function deriveWesternChineseStarName(star: StarData) {
  return star.names.westernSystemName ?? star.names.chineseAsterism ?? '';
}

export function getStarDisplayName(star: StarData, culture: SkyCulture, language: AppLanguage) {
  if (culture === 'chinese') {
    return star.names.chineseAsterism ?? '';
  }

  return language === 'en'
    ? deriveWesternEnglishStarName(star)
    : deriveWesternChineseStarName(star);
}

// Main star catalog - approximately 200 bright stars
export const CATALOG: StarData[] = [
  // ===== 常用亮星 (Common Bright Stars) =====
  { id: 'star:bayer:alpha-umi', names: { chineseAsterism: '北极星', westernProper: 'Polaris', westernSystemName: '小熊座α' }, raHours: 2, raMinutes: 31, raSeconds: 49.09456, decDegrees: 89, decMinutes: 15, decSeconds: 50.7923, magnitude: 1.98, color: '#d8e6ff', catalog: 'common' },
  { id: 'star:bayer:alpha-cma', names: { chineseAsterism: '天狼星', westernProper: 'Sirius', westernSystemName: '大犬座α' }, raHours: 6, raMinutes: 45, raSeconds: 8.91728, decDegrees: -16, decMinutes: 42, decSeconds: 58.0171, magnitude: -1.46, color: '#e9f4ff', catalog: 'common' },
  { id: 'star:bayer:alpha-ori', names: { chineseAsterism: '参宿四', westernProper: 'Betelgeuse', westernSystemName: '猎户座α' }, raHours: 5, raMinutes: 55, raSeconds: 10.30536, decDegrees: 7, decMinutes: 24, decSeconds: 25.4304, magnitude: 0.42, color: '#ffd1b0', catalog: 'common' },
  { id: 'star:bayer:alpha-lyr', names: { chineseAsterism: '织女星', westernProper: 'Vega', westernSystemName: '天琴座α' }, raHours: 18, raMinutes: 36, raSeconds: 56.33635, decDegrees: 38, decMinutes: 47, decSeconds: 1.2802, magnitude: 0.03, color: '#cfe3ff', catalog: 'common' },
  { id: 'star:bayer:alpha-aql', names: { chineseAsterism: '河鼓二', westernProper: 'Altair', westernSystemName: '天鹰座α' }, raHours: 19, raMinutes: 50, raSeconds: 46.99855, decDegrees: 8, decMinutes: 52, decSeconds: 5.9563, magnitude: 0.77, color: '#fff0d6', catalog: 'common' },
  { id: 'star:bayer:alpha-cyg', names: { chineseAsterism: '天津四', westernProper: 'Deneb', westernSystemName: '天鹅座α' }, raHours: 20, raMinutes: 41, raSeconds: 25.91514, decDegrees: 45, decMinutes: 16, decSeconds: 49.2197, magnitude: 1.25, color: '#eef5ff', catalog: 'common' },
  { id: 'star:bayer:alpha-cmi', names: { chineseAsterism: '南河三', westernProper: 'Procyon', westernSystemName: '小犬座α' }, raHours: 7, raMinutes: 39, raSeconds: 18.1, decDegrees: 5, decMinutes: 13, decSeconds: 30, magnitude: 0.34, color: '#ffe4b5', catalog: 'common' },
  { id: 'star:bayer:alpha-car', names: { chineseAsterism: '老人星', westernProper: 'Canopus', westernSystemName: '船底座α' }, raHours: 6, raMinutes: 23, raSeconds: 57.1, decDegrees: -52, decMinutes: 41, decSeconds: 44, magnitude: -0.72, color: '#ffe4b5', catalog: 'common' },
  { id: 'star:bayer:alpha-boo', names: { chineseAsterism: '大角星', westernProper: 'Arcturus', westernSystemName: '牧夫座α' }, raHours: 14, raMinutes: 16, raSeconds: 22.3, decDegrees: 19, decMinutes: 10, decSeconds: 57, magnitude: -0.05, color: '#ffe4b5', catalog: 'common' },
  { id: 'star:bayer:alpha-vir', names: { chineseAsterism: '角宿一', westernProper: 'Spica', westernSystemName: '室女座α' }, raHours: 13, raMinutes: 25, raSeconds: 11.6, decDegrees: -11, decMinutes: 9, decSeconds: 41, magnitude: 0.97, color: '#b4c8ff', catalog: 'common' },
  { id: 'star:bayer:alpha-sco', names: { chineseAsterism: '心宿二', westernProper: 'Antares', westernSystemName: '天蝎座α' }, raHours: 16, raMinutes: 29, raSeconds: 24.4, decDegrees: -26, decMinutes: 25, decSeconds: 55, magnitude: 1.06, color: '#ff7f50', catalog: 'common' },
  { id: 'star:bayer:alpha-tau', names: { chineseAsterism: '毕宿五', westernProper: 'Aldebaran', westernSystemName: '金牛座α' }, raHours: 4, raMinutes: 35, raSeconds: 55.2, decDegrees: 16, decMinutes: 30, decSeconds: 33, magnitude: 0.85, color: '#ffd699', catalog: 'common' },
  { id: 'star:bayer:alpha-psa', names: { chineseAsterism: '北落师门', westernProper: 'Fomalhaut', westernSystemName: '南鱼座α' }, raHours: 22, raMinutes: 57, raSeconds: 39.0, decDegrees: -29, decMinutes: 37, decSeconds: 20, magnitude: 1.16, color: '#b4c8ff', catalog: 'common' },
  { id: 'star:bayer:alpha-gem', names: { chineseAsterism: '北河二', westernProper: 'Castor', westernSystemName: '双子座α' }, raHours: 7, raMinutes: 34, raSeconds: 36.0, decDegrees: 31, decMinutes: 53, decSeconds: 18, magnitude: 1.58, color: '#ffffff', catalog: 'common' },
  { id: 'star:bayer:beta-gem', names: { chineseAsterism: '北河三', westernProper: 'Pollux', westernSystemName: '双子座β' }, raHours: 7, raMinutes: 45, raSeconds: 18.9, decDegrees: 28, decMinutes: 1, decSeconds: 34, magnitude: 1.14, color: '#ffebcd', catalog: 'common' },
  { id: 'star:bayer:alpha-leo', names: { chineseAsterism: '轩辕十四', westernProper: 'Regulus', westernSystemName: '狮子座α' }, raHours: 10, raMinutes: 8, raSeconds: 22.0, decDegrees: 11, decMinutes: 58, decSeconds: 2, magnitude: 1.35, color: '#d4e5ff', catalog: 'common' },

  // ===== 北斗七星 (Big Dipper) =====
  { id: 'star:bayer:alpha-uma', names: { chineseAsterism: '天枢', westernSystemName: '大熊座α' }, raHours: 11, raMinutes: 3, raSeconds: 43.7, decDegrees: 61, decMinutes: 45, decSeconds: 3, magnitude: 1.79, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:beta-uma', names: { chineseAsterism: '天璇', westernSystemName: '大熊座β' }, raHours: 11, raMinutes: 3, raSeconds: 31.8, decDegrees: 54, decMinutes: 55, decSeconds: 27, magnitude: 2.27, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:gamma-uma', names: { chineseAsterism: '天玑', westernSystemName: '大熊座γ' }, raHours: 11, raMinutes: 53, raSeconds: 59.9, decDegrees: 53, decMinutes: 41, decSeconds: 45, magnitude: 2.44, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:delta-uma', names: { chineseAsterism: '天权', westernSystemName: '大熊座δ' }, raHours: 12, raMinutes: 15, raSeconds: 25.6, decDegrees: 57, decMinutes: 1, decSeconds: 58, magnitude: 3.31, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:epsilon-uma', names: { chineseAsterism: '玉衡', westernSystemName: '大熊座ε' }, raHours: 12, raMinutes: 54, raSeconds: 2.6, decDegrees: 55, decMinutes: 59, decSeconds: 51, magnitude: 1.77, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:zeta-uma', names: { chineseAsterism: '开阳', westernSystemName: '大熊座ζ' }, raHours: 13, raMinutes: 23, raSeconds: 55.5, decDegrees: 54, decMinutes: 55, decSeconds: 31, magnitude: 2.06, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:eta-uma', names: { chineseAsterism: '摇光', westernSystemName: '大熊座η' }, raHours: 13, raMinutes: 47, raSeconds: 32.2, decDegrees: 49, decMinutes: 13, decSeconds: 51, magnitude: 1.86, color: '#ffe4b5', catalog: 'big-dipper' },

  // ===== 黄道星座 (Zodiac Constellations) =====

  // 白羊座 (Aries)
  { id: 'star:bayer:alpha-ari', names: { chineseAsterism: '娄宿一', westernSystemName: '白羊座α' }, raHours: 2, raMinutes: 7, raSeconds: 10.4, decDegrees: 23, decMinutes: 27, decSeconds: 44, magnitude: 2.00, color: '#ffd4a3', catalog: 'zodiac' },
  { id: 'star:bayer:beta-ari', names: { chineseAsterism: '娄宿二', westernSystemName: '白羊座β' }, raHours: 1, raMinutes: 54, raSeconds: 38.7, decDegrees: 20, decMinutes: 48, decSeconds: 29, magnitude: 2.64, color: '#ffd4a3', catalog: 'zodiac' },
  { id: 'star:bayer:gamma-ari', names: { chineseAsterism: '娄宿三', westernSystemName: '白羊座γ' }, raHours: 1, raMinutes: 53, raSeconds: 31.8, decDegrees: 19, decMinutes: 17, decSeconds: 45, magnitude: 4.59, color: '#ffd4a3', catalog: 'zodiac' },

  // 金牛座 (Taurus)
  { id: 'star:custom:昴宿六', names: { chineseAsterism: '昴宿六', westernSystemName: '金牛座η' }, raHours: 3, raMinutes: 47, raSeconds: 29.1, decDegrees: 24, decMinutes: 6, decSeconds: 18, magnitude: 2.87, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:custom:昴宿一', names: { chineseAsterism: '昴宿一', westernSystemName: '金牛座17' }, raHours: 3, raMinutes: 44, raSeconds: 52.5, decDegrees: 24, decMinutes: 28, decSeconds: 2, magnitude: 3.64, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:custom:昴宿二', names: { chineseAsterism: '昴宿二', westernSystemName: '金牛座19' }, raHours: 3, raMinutes: 45, raSeconds: 50.3, decDegrees: 23, decMinutes: 56, decSeconds: 51, magnitude: 4.18, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:custom:昴宿四', names: { chineseAsterism: '昴宿四', westernSystemName: '金牛座20' }, raHours: 3, raMinutes: 49, raSeconds: 13.7, decDegrees: 24, decMinutes: 22, decSeconds: 36, magnitude: 3.88, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:custom:毕宿一', names: { chineseAsterism: '毕宿一', westernSystemName: '金牛座ε' }, raHours: 4, raMinutes: 21, raSeconds: 57.1, decDegrees: 15, decMinutes: 37, decSeconds: 55, magnitude: 3.53, color: '#ffd699', catalog: 'zodiac' },
  { id: 'star:custom:毕宿三', names: { chineseAsterism: '毕宿三', westernSystemName: '金牛座δ' }, raHours: 4, raMinutes: 37, raSeconds: 53.4, decDegrees: 12, decMinutes: 52, decSeconds: 24, magnitude: 4.27, color: '#ffd699', catalog: 'zodiac' },
  { id: 'star:bayer:alpha-aur', names: { chineseAsterism: '五车五', westernSystemName: '御夫座α' }, raHours: 5, raMinutes: 26, raSeconds: 17.5, decDegrees: 28, decMinutes: 36, decSeconds: 21, magnitude: 1.65, color: '#cfe3ff', catalog: 'zodiac' },

  // 双子座 (Gemini)
  { id: 'star:bayer:gamma-gem', names: { chineseAsterism: '井宿五', westernSystemName: '双子座γ' }, raHours: 6, raMinutes: 37, raSeconds: 42.7, decDegrees: 16, decMinutes: 23, decSeconds: 57, magnitude: 1.93, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:bayer:epsilon-gem', names: { chineseAsterism: '井宿四', westernSystemName: '双子座ε' }, raHours: 6, raMinutes: 53, raSeconds: 54.6, decDegrees: 25, decMinutes: 7, decSeconds: 52, magnitude: 2.98, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:bayer:mu-gem', names: { chineseAsterism: '井宿七', westernSystemName: '双子座μ' }, raHours: 6, raMinutes: 22, raSeconds: 57.9, decDegrees: 22, decMinutes: 30, decSeconds: 48, magnitude: 2.87, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:bayer:zeta-gem', names: { chineseAsterism: '井宿六', westernSystemName: '双子座ζ' }, raHours: 7, raMinutes: 10, raSeconds: 55.6, decDegrees: 20, decMinutes: 34, decSeconds: 25, magnitude: 3.28, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:custom:井宿一', names: { chineseAsterism: '井宿一' }, raHours: 6, raMinutes: 31, raSeconds: 42.3, decDegrees: 17, decMinutes: 12, decSeconds: 36, magnitude: 2.69, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:custom:井宿二', names: { chineseAsterism: '井宿二', westernSystemName: '双子座ν' }, raHours: 6, raMinutes: 35, raSeconds: 7.9, decDegrees: 17, decMinutes: 24, decSeconds: 4, magnitude: 3.53, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:custom:井宿三', names: { chineseAsterism: '井宿三' }, raHours: 6, raMinutes: 38, raSeconds: 50.4, decDegrees: 17, decMinutes: 46, decSeconds: 59, magnitude: 3.28, color: '#ffffff', catalog: 'zodiac' },

  // 巨蟹座 (Cancer)
  { id: 'star:custom:柳宿增一', names: { chineseAsterism: '柳宿增一', westernSystemName: '巨蟹座ζ' }, raHours: 8, raMinutes: 58, raSeconds: 29.2, decDegrees: 23, decMinutes: 25, decSeconds: 55, magnitude: 4.24, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:bayer:delta-cnc', names: { chineseAsterism: '鬼宿四', westernSystemName: '巨蟹座δ' }, raHours: 8, raMinutes: 44, raSeconds: 46.8, decDegrees: 18, decMinutes: 9, decSeconds: 15, magnitude: 3.94, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:custom:鬼宿三', names: { chineseAsterism: '鬼宿三', westernSystemName: '巨蟹座λ' }, raHours: 8, raMinutes: 51, raSeconds: 57.6, decDegrees: 21, decMinutes: 28, decSeconds: 5, magnitude: 4.73, color: '#e8e8e8', catalog: 'zodiac' },

  // 狮子座 (Leo)
  { id: 'star:custom:轩辕十二', names: { chineseAsterism: '轩辕十二', westernSystemName: '狮子座ζ' }, raHours: 10, raMinutes: 16, raSeconds: 41.4, decDegrees: 19, decMinutes: 50, decSeconds: 29, magnitude: 2.56, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:custom:轩辕十一', names: { chineseAsterism: '轩辕十一', westernSystemName: '狮子座γ' }, raHours: 10, raMinutes: 7, raSeconds: 55.9, decDegrees: 16, decMinutes: 30, decSeconds: 33, magnitude: 3.44, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:custom:五帝座一', names: { chineseAsterism: '五帝座一', westernSystemName: '狮子座β' }, raHours: 11, raMinutes: 49, raSeconds: 51.8, decDegrees: 14, decMinutes: 31, decSeconds: 45, magnitude: 2.14, color: '#fff8f0', catalog: 'zodiac' },
  { id: 'star:custom:轩辕九', names: { chineseAsterism: '轩辕九', westernSystemName: '狮子座μ' }, raHours: 9, raMinutes: 45, raSeconds: 51.2, decDegrees: 6, decMinutes: 25, decSeconds: 58, magnitude: 3.44, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:custom:轩辕八', names: { chineseAsterism: '轩辕八', westernSystemName: '狮子座λ' }, raHours: 9, raMinutes: 27, raSeconds: 40.1, decDegrees: 6, decMinutes: 21, decSeconds: 29, magnitude: 3.0, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:custom:太微右垣一', names: { chineseAsterism: '太微右垣一', westernSystemName: '室女座β' }, raHours: 11, raMinutes: 21, raSeconds: 31.8, decDegrees: 10, decMinutes: 47, decSeconds: 38, magnitude: 4.98, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:custom:太微左垣一', names: { chineseAsterism: '太微左垣一', westernSystemName: '室女座η' }, raHours: 10, raMinutes: 33, raSeconds: 0.5, decDegrees: 9, decMinutes: 54, decSeconds: 43, magnitude: 4.47, color: '#d4e5ff', catalog: 'zodiac' },

  // 处女座 (Virgo)
  { id: 'star:custom:东上相', names: { chineseAsterism: '东上相', westernSystemName: '室女座γ' }, raHours: 13, raMinutes: 34, raSeconds: 46.1, decDegrees: -1, decMinutes: 26, decSeconds: 58, magnitude: 2.74, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:custom:东次相', names: { chineseAsterism: '东次相', westernSystemName: '室女座δ' }, raHours: 13, raMinutes: 42, raSeconds: 28.6, decDegrees: -0, decMinutes: 35, decSeconds: 19, magnitude: 3.79, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:custom:角宿二', names: { chineseAsterism: '角宿二', westernSystemName: '室女座ζ' }, raHours: 13, raMinutes: 2, raSeconds: 17.6, decDegrees: -0, decMinutes: 35, decSeconds: 45, magnitude: 3.65, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:custom:天坏', names: { chineseAsterism: '天坏', westernSystemName: '室女座ι' }, raHours: 12, raMinutes: 41, raSeconds: 13.2, decDegrees: -1, decMinutes: 50, decSeconds: 16, magnitude: 4.06, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:custom:招摇', names: { chineseAsterism: '招摇', westernSystemName: '室女座ο' }, raHours: 14, raMinutes: 29, raSeconds: 43.1, decDegrees: 2, decMinutes: 5, decSeconds: 49, magnitude: 3.44, color: '#b4c8ff', catalog: 'zodiac' },

  // 天秤座 (Libra)
  { id: 'star:custom:氐宿四', names: { chineseAsterism: '氐宿四', westernSystemName: '天秤座β' }, raHours: 14, raMinutes: 50, raSeconds: 52.8, decDegrees: -15, decMinutes: 43, decSeconds: 29, magnitude: 2.61, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:custom:氐宿一', names: { chineseAsterism: '氐宿一', westernSystemName: '天秤座α' }, raHours: 14, raMinutes: 41, raSeconds: 59.0, decDegrees: -15, decMinutes: 40, decSeconds: 44, magnitude: 3.25, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:sigma-lib', names: { chineseAsterism: '氐宿增七', westernSystemName: '天秤座σ' }, raHours: 15, raMinutes: 28, raSeconds: 5.7, decDegrees: -25, decMinutes: 16, decSeconds: 54, magnitude: 3.25, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:custom:氐宿二', names: { chineseAsterism: '氐宿二', westernSystemName: '天秤座ι' }, raHours: 14, raMinutes: 49, raSeconds: 32.8, decDegrees: -20, decMinutes: 4, decSeconds: 35, magnitude: 2.81, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:custom:氐宿三', names: { chineseAsterism: '氐宿三', westernSystemName: '天秤座γ' }, raHours: 15, raMinutes: 1, raSeconds: 25.5, decDegrees: -18, decMinutes: 9, decSeconds: 35, magnitude: 4.86, color: '#d4e5ff', catalog: 'zodiac' },

  // 天蝎座 (Scorpius)
  { id: 'star:custom:尾宿二', names: { chineseAsterism: '尾宿二', westernSystemName: '天蝎座λ' }, raHours: 16, raMinutes: 21, raSeconds: 11.3, decDegrees: -25, decMinutes: 36, decSeconds: 48, magnitude: 2.32, color: '#ff7f50', catalog: 'zodiac' },
  { id: 'star:custom:尾宿一', names: { chineseAsterism: '尾宿一', westernSystemName: '天蝎座μ' }, raHours: 17, raMinutes: 12, raSeconds: 19.2, decDegrees: -22, decMinutes: 1, decSeconds: 17, magnitude: 2.64, color: '#ff7f50', catalog: 'zodiac' },
  { id: 'star:custom:尾宿八', names: { chineseAsterism: '尾宿八', westernSystemName: '天蝎座ζ' }, raHours: 17, raMinutes: 42, raSeconds: 29.3, decDegrees: -34, decMinutes: 17, decSeconds: 47, magnitude: 2.62, color: '#ffb07c', catalog: 'zodiac' },
  { id: 'star:custom:房宿四', names: { chineseAsterism: '房宿四', westernSystemName: '天蝎座β' }, raHours: 16, raMinutes: 1, raSeconds: 37.9, decDegrees: -25, decMinutes: 20, decSeconds: 12, magnitude: 2.62, color: '#ff7f50', catalog: 'zodiac' },
  { id: 'star:custom:钩铃一', names: { chineseAsterism: '钩铃一', westernSystemName: '天蝎座π' }, raHours: 16, raMinutes: 8, raSeconds: 22.9, decDegrees: -28, decMinutes: 0, decSeconds: 42, magnitude: 2.87, color: '#ff7f50', catalog: 'zodiac' },

  // 射手座 (Sagittarius)
  { id: 'star:bayer:epsilon-sgr', names: { chineseAsterism: '斗宿二', westernSystemName: '人马座ε' }, raHours: 18, raMinutes: 21, raSeconds: 35.0, decDegrees: -25, decMinutes: 25, decSeconds: 28, magnitude: 1.98, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:custom:箕宿一', names: { chineseAsterism: '箕宿一', westernSystemName: '人马座γ' }, raHours: 18, raMinutes: 55, raSeconds: 15.9, decDegrees: -30, decMinutes: 12, decSeconds: 19, magnitude: 2.82, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:bayer:lambda-sgr', names: { chineseAsterism: '斗宿一', westernSystemName: '人马座λ' }, raHours: 18, raMinutes: 5, raSeconds: 19.1, decDegrees: -24, decMinutes: 52, decSeconds: 57, magnitude: 3.17, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:custom:斗宿三', names: { chineseAsterism: '斗宿三', westernSystemName: '人马座φ' }, raHours: 18, raMinutes: 40, raSeconds: 13.6, decDegrees: -23, decMinutes: 55, decSeconds: 2, magnitude: 2.7, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:custom:箕宿三', names: { chineseAsterism: '箕宿三', westernSystemName: '人马座δ' }, raHours: 19, raMinutes: 2, raSeconds: 58.1, decDegrees: -30, decMinutes: 25, decSeconds: 20, magnitude: 3.12, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:custom:建宿一', names: { chineseAsterism: '建宿一', westernSystemName: '人马座ξ' }, raHours: 19, raMinutes: 23, raSeconds: 18.7, decDegrees: -29, decMinutes: 42, decSeconds: 17, magnitude: 3.54, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:custom:天渊一', names: { chineseAsterism: '天渊一' }, raHours: 18, raMinutes: 27, raSeconds: 52.8, decDegrees: -29, decMinutes: 52, decSeconds: 45, magnitude: 3.84, color: '#ffe4b5', catalog: 'zodiac' },

  // 摩羯座 (Capricornus)
  { id: 'star:custom:牛宿一', names: { chineseAsterism: '牛宿一', westernSystemName: '摩羯座β' }, raHours: 21, raMinutes: 27, raSeconds: 58.1, decDegrees: -12, decMinutes: 30, decSeconds: 29, magnitude: 3.77, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:custom:垒壁阵四', names: { chineseAsterism: '垒壁阵四', westernSystemName: '摩羯座κ' }, raHours: 22, raMinutes: 5, raSeconds: 51.8, decDegrees: -21, decMinutes: 11, decSeconds: 0, magnitude: 2.87, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:custom:垒壁阵一', names: { chineseAsterism: '垒壁阵一', westernSystemName: '摩羯座ι' }, raHours: 21, raMinutes: 43, raSeconds: 36.2, decDegrees: -16, decMinutes: 7, decSeconds: 51, magnitude: 3.58, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:custom:垒壁阵二', names: { chineseAsterism: '垒壁阵二', westernSystemName: '摩羯座γ' }, raHours: 21, raMinutes: 53, raSeconds: 28.1, decDegrees: -14, decMinutes: 46, decSeconds: 41, magnitude: 4.3, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:bayer:alpha-cap', names: { chineseAsterism: '牛宿增一', westernSystemName: '摩羯座α' }, raHours: 20, raMinutes: 17, raSeconds: 59.7, decDegrees: -12, decMinutes: 30, decSeconds: 30, magnitude: 4.52, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:custom:右旗一', names: { chineseAsterism: '右旗一', westernSystemName: '天鹰座ρ' }, raHours: 20, raMinutes: 8, raSeconds: 33.7, decDegrees: -16, decMinutes: 8, decSeconds: 47, magnitude: 3.77, color: '#e8e8e8', catalog: 'zodiac' },

  // 水瓶座 (Aquarius)
  { id: 'star:custom:危宿一', names: { chineseAsterism: '危宿一' }, raHours: 22, raMinutes: 28, raSeconds: 52.0, decDegrees: -0, decMinutes: 19, decSeconds: 1, magnitude: 3.27, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:custom:虚宿一', names: { chineseAsterism: '虚宿一' }, raHours: 22, raMinutes: 46, raSeconds: 32.4, decDegrees: -10, decMinutes: 49, decSeconds: 14, magnitude: 3.27, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:beta-aqr', names: { westernSystemName: '宝瓶座β' }, raHours: 21, raMinutes: 31, raSeconds: 33.5, decDegrees: -5, decMinutes: 34, decSeconds: 16, magnitude: 2.91, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:alpha-aqr', names: { westernSystemName: '宝瓶座α' }, raHours: 22, raMinutes: 6, raSeconds: 19.6, decDegrees: -0, decMinutes: 19, decSeconds: 12, magnitude: 2.96, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:delta-aqr', names: { westernSystemName: '宝瓶座δ' }, raHours: 22, raMinutes: 54, raSeconds: 37.2, decDegrees: -16, decMinutes: 13, decSeconds: 33, magnitude: 3.27, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:custom:坟墓一', names: { chineseAsterism: '坟墓一', westernSystemName: '宝瓶座ζ' }, raHours: 22, raMinutes: 23, raSeconds: 23.4, decDegrees: -10, decMinutes: 41, decSeconds: 50, magnitude: 3.97, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:custom:女宿一', names: { chineseAsterism: '女宿一', westernSystemName: '宝瓶座ε' }, raHours: 23, raMinutes: 6, raSeconds: 44.3, decDegrees: -7, decMinutes: 46, decSeconds: 59, magnitude: 3.77, color: '#b4c8ff', catalog: 'zodiac' },

  // 双鱼座 (Pisces)
  { id: 'star:custom:右更二', names: { chineseAsterism: '右更二' }, raHours: 1, raMinutes: 2, raSeconds: 53.6, decDegrees: 2, decMinutes: 45, decSeconds: 44, magnitude: 4.34, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:custom:外屏七', names: { chineseAsterism: '外屏七', westernSystemName: '双鱼座ν' }, raHours: 0, raMinutes: 26, raSeconds: 45.6, decDegrees: 5, decMinutes: 36, decSeconds: 51, magnitude: 4.27, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:eta-psc', names: { westernSystemName: '双鱼座η' }, raHours: 1, raMinutes: 31, raSeconds: 29.0, decDegrees: 15, decMinutes: 20, decSeconds: 49, magnitude: 3.62, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:gamma-psc', names: { westernSystemName: '双鱼座γ' }, raHours: 23, raMinutes: 17, raSeconds: 7.9, decDegrees: 1, decMinutes: 16, decSeconds: 24, magnitude: 3.69, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:custom:右更一', names: { chineseAsterism: '右更一', westernSystemName: '双鱼座ο' }, raHours: 1, raMinutes: 14, raSeconds: 8.3, decDegrees: 6, decMinutes: 44, decSeconds: 0, magnitude: 4.94, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:custom:外屏一', names: { chineseAsterism: '外屏一', westernSystemName: '双鱼座δ' }, raHours: 23, raMinutes: 55, raSeconds: 59.6, decDegrees: 2, decMinutes: 55, decSeconds: 22, magnitude: 4.5, color: '#b4c8ff', catalog: 'zodiac' },

  // ===== 其他重要星座 (Other Major Constellations) =====

  // 猎户座 (Orion)
  // Verified: 觜宿一 = λ Orionis (Meissa)
  { id: 'star:bayer:lambda-ori', names: { chineseAsterism: '觜宿一', westernProper: 'Meissa', westernSystemName: '猎户座λ' }, raHours: 5, raMinutes: 35, raSeconds: 8.3, decDegrees: 9, decMinutes: 56, decSeconds: 2.9, magnitude: 3.47, color: '#d8e6ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-ori', names: { chineseAsterism: '参宿七', westernSystemName: '猎户座β' }, raHours: 5, raMinutes: 14, raSeconds: 32.3, decDegrees: -8, decMinutes: 12, decSeconds: 5.9, magnitude: 0.12, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-ori', names: { chineseAsterism: '参宿三', westernSystemName: '猎户座ε' }, raHours: 5, raMinutes: 31, raSeconds: 38.4, decDegrees: -1, decMinutes: 12, decSeconds: 6.9, magnitude: 1.77, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-ori', names: { chineseAsterism: '参宿二', westernSystemName: '猎户座δ' }, raHours: 5, raMinutes: 32, raSeconds: 0.4, decDegrees: -0, decMinutes: 17, decSeconds: 46.9, magnitude: 1.69, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:zeta-ori', names: { chineseAsterism: '参宿一', westernSystemName: '猎户座ζ' }, raHours: 5, raMinutes: 40, raSeconds: 45.5, decDegrees: -1, decMinutes: 56, decSeconds: 33.8, magnitude: 1.74, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-ori', names: { chineseAsterism: '参宿五', westernSystemName: '猎户座γ' }, raHours: 5, raMinutes: 26, raSeconds: 17.5, decDegrees: 6, decMinutes: 20, decSeconds: 58.9, magnitude: 1.64, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:参宿六', names: { chineseAsterism: '参宿六', westernProper: 'Saiph', westernSystemName: '猎户座κ' }, raHours: 5, raMinutes: 47, raSeconds: 45.4, decDegrees: -9, decMinutes: 40, decSeconds: 10.6, magnitude: 2.06, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:参旗一', names: { chineseAsterism: '参旗一' }, raHours: 6, raMinutes: 12, raSeconds: 3.6, decDegrees: -0, decMinutes: 18, decSeconds: 20.6, magnitude: 3.65, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:参旗二', names: { chineseAsterism: '参旗二' }, raHours: 6, raMinutes: 21, raSeconds: 22.1, decDegrees: 1, decMinutes: 8, decSeconds: 53.2, magnitude: 4.22, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:参旗三', names: { chineseAsterism: '参旗三' }, raHours: 6, raMinutes: 24, raSeconds: 29.4, decDegrees: 2, decMinutes: 9, decSeconds: 41.5, magnitude: 4.31, color: '#b4c8ff', catalog: 'constellation' },

  // 大犬座 (Canis Major)
  { id: 'star:custom:弧矢七', names: { chineseAsterism: '弧矢七' }, raHours: 7, raMinutes: 8, raSeconds: 23.5, decDegrees: -26, decMinutes: 23, decSeconds: 14.7, magnitude: 1.5, color: '#e9f4ff', catalog: 'constellation' },
  { id: 'star:custom:弧矢一', names: { chineseAsterism: '弧矢一' }, raHours: 7, raMinutes: 16, raSeconds: 35.7, decDegrees: -30, decMinutes: 3, decSeconds: 2.5, magnitude: 2.45, color: '#e9f4ff', catalog: 'constellation' },
  { id: 'star:custom:军市一', names: { chineseAsterism: '军市一' }, raHours: 7, raMinutes: 1, raSeconds: 55.3, decDegrees: -26, decMinutes: 21, decSeconds: 53.2, magnitude: 3.46, color: '#e9f4ff', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-cma', names: { westernSystemName: '大犬座ε' }, raHours: 6, raMinutes: 58, raSeconds: 37.6, decDegrees: -26, decMinutes: 55, decSeconds: 35.8, magnitude: 1.5, color: '#e9f4ff', catalog: 'constellation' },
  { id: 'star:custom:天狼增四', names: { chineseAsterism: '天狼增四' }, raHours: 6, raMinutes: 35, raSeconds: 11.8, decDegrees: -23, decMinutes: 49, decSeconds: 36.2, magnitude: 4.54, color: '#e9f4ff', catalog: 'constellation' },

  // 小犬座 (Canis Minor)
  { id: 'star:custom:南河一', names: { chineseAsterism: '南河一' }, raHours: 7, raMinutes: 20, raSeconds: 23.4, decDegrees: 5, decMinutes: 14, decSeconds: 53.1, magnitude: 2.9, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:南河二', names: { chineseAsterism: '南河二' }, raHours: 7, raMinutes: 27, raSeconds: 6.1, decDegrees: 1, decMinutes: 48, decSeconds: 57.6, magnitude: 3.92, color: '#ffe4b5', catalog: 'constellation' },

  // 御夫座 (Auriga)
  { id: 'star:custom:五车二', names: { chineseAsterism: '五车二' }, raHours: 5, raMinutes: 17, raSeconds: 9.4, decDegrees: 45, decMinutes: 59, decSeconds: 53, magnitude: 0.08, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:五车三', names: { chineseAsterism: '五车三' }, raHours: 5, raMinutes: 59, raSeconds: 31.9, decDegrees: 53, decMinutes: 4, decSeconds: 39, magnitude: 1.58, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:五车一', names: { chineseAsterism: '五车一' }, raHours: 4, raMinutes: 57, raSeconds: 46.8, decDegrees: 43, decMinutes: 8, decSeconds: 59, magnitude: 2.63, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:五车四', names: { chineseAsterism: '五车四' }, raHours: 6, raMinutes: 37, raSeconds: 42.7, decDegrees: 45, decMinutes: 56, decSeconds: 36, magnitude: 0.96, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:iota-aur', names: { westernSystemName: '御夫座ι' }, raHours: 4, raMinutes: 56, raSeconds: 59.5, decDegrees: 33, decMinutes: 9, decSeconds: 48, magnitude: 2.69, color: '#ffe4b5', catalog: 'constellation' },

  // 金牛座 (Taurus) - already have some
  { id: 'star:custom:天关', names: { chineseAsterism: '天关' }, raHours: 5, raMinutes: 35, raSeconds: 15.4, decDegrees: 21, decMinutes: 8, decSeconds: 22, magnitude: 3.8, color: '#ffd699', catalog: 'constellation' },
  { id: 'star:custom:毕宿增七', names: { chineseAsterism: '毕宿增七' }, raHours: 4, raMinutes: 45, raSeconds: 46.6, decDegrees: 18, decMinutes: 8, decSeconds: 49, magnitude: 4.91, color: '#ffd699', catalog: 'constellation' },
  { id: 'star:custom:天廪增二', names: { chineseAsterism: '天廪增二' }, raHours: 4, raMinutes: 31, raSeconds: 33.5, decDegrees: 18, decMinutes: 37, decSeconds: 15, magnitude: 4.94, color: '#ffd699', catalog: 'constellation' },

  // 双子座 (Gemini) - already have some
  { id: 'star:custom:井宿四', names: { }, raHours: 6, raMinutes: 44, raSeconds: 40.1, decDegrees: 16, decMinutes: 23, decSeconds: 46, magnitude: 3.53, color: '#ffffff', catalog: 'constellation' },
  { id: 'star:custom:井宿五', names: { }, raHours: 6, raMinutes: 50, raSeconds: 31.1, decDegrees: 12, decMinutes: 41, decSeconds: 55, magnitude: 3.28, color: '#ffffff', catalog: 'constellation' },
  { id: 'star:custom:井宿六', names: { }, raHours: 6, raMinutes: 54, raSeconds: 36.9, decDegrees: 16, decMinutes: 23, decSeconds: 57, magnitude: 3.28, color: '#ffffff', catalog: 'constellation' },
  { id: 'star:custom:井宿七', names: { }, raHours: 7, raMinutes: 0, raSeconds: 18.7, decDegrees: 14, decMinutes: 29, decSeconds: 58, magnitude: 3.82, color: '#ffffff', catalog: 'constellation' },
  { id: 'star:custom:井宿八', names: { chineseAsterism: '井宿八' }, raHours: 7, raMinutes: 8, raSeconds: 23.5, decDegrees: 13, decMinutes: 46, decSeconds: 29, magnitude: 3.96, color: '#ffffff', catalog: 'constellation' },

  // 室女座 (Virgo) - already have some
  { id: 'star:custom:东次将', names: { chineseAsterism: '东次将' }, raHours: 13, raMinutes: 57, raSeconds: 35.1, decDegrees: 2, decMinutes: 36, decSeconds: 52, magnitude: 3.37, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:亢宿二', names: { chineseAsterism: '亢宿二' }, raHours: 12, raMinutes: 55, raSeconds: 24.8, decDegrees: -1, decMinutes: 30, decSeconds: 3, magnitude: 3.44, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:亢宿一', names: { chineseAsterism: '亢宿一' }, raHours: 12, raMinutes: 30, raSeconds: 58.1, decDegrees: 1, decMinutes: 8, decSeconds: 8, magnitude: 3.35, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:太微右垣二', names: { chineseAsterism: '太微右垣二' }, raHours: 11, raMinutes: 31, raSeconds: 47.1, decDegrees: 1, decMinutes: 45, decSeconds: 22, magnitude: 4.83, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:太微左垣二', names: { chineseAsterism: '太微左垣二' }, raHours: 10, raMinutes: 28, raSeconds: 40.7, decDegrees: 1, decMinutes: 50, decSeconds: 57, magnitude: 3.51, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:太微左垣三', names: { chineseAsterism: '太微左垣三' }, raHours: 11, raMinutes: 10, raSeconds: 0.8, decDegrees: 1, decMinutes: 45, decSeconds: 44, magnitude: 4.73, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:太微左垣四', names: { chineseAsterism: '太微左垣四' }, raHours: 11, raMinutes: 47, raSeconds: 44.8, decDegrees: 3, decMinutes: 20, decSeconds: 31, magnitude: 3.49, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:太微左垣五', names: { chineseAsterism: '太微左垣五' }, raHours: 12, raMinutes: 10, raSeconds: 29.2, decDegrees: 1, decMinutes: 44, decSeconds: 30, magnitude: 3.42, color: '#b4c8ff', catalog: 'constellation' },

  // 牧夫座 (Boötes)
  { id: 'star:custom:贯索四', names: { chineseAsterism: '贯索四' }, raHours: 15, raMinutes: 28, raSeconds: 37.3, decDegrees: 33, decMinutes: 18, decSeconds: 17, magnitude: 2.37, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:七公六', names: { chineseAsterism: '七公六' }, raHours: 15, raMinutes: 3, raSeconds: 47.8, decDegrees: 40, decMinutes: 35, decSeconds: 50, magnitude: 4.46, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:招摇-2', names: { }, raHours: 14, raMinutes: 29, raSeconds: 43.1, decDegrees: 37, decMinutes: 23, decSeconds: 40, magnitude: 3.53, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:kappa-boo', names: { westernSystemName: '牧夫座κ' }, raHours: 14, raMinutes: 13, raSeconds: 29.0, decDegrees: 51, decMinutes: 47, decSeconds: 15, magnitude: 4.54, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:候', names: { chineseAsterism: '候' }, raHours: 14, raMinutes: 45, raSeconds: 40.0, decDegrees: 25, decMinutes: 40, decSeconds: 12, magnitude: 2.7, color: '#ffe4b5', catalog: 'constellation' },

  // 天琴座 (Lyra)
  { id: 'star:custom:织女二', names: { westernSystemName: '织女二', chineseAsterism: '织女二' }, raHours: 18, raMinutes: 43, raSeconds: 56.5, decDegrees: 33, decMinutes: 21, decSeconds: 23, magnitude: 4.3, color: '#cfe3ff', catalog: 'constellation' },
  { id: 'star:custom:织女一', names: { westernSystemName: '织女一', chineseAsterism: '织女一' }, raHours: 18, raMinutes: 44, raSeconds: 20.3, decDegrees: 32, decMinutes: 41, decSeconds: 36, magnitude: 4.34, color: '#cfe3ff', catalog: 'constellation' },
  { id: 'star:custom:渐台二', names: { westernSystemName: '渐台二', chineseAsterism: '渐台二' }, raHours: 18, raMinutes: 45, raSeconds: 42.6, decDegrees: 33, decMinutes: 21, decSeconds: 53, magnitude: 3.47, color: '#cfe3ff', catalog: 'constellation' },
  { id: 'star:custom:辇道一', names: { westernSystemName: '辇道一', chineseAsterism: '辇道一' }, raHours: 18, raMinutes: 53, raSeconds: 24.9, decDegrees: 33, decMinutes: 17, decSeconds: 21, magnitude: 4.23, color: '#cfe3ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-lyr', names: { westernSystemName: '天琴座δ' }, raHours: 18, raMinutes: 53, raSeconds: 3.7, decDegrees: 36, decMinutes: 58, decSeconds: 43, magnitude: 4.22, color: '#cfe3ff', catalog: 'constellation' },

  // 天鹅座 (Cygnus)
  { id: 'star:custom:天津一', names: { westernSystemName: '天津一', chineseAsterism: '天津一' }, raHours: 20, raMinutes: 22, raSeconds: 13.7, decDegrees: 40, decMinutes: 15, decSeconds: 24, magnitude: 2.23, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:custom:天津九', names: { westernSystemName: '天津九', chineseAsterism: '天津九' }, raHours: 19, raMinutes: 44, raSeconds: 22.1, decDegrees: 45, decMinutes: 7, decSeconds: 51, magnitude: 2.48, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:custom:天津二', names: { westernSystemName: '天津二', chineseAsterism: '天津二' }, raHours: 19, raMinutes: 50, raSeconds: 46.99855, decDegrees: 45, decMinutes: 7, decSeconds: 52, magnitude: 2.87, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:custom:天津八', names: { westernSystemName: '天津八', chineseAsterism: '天津八' }, raHours: 19, raMinutes: 36, raSeconds: 42.5, decDegrees: 46, decMinutes: 32, decSeconds: 16, magnitude: 2.23, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:custom:辇道增七', names: { westernSystemName: '辇道增七', chineseAsterism: '辇道增七' }, raHours: 19, raMinutes: 30, raSeconds: 43.4, decDegrees: 45, decMinutes: 7, decSeconds: 59, magnitude: 3.08, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:bayer:chi-cyg', names: { westernSystemName: '天鹅座χ' }, raHours: 19, raMinutes: 50, raSeconds: 34.8, decDegrees: 32, decMinutes: 54, decSeconds: 53, magnitude: 3.32, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:custom:天津五', names: { westernSystemName: '天津五', chineseAsterism: '天津五' }, raHours: 20, raMinutes: 13, raSeconds: 36.0, decDegrees: 40, decMinutes: 15, decSeconds: 19, magnitude: 2.87, color: '#eef5ff', catalog: 'constellation' },

  // 天鹰座 (Aquila)
  { id: 'star:custom:河鼓一', names: { westernSystemName: '河鼓一', chineseAsterism: '河鼓一' }, raHours: 19, raMinutes: 55, raSeconds: 16.6, decDegrees: 11, decMinutes: 56, decSeconds: 39, magnitude: 3.71, color: '#fff0d6', catalog: 'constellation' },
  { id: 'star:custom:河鼓三', names: { westernSystemName: '河鼓三', chineseAsterism: '河鼓三' }, raHours: 20, raMinutes: 1, raSeconds: 47.0, decDegrees: 14, decMinutes: 2, decSeconds: 2, magnitude: 2.72, color: '#fff0d6', catalog: 'constellation' },
  // Verified: 天市左垣六 = ζ Aquilae
  { id: 'star:bayer:zeta-aql', names: { chineseAsterism: '天市左垣六', westernProper: 'Deneb el Okab', westernSystemName: '天鹰座ζ' }, raHours: 19, raMinutes: 5, raSeconds: 24.3, decDegrees: 13, decMinutes: 51, decSeconds: 49, magnitude: 2.99, color: '#fff0d6', catalog: 'constellation' },
  { id: 'star:bayer:theta-aql', names: { westernSystemName: '天鹰座θ' }, raHours: 20, raMinutes: 11, raSeconds: 19.2, decDegrees: 0, decMinutes: 49, decSeconds: 17, magnitude: 3.22, color: '#fff0d6', catalog: 'constellation' },
  { id: 'star:bayer:delta-aql', names: { westernSystemName: '天鹰座δ' }, raHours: 19, raMinutes: 25, raSeconds: 29.9, decDegrees: 3, decMinutes: 6, decSeconds: 53, magnitude: 3.35, color: '#fff0d6', catalog: 'constellation' },
  { id: 'star:custom:右旗三', names: { chineseAsterism: '右旗三' }, raHours: 18, raMinutes: 59, raSeconds: 3.6, decDegrees: 4, decMinutes: 52, decSeconds: 6, magnitude: 4.02, color: '#fff0d6', catalog: 'constellation' },

  // 飞马座 (Pegasus)
  { id: 'star:custom:室宿一', names: { chineseAsterism: '室宿一' }, raHours: 23, raMinutes: 4, raSeconds: 45.6, decDegrees: 15, decMinutes: 12, decSeconds: 19, magnitude: 2.49, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:custom:壁宿一', names: { chineseAsterism: '壁宿一' }, raHours: 23, raMinutes: 28, raSeconds: 47.6, decDegrees: 3, decMinutes: 19, decSeconds: 55, magnitude: 2.93, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:custom:壁宿二', names: { chineseAsterism: '壁宿二' }, raHours: 23, raMinutes: 43, raSeconds: 18.9, decDegrees: 3, decMinutes: 24, decSeconds: 33, magnitude: 2.83, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:eta-peg', names: { westernSystemName: '飞马座η' }, raHours: 22, raMinutes: 43, raSeconds: 0.3, decDegrees: 30, decMinutes: 13, decSeconds: 18, magnitude: 2.93, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:zeta-peg', names: { westernSystemName: '飞马座ζ' }, raHours: 22, raMinutes: 52, raSeconds: 2.1, decDegrees: 10, decMinutes: 48, decSeconds: 49, magnitude: 3.4, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:mu-peg', names: { westernSystemName: '飞马座μ' }, raHours: 23, raMinutes: 0, raSeconds: 17.1, decDegrees: 21, decMinutes: 30, decSeconds: 29, magnitude: 3.48, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:custom:雷神太子上', names: { chineseAsterism: '雷神太子上' }, raHours: 22, raMinutes: 54, raSeconds: 38.4, decDegrees: 33, decMinutes: 43, decSeconds: 19, magnitude: 4.53, color: '#ff9f7f', catalog: 'constellation' },

  // 仙女座 (Andromeda)
  { id: 'star:custom:壁宿二-2', names: { }, raHours: 23, raMinutes: 4, raSeconds: 31.8, decDegrees: 42, decMinutes: 35, decSeconds: 37, magnitude: 2.06, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:奎宿九', names: { chineseAsterism: '奎宿九' }, raHours: 1, raMinutes: 9, raSeconds: 43.1, decDegrees: 35, decMinutes: 37, decSeconds: 12, magnitude: 2.17, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:天大将军一', names: { chineseAsterism: '天大将军一' }, raHours: 1, raMinutes: 6, raSeconds: 36.4, decDegrees: 35, decMinutes: 13, decSeconds: 43, magnitude: 2.26, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-and', names: { westernSystemName: '仙女座δ' }, raHours: 0, raMinutes: 22, raSeconds: 31.6, decDegrees: 30, decMinutes: 52, decSeconds: 5, magnitude: 3.28, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:pi-and', names: { westernSystemName: '仙女座π' }, raHours: 0, raMinutes: 36, raSeconds: 22.8, decDegrees: 33, decMinutes: 43, decSeconds: 7, magnitude: 4.36, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:天大将军六', names: { chineseAsterism: '天大将军六' }, raHours: 1, raMinutes: 20, raSeconds: 0.6, decDegrees: 35, decMinutes: 37, decSeconds: 39, magnitude: 4.88, color: '#b4c8ff', catalog: 'constellation' },

  // 英仙座 (Perseus)
  // Verified: Mirfak = α Persei = 天船三; Algol = β Persei = 大陵五
  { id: 'star:bayer:alpha-per', names: { chineseAsterism: '天船三', westernProper: 'Mirfak', westernSystemName: '英仙座α' }, raHours: 3, raMinutes: 24, raSeconds: 19.4, decDegrees: 49, decMinutes: 51, decSeconds: 40, magnitude: 1.79, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:大陵五', names: { chineseAsterism: '大陵五', westernProper: 'Algol', westernSystemName: '英仙座β' }, raHours: 3, raMinutes: 8, raSeconds: 10.1, decDegrees: 40, decMinutes: 57, decSeconds: 21, magnitude: 2.12, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-per', names: { westernSystemName: '英仙座ε' }, raHours: 3, raMinutes: 57, raSeconds: 51.4, decDegrees: 40, decMinutes: 0, decSeconds: 36, magnitude: 2.89, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-per', names: { westernSystemName: '英仙座ζ' }, raHours: 3, raMinutes: 54, raSeconds: 22.6, decDegrees: 31, decMinutes: 53, decSeconds: 16, magnitude: 4.04, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:天船二', names: { chineseAsterism: '天船二' }, raHours: 2, raMinutes: 50, raSeconds: 33.4, decDegrees: 40, decMinutes: 26, decSeconds: 51, magnitude: 4.15, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:卷舌二', names: { chineseAsterism: '卷舌二' }, raHours: 3, raMinutes: 10, raSeconds: 56.6, decDegrees: 38, decMinutes: 40, decSeconds: 6, magnitude: 4.37, color: '#ffe4b5', catalog: 'constellation' },

  // 仙王座 (Cepheus)
  { id: 'star:custom:天枢', names: {}, raHours: 22, raMinutes: 29, raSeconds: 49.5, decDegrees: 62, decMinutes: 35, decSeconds: 12, magnitude: 3.52, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-cep', names: { westernSystemName: '仙王座β' }, raHours: 21, raMinutes: 28, raSeconds: 43.2, decDegrees: 70, decMinutes: 33, decSeconds: 38, magnitude: 3.23, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-cep', names: { westernSystemName: '仙王座γ' }, raHours: 23, raMinutes: 3, raSeconds: 53.1, decDegrees: 56, decMinutes: 59, decSeconds: 26, magnitude: 3.22, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:delta-cep', names: { westernSystemName: '仙王座δ' }, raHours: 22, raMinutes: 29, raSeconds: 17.1, decDegrees: 58, decMinutes: 24, decSeconds: 50, magnitude: 4.07, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-cep', names: { westernSystemName: '仙王座ζ' }, raHours: 22, raMinutes: 10, raSeconds: 36.3, decDegrees: 57, decMinutes: 59, decSeconds: 51, magnitude: 3.35, color: '#ffe4b5', catalog: 'constellation' },

  // 仙后座 (Cassiopeia)
  { id: 'star:custom:王良一', names: { westernSystemName: '王良一', chineseAsterism: '王良一' }, raHours: 0, raMinutes: 41, raSeconds: 6.4, decDegrees: 60, decMinutes: 43, decSeconds: 0, magnitude: 2.47, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:王良四', names: { westernSystemName: '王良四', chineseAsterism: '王良四' }, raHours: 1, raMinutes: 9, raSeconds: 29.0, decDegrees: 59, decMinutes: 8, decSeconds: 59, magnitude: 2.27, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:王良三', names: { westernSystemName: '王良三', chineseAsterism: '王良三' }, raHours: 0, raMinutes: 55, raSeconds: 0.3, decDegrees: 60, decMinutes: 14, decSeconds: 8, magnitude: 2.47, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:王良二', names: { westernSystemName: '王良二', chineseAsterism: '王良二' }, raHours: 0, raMinutes: 47, raSeconds: 12.5, decDegrees: 59, decMinutes: 29, decSeconds: 41, magnitude: 3.37, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:策', names: { westernSystemName: '策', chineseAsterism: '策' }, raHours: 1, raMinutes: 3, raSeconds: 54.0, decDegrees: 59, decMinutes: 33, decSeconds: 54, magnitude: 3.37, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:kappa-cas', names: { westernSystemName: '仙后座κ' }, raHours: 0, raMinutes: 32, raSeconds: 59.9, decDegrees: 62, decMinutes: 56, decSeconds: 3, magnitude: 4.16, color: '#ffe4b5', catalog: 'constellation' },

  // 鹿豹座 (Camelopardalis)
  { id: 'star:bayer:alpha-cam', names: { westernSystemName: '鹿豹座α' }, raHours: 4, raMinutes: 54, raSeconds: 3.0, decDegrees: 66, decMinutes: 22, decSeconds: 47, magnitude: 4.29, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-cam', names: { westernSystemName: '鹿豹座β' }, raHours: 5, raMinutes: 3, raSeconds: 25.4, decDegrees: 60, decMinutes: 26, decSeconds: 32, magnitude: 4.03, color: '#e8e8e8', catalog: 'constellation' },

  // 猎犬座 (Canes Venatici)
  { id: 'star:bayer:alpha-cvn', names: { westernSystemName: '猎犬座α' }, raHours: 12, raMinutes: 56, raSeconds: 0.0, decDegrees: 38, decMinutes: 19, decSeconds: 6, magnitude: 2.89, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-cvn', names: { westernSystemName: '猎犬座β' }, raHours: 12, raMinutes: 33, raSeconds: 54.4, decDegrees: 41, decMinutes: 21, decSeconds: 24, magnitude: 4.24, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:常陈一', names: { chineseAsterism: '常陈一' }, raHours: 12, raMinutes: 37, raSeconds: 33.5, decDegrees: 45, decMinutes: 28, decSeconds: 9, magnitude: 2.89, color: '#ffe4b5', catalog: 'constellation' },

  // 室女座 (Coma Berenices)
  { id: 'star:custom:太微左垣五-2', names: { }, raHours: 12, raMinutes: 10, raSeconds: 29.2, decDegrees: 28, decMinutes: 1, decSeconds: 16, magnitude: 3.44, color: '#b4c8ff', catalog: 'constellation' },

  // 后发座 (Coma Berenices)
  { id: 'star:bayer:beta-com', names: { westernSystemName: '后发座β' }, raHours: 13, raMinutes: 11, raSeconds: 52.4, decDegrees: 27, decMinutes: 52, decSeconds: 50, magnitude: 4.24, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:alpha-com', names: { westernSystemName: '后发座α' }, raHours: 13, raMinutes: 6, raSeconds: 27.3, decDegrees: 17, decMinutes: 31, decSeconds: 45, magnitude: 4.32, color: '#b4c8ff', catalog: 'constellation' },

  // 巨蛇座 (Serpens)
  { id: 'star:bayer:alpha-ser', names: { westernSystemName: '巨蛇座α' }, raHours: 15, raMinutes: 44, raSeconds: 16.4, decDegrees: 6, decMinutes: 25, decSeconds: 29, magnitude: 2.63, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:delta-ser', names: { westernSystemName: '巨蛇座δ' }, raHours: 15, raMinutes: 34, raSeconds: 53.1, decDegrees: 10, decMinutes: 34, decSeconds: 48, magnitude: 3.8, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-ser', names: { westernSystemName: '巨蛇座ε' }, raHours: 15, raMinutes: 51, raSeconds: 48.5, decDegrees: 4, decMinutes: 55, decSeconds: 42, magnitude: 3.69, color: '#ffe4b5', catalog: 'constellation' },

  // 蛇夫座 (Ophiuchus)
  // Verified: Rasalhague = α Ophiuchi = 侯
  { id: 'star:bayer:alpha-oph', names: { chineseAsterism: '侯', westernProper: 'Rasalhague', westernSystemName: '蛇夫座α' }, raHours: 17, raMinutes: 34, raSeconds: 59.0, decDegrees: 12, decMinutes: 33, decSeconds: 36, magnitude: 2.07, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:宗正一', names: { chineseAsterism: '宗正一' }, raHours: 17, raMinutes: 14, raSeconds: 20.8, decDegrees: 15, decMinutes: 20, decSeconds: 27, magnitude: 2.43, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-oph', names: { westernSystemName: '蛇夫座ζ' }, raHours: 16, raMinutes: 37, raSeconds: 51.4, decDegrees: -10, decMinutes: 33, decSeconds: 51, magnitude: 2.54, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:eta-oph', names: { westernSystemName: '蛇夫座η' }, raHours: 17, raMinutes: 10, raSeconds: 22.7, decDegrees: -15, decMinutes: 43, decSeconds: 30, magnitude: 2.43, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:巴德尔', names: { chineseAsterism: '巴德尔' }, raHours: 18, raMinutes: 31, raSeconds: 50.7, decDegrees: 2, decMinutes: 44, decSeconds: 12, magnitude: 3.0, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:郑', names: { chineseAsterism: '郑' }, raHours: 17, raMinutes: 22, raSeconds: 51.6, decDegrees: 2, decMinutes: 42, decSeconds: 43, magnitude: 3.53, color: '#ffe4b5', catalog: 'constellation' },

  // 武仙座 (Hercules)
  { id: 'star:custom:帝座', names: { chineseAsterism: '帝座' }, raHours: 17, raMinutes: 14, raSeconds: 38.9, decDegrees: 14, decMinutes: 23, decSeconds: 25, magnitude: 2.78, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:天市左垣七', names: { chineseAsterism: '天市左垣七' }, raHours: 16, raMinutes: 30, raSeconds: 13.1, decDegrees: 31, decMinutes: 35, decSeconds: 50, magnitude: 2.93, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-her', names: { westernSystemName: '武仙座β' }, raHours: 16, raMinutes: 43, raSeconds: 49.4, decDegrees: 21, decMinutes: 29, decSeconds: 56, magnitude: 2.77, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-her', names: { westernSystemName: '武仙座γ' }, raHours: 16, raMinutes: 21, raSeconds: 55.5, decDegrees: 19, decMinutes: 9, decSeconds: 15, magnitude: 3.75, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:delta-her', names: { westernSystemName: '武仙座δ' }, raHours: 17, raMinutes: 19, raSeconds: 51.7, decDegrees: 24, decMinutes: 50, decSeconds: 21, magnitude: 3.61, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-her', names: { westernSystemName: '武仙座ζ' }, raHours: 16, raMinutes: 41, raSeconds: 17.2, decDegrees: 31, decMinutes: 36, decSeconds: 22, magnitude: 2.93, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-her', names: { westernSystemName: '武仙座ε' }, raHours: 17, raMinutes: 3, raSeconds: 33.4, decDegrees: 30, decMinutes: 55, decSeconds: 20, magnitude: 3.92, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:pi-her', names: { westernSystemName: '武仙座π' }, raHours: 17, raMinutes: 15, raSeconds: 19.8, decDegrees: 36, decMinutes: 48, decSeconds: 33, magnitude: 3.16, color: '#ffe4b5', catalog: 'constellation' },

  // 天蝎座 (Scorpius) - additional
  { id: 'star:custom:尾宿三', names: { chineseAsterism: '尾宿三' }, raHours: 17, raMinutes: 56, raSeconds: 47.5, decDegrees: -37, decMinutes: 2, decSeconds: 36, magnitude: 2.41, color: '#ff7f50', catalog: 'constellation' },
  { id: 'star:custom:尾宿四', names: { chineseAsterism: '尾宿四' }, raHours: 17, raMinutes: 48, raSeconds: 36.4, decDegrees: -39, decMinutes: 0, decSeconds: 42, magnitude: 2.64, color: '#ff7f50', catalog: 'constellation' },
  { id: 'star:custom:尾宿五', names: { chineseAsterism: '尾宿五' }, raHours: 17, raMinutes: 58, raSeconds: 51.5, decDegrees: -42, decMinutes: 17, decSeconds: 48, magnitude: 2.41, color: '#ff7f50', catalog: 'constellation' },
  { id: 'star:custom:尾宿六', names: { chineseAsterism: '尾宿六' }, raHours: 18, raMinutes: 0, raSeconds: 34.3, decDegrees: -42, decMinutes: 21, decSeconds: 50, magnitude: 2.41, color: '#ff7f50', catalog: 'constellation' },
  { id: 'star:custom:尾宿七', names: { chineseAsterism: '尾宿七' }, raHours: 18, raMinutes: 5, raSeconds: 12.6, decDegrees: -44, decMinutes: 27, decSeconds: 29, magnitude: 2.41, color: '#ff7f50', catalog: 'constellation' },
  { id: 'star:custom:尾宿九', names: { chineseAsterism: '尾宿九' }, raHours: 18, raMinutes: 16, raSeconds: 55.0, decDegrees: -39, decMinutes: 1, decSeconds: 29, magnitude: 2.41, color: '#ff7f50', catalog: 'constellation' },

  // 半人马座 (Centaurus)
  { id: 'star:custom:南门二', names: { westernSystemName: '南门二', chineseAsterism: '南门二' }, raHours: 14, raMinutes: 39, raSeconds: 36.5, decDegrees: -60, decMinutes: 50, decSeconds: 2, magnitude: -0.27, color: '#ffe4b5', catalog: 'constellation' },
  // Verified: 马腹一 = β Centauri (Hadar)
  { id: 'star:bayer:beta-cen', names: { chineseAsterism: '马腹一', westernProper: 'Hadar', westernSystemName: '半人马座β' }, raHours: 14, raMinutes: 3, raSeconds: 49.4, decDegrees: -60, decMinutes: 22, decSeconds: 57, magnitude: 0.61, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-cen', names: { westernSystemName: '半人马座γ' }, raHours: 12, raMinutes: 26, raSeconds: 35.0, decDegrees: -48, decMinutes: 57, decSeconds: 35, magnitude: 2.17, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-cen', names: { westernSystemName: '半人马座ε' }, raHours: 13, raMinutes: 39, raSeconds: 53.3, decDegrees: -53, decMinutes: 38, decSeconds: 4, magnitude: 2.3, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-cen', names: { westernSystemName: '半人马座ζ' }, raHours: 13, raMinutes: 56, raSeconds: 26.5, decDegrees: -47, decMinutes: 10, decSeconds: 22, magnitude: 2.55, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:库楼一', names: { chineseAsterism: '库楼一' }, raHours: 14, raMinutes: 6, raSeconds: 24.0, decDegrees: -60, decMinutes: 48, decSeconds: 48, magnitude: 3.14, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:库楼七', names: { chineseAsterism: '库楼七' }, raHours: 13, raMinutes: 48, raSeconds: 50.6, decDegrees: -52, decMinutes: 54, decSeconds: 36, magnitude: 3.12, color: '#ffe4b5', catalog: 'constellation' },

  // 豺狼座 (Lupus)
  { id: 'star:bayer:alpha-lup', names: { westernSystemName: '豺狼座α' }, raHours: 14, raMinutes: 41, raSeconds: 56.9, decDegrees: -47, decMinutes: 23, decSeconds: 14, magnitude: 2.3, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:beta-lup', names: { westernSystemName: '豺狼座β' }, raHours: 14, raMinutes: 58, raSeconds: 32.5, decDegrees: -43, decMinutes: 8, decSeconds: 2, magnitude: 2.68, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:gamma-lup', names: { westernSystemName: '豺狼座γ' }, raHours: 15, raMinutes: 35, raSeconds: 19.6, decDegrees: -41, decMinutes: 10, decSeconds: 5, magnitude: 2.78, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:delta-lup', names: { westernSystemName: '豺狼座δ' }, raHours: 15, raMinutes: 21, raSeconds: 23.6, decDegrees: -40, decMinutes: 38, decSeconds: 52, magnitude: 3.22, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-lup', names: { westernSystemName: '豺狼座ε' }, raHours: 15, raMinutes: 37, raSeconds: 48.6, decDegrees: -34, decMinutes: 34, decSeconds: 46, magnitude: 3.37, color: '#ff9f7f', catalog: 'constellation' },

  // 天坛座 (Ara)
  { id: 'star:bayer:beta-ara', names: { westernSystemName: '天坛座β' }, raHours: 17, raMinutes: 25, raSeconds: 20.1, decDegrees: -55, decMinutes: 31, decSeconds: 48, magnitude: 2.85, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:alpha-ara', names: { westernSystemName: '天坛座α' }, raHours: 17, raMinutes: 31, raSeconds: 47.0, decDegrees: -49, decMinutes: 52, decSeconds: 45, magnitude: 2.95, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:gamma-ara', names: { westernSystemName: '天坛座γ' }, raHours: 17, raMinutes: 59, raSeconds: 23.1, decDegrees: -56, decMinutes: 22, decSeconds: 40, magnitude: 3.31, color: '#e8e8e8', catalog: 'constellation' },

  // 长蛇座 (Hydra)
  { id: 'star:custom:星宿一', names: { westernSystemName: '星宿一', chineseAsterism: '星宿一' }, raHours: 9, raMinutes: 27, raSeconds: 35.2, decDegrees: -8, decMinutes: 39, decSeconds: 30, magnitude: 1.98, color: '#b4c8ff', catalog: 'constellation' },
  // Verified: 平一 = γ Hydrae; 平二 = π Hydrae
  { id: 'star:bayer:gamma-hya', names: { chineseAsterism: '平一', westernSystemName: '长蛇座γ' }, raHours: 13, raMinutes: 21, raSeconds: 48.5, decDegrees: -23, decMinutes: 10, decSeconds: 23, magnitude: 2.99, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:pi-hya', names: { chineseAsterism: '平二', westernSystemName: '长蛇座π' }, raHours: 14, raMinutes: 26, raSeconds: 56.9, decDegrees: -26, decMinutes: 40, decSeconds: 57, magnitude: 3.27, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:rho-hya', names: { westernSystemName: '长蛇座ρ' }, raHours: 13, raMinutes: 29, raSeconds: 43.8, decDegrees: -23, decMinutes: 34, decSeconds: 38, magnitude: 4.35, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:外厨一', names: { chineseAsterism: '外厨一' }, raHours: 10, raMinutes: 52, raSeconds: 32.5, decDegrees: -24, decMinutes: 43, decSeconds: 26, magnitude: 4.08, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:外厨二', names: { chineseAsterism: '外厨二' }, raHours: 11, raMinutes: 5, raSeconds: 32.2, decDegrees: -27, decMinutes: 3, decSeconds: 30, magnitude: 4.31, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:外厨三', names: { chineseAsterism: '外厨三' }, raHours: 11, raMinutes: 33, raSeconds: 29.0, decDegrees: -26, decMinutes: 22, decSeconds: 22, magnitude: 3.94, color: '#b4c8ff', catalog: 'constellation' },

  // 巨爵座 (Crater)
  { id: 'star:bayer:alpha-crt', names: { westernSystemName: '巨爵座α' }, raHours: 10, raMinutes: 59, raSeconds: 46.7, decDegrees: -22, decMinutes: 14, decSeconds: 31, magnitude: 4.08, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:gamma-crt', names: { westernSystemName: '巨爵座γ' }, raHours: 11, raMinutes: 24, raSeconds: 54.3, decDegrees: -17, decMinutes: 41, decSeconds: 0, magnitude: 4.51, color: '#e8e8e8', catalog: 'constellation' },

  // 乌鸦座 (Corvus)
  { id: 'star:bayer:beta-crv', names: { westernSystemName: '乌鸦座β' }, raHours: 12, raMinutes: 34, raSeconds: 23.1, decDegrees: -23, decMinutes: 23, decSeconds: 30, magnitude: 2.65, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-crv', names: { westernSystemName: '乌鸦座γ' }, raHours: 12, raMinutes: 26, raSeconds: 42.7, decDegrees: -17, decMinutes: 32, decSeconds: 31, magnitude: 2.59, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-crv', names: { westernSystemName: '乌鸦座δ' }, raHours: 12, raMinutes: 29, raSeconds: 51.9, decDegrees: -16, decMinutes: 30, decSeconds: 55, magnitude: 2.94, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-crv', names: { westernSystemName: '乌鸦座ε' }, raHours: 13, raMinutes: 9, raSeconds: 55.0, decDegrees: -22, decMinutes: 37, decSeconds: 7, magnitude: 3.02, color: '#b4c8ff', catalog: 'constellation' },

  // 六分仪座 (Sextans)
  { id: 'star:bayer:alpha-sex', names: { westernSystemName: '六分仪座α' }, raHours: 10, raMinutes: 7, raSeconds: 55.4, decDegrees: -0, decMinutes: 22, decSeconds: 19, magnitude: 4.49, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-sex', names: { westernSystemName: '六分仪座β' }, raHours: 10, raMinutes: 30, raSeconds: 17.5, decDegrees: -0, decMinutes: 24, decSeconds: 58, magnitude: 5.09, color: '#e8e8e8', catalog: 'constellation' },

  // 麒麟座 (Monoceros)
  { id: 'star:bayer:alpha-mon', names: { westernSystemName: '麒麟座α' }, raHours: 7, raMinutes: 41, raSeconds: 14.9, decDegrees: -0, decMinutes: 23, decSeconds: 33, magnitude: 3.93, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:gamma-mon', names: { westernSystemName: '麒麟座γ' }, raHours: 6, raMinutes: 14, raSeconds: 52.9, decDegrees: -6, decMinutes: 49, decSeconds: 36, magnitude: 3.99, color: '#e8e8e8', catalog: 'constellation' },

  // 船帆座 (Vela)
  { id: 'star:custom:天社三', names: { chineseAsterism: '天社三' }, raHours: 9, raMinutes: 44, raSeconds: 12.0, decDegrees: -50, decMinutes: 13, decSeconds: 30, magnitude: 1.83, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:天社一', names: { chineseAsterism: '天社一' }, raHours: 8, raMinutes: 44, raSeconds: 23.7, decDegrees: -54, decMinutes: 42, decSeconds: 0, magnitude: 2.0, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:天社二', names: { chineseAsterism: '天社二' }, raHours: 9, raMinutes: 12, raSeconds: 20.6, decDegrees: -53, decMinutes: 21, decSeconds: 53, magnitude: 1.96, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:海石一', names: { chineseAsterism: '海石一' }, raHours: 8, raMinutes: 29, raSeconds: 48.5, decDegrees: -47, decMinutes: 17, decSeconds: 44, magnitude: 1.83, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:海石增一', names: { chineseAsterism: '海石增一' }, raHours: 8, raMinutes: 37, raSeconds: 39.3, decDegrees: -46, decMinutes: 38, decSeconds: 26, magnitude: 2.5, color: '#ffe4b5', catalog: 'constellation' },

  // 船底座 (Carina)
  { id: 'star:bayer:beta-car', names: { westernSystemName: '船底座β' }, raHours: 9, raMinutes: 13, raSeconds: 12.5, decDegrees: -69, decMinutes: 42, decSeconds: 19, magnitude: 1.7, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:海石二', names: { chineseAsterism: '海石二' }, raHours: 8, raMinutes: 56, raSeconds: 33.6, decDegrees: -62, decMinutes: 30, decSeconds: 24, magnitude: 2.21, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:海石三', names: { chineseAsterism: '海石三' }, raHours: 9, raMinutes: 7, raSeconds: 59.2, decDegrees: -64, decMinutes: 23, decSeconds: 40, magnitude: 3.13, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:海石四', names: { chineseAsterism: '海石四' }, raHours: 9, raMinutes: 31, raSeconds: 50.6, decDegrees: -65, decMinutes: 31, decSeconds: 30, magnitude: 2.77, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-car', names: { westernSystemName: '船底座ε' }, raHours: 8, raMinutes: 22, raSeconds: 32.6, decDegrees: -59, decMinutes: 30, decSeconds: 12, magnitude: 1.86, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:custom:南船五', names: { chineseAsterism: '南船五' }, raHours: 9, raMinutes: 45, raSeconds: 8.8, decDegrees: -51, decMinutes: 57, decSeconds: 55, magnitude: 2.76, color: '#ffe4b5', catalog: 'constellation' },

  // 波江座 (Eridanus)
  { id: 'star:custom:水委一', names: { chineseAsterism: '水委一' }, raHours: 1, raMinutes: 37, raSeconds: 42.9, decDegrees: -57, decMinutes: 14, decSeconds: 12, magnitude: 0.46, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:玉井三', names: { chineseAsterism: '玉井三' }, raHours: 1, raMinutes: 8, raSeconds: 12.8, decDegrees: -57, decMinutes: 2, decSeconds: 13, magnitude: 3.25, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:custom:天园九', names: { chineseAsterism: '天园九' }, raHours: 3, raMinutes: 55, raSeconds: 19.5, decDegrees: -40, decMinutes: 18, decSeconds: 17, magnitude: 3.25, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:theta-eri', names: { westernSystemName: '波江座θ' }, raHours: 2, raMinutes: 58, raSeconds: 15.6, decDegrees: -40, decMinutes: 18, decSeconds: 17, magnitude: 3.2, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:omicron-eri', names: { westernSystemName: '波江座ο' }, raHours: 4, raMinutes: 11, raSeconds: 19.1, decDegrees: -6, decMinutes: 49, decSeconds: 58, magnitude: 4.04, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-eri', names: { westernSystemName: '波江座β' }, raHours: 5, raMinutes: 7, raSeconds: 50.6, decDegrees: -5, decMinutes: 11, decSeconds: 24, magnitude: 2.78, color: '#b4c8ff', catalog: 'constellation' },

  // 天兔座 (Lepus)
  { id: 'star:bayer:alpha-lep', names: { westernSystemName: '天兔座α' }, raHours: 5, raMinutes: 32, raSeconds: 43.8, decDegrees: -17, decMinutes: 49, decSeconds: 22, magnitude: 2.58, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:beta-lep', names: { westernSystemName: '天兔座β' }, raHours: 5, raMinutes: 28, raSeconds: 14.7, decDegrees: -20, decMinutes: 45, decSeconds: 40, magnitude: 2.84, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:gamma-lep', names: { westernSystemName: '天兔座γ' }, raHours: 5, raMinutes: 44, raSeconds: 27.8, decDegrees: -22, decMinutes: 22, decSeconds: 14, magnitude: 3.59, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:delta-lep', names: { westernSystemName: '天兔座δ' }, raHours: 5, raMinutes: 51, raSeconds: 19.5, decDegrees: -21, decMinutes: 54, decSeconds: 6, magnitude: 3.81, color: '#ff9f7f', catalog: 'constellation' },

  // 天鸽座 (Columba)
  { id: 'star:bayer:alpha-col', names: { westernSystemName: '天鸽座α' }, raHours: 5, raMinutes: 39, raSeconds: 38.9, decDegrees: -34, decMinutes: 4, decSeconds: 31, magnitude: 2.65, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-col', names: { westernSystemName: '天鸽座β' }, raHours: 5, raMinutes: 51, raSeconds: 19.6, decDegrees: -35, decMinutes: 46, decSeconds: 5, magnitude: 3.12, color: '#e8e8e8', catalog: 'constellation' },

  // 麒麟座 (Monoceros) - additional
  { id: 'star:custom:参宿增一', names: { chineseAsterism: '参宿增一' }, raHours: 6, raMinutes: 26, raSeconds: 52.7, decDegrees: -10, decMinutes: 16, decSeconds: 29, magnitude: 4.44, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:custom:参宿增二', names: { chineseAsterism: '参宿增二' }, raHours: 6, raMinutes: 28, raSeconds: 39.1, decDegrees: -11, decMinutes: 49, decSeconds: 17, magnitude: 4.96, color: '#e8e8e8', catalog: 'constellation' },

  // 罗盘座 (Pyxis)
  { id: 'star:bayer:alpha-pyx', names: { westernSystemName: '罗盘座α' }, raHours: 8, raMinutes: 43, raSeconds: 35.5, decDegrees: -33, decMinutes: 11, decSeconds: 0, magnitude: 3.68, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-pyx', names: { westernSystemName: '罗盘座β' }, raHours: 8, raMinutes: 26, raSeconds: 39.3, decDegrees: -35, decMinutes: 15, decSeconds: 22, magnitude: 4.28, color: '#e8e8e8', catalog: 'constellation' },

  // 唧筒座 (Antlia)
  { id: 'star:bayer:alpha-ant', names: { westernSystemName: '唧筒座α' }, raHours: 9, raMinutes: 27, raSeconds: 9.5, decDegrees: -30, decMinutes: 38, decSeconds: 14, magnitude: 4.28, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-ant', names: { westernSystemName: '唧筒座β' }, raHours: 9, raMinutes: 33, raSeconds: 0.4, decDegrees: -28, decMinutes: 9, decSeconds: 25, magnitude: 4.53, color: '#e8e8e8', catalog: 'constellation' },

  // 绘架座 (Pictor)
  { id: 'star:bayer:alpha-pic', names: { westernSystemName: '绘架座α' }, raHours: 6, raMinutes: 24, raSeconds: 5.8, decDegrees: -61, decMinutes: 56, decSeconds: 31, magnitude: 3.24, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-pic', names: { westernSystemName: '绘架座β' }, raHours: 5, raMinutes: 51, raSeconds: 33.3, decDegrees: -51, decMinutes: 59, decSeconds: 48, magnitude: 3.86, color: '#e8e8e8', catalog: 'constellation' },

  // 剑鱼座 (Doradus)
  { id: 'star:bayer:alpha-dor', names: { westernSystemName: '剑鱼座α' }, raHours: 4, raMinutes: 33, raSeconds: 57.5, decDegrees: -55, decMinutes: 2, decSeconds: 42, magnitude: 3.27, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-dor', names: { westernSystemName: '剑鱼座β' }, raHours: 5, raMinutes: 33, raSeconds: 37.2, decDegrees: -62, decMinutes: 29, decSeconds: 23, magnitude: 3.76, color: '#e8e8e8', catalog: 'constellation' },

  // 玉夫座 (Sculptor)
  { id: 'star:bayer:alpha-scl', names: { westernSystemName: '玉夫座α' }, raHours: 0, raMinutes: 58, raSeconds: 36.5, decDegrees: -29, decMinutes: 21, decSeconds: 23, magnitude: 4.31, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-scl', names: { westernSystemName: '玉夫座β' }, raHours: 23, raMinutes: 22, raSeconds: 57.3, decDegrees: -37, decMinutes: 48, decSeconds: 56, magnitude: 4.38, color: '#e8e8e8', catalog: 'constellation' },

  // 凤凰座 (Phoenix)
  { id: 'star:bayer:alpha-phe', names: { westernSystemName: '凤凰座α' }, raHours: 0, raMinutes: 26, raSeconds: 17.1, decDegrees: -42, decMinutes: 21, decSeconds: 44, magnitude: 2.39, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-phe', names: { westernSystemName: '凤凰座β' }, raHours: 1, raMinutes: 6, raSeconds: 5.5, decDegrees: -46, decMinutes: 43, decSeconds: 8, magnitude: 3.32, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-phe', names: { westernSystemName: '凤凰座γ' }, raHours: 1, raMinutes: 28, raSeconds: 21.8, decDegrees: -43, decMinutes: 19, decSeconds: 5, magnitude: 3.41, color: '#ffe4b5', catalog: 'constellation' },

  // 印第安座 (Indus)
  { id: 'star:bayer:alpha-ind', names: { westernSystemName: '印第安座α' }, raHours: 20, raMinutes: 37, raSeconds: 49.9, decDegrees: -47, decMinutes: 17, decSeconds: 52, magnitude: 3.11, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-ind', names: { westernSystemName: '印第安座β' }, raHours: 21, raMinutes: 1, raSeconds: 35.2, decDegrees: -58, decMinutes: 27, decSeconds: 16, magnitude: 3.67, color: '#ffe4b5', catalog: 'constellation' },

  // 天鹤座 (Grus)
  { id: 'star:bayer:alpha-gru', names: { westernSystemName: '天鹤座α' }, raHours: 22, raMinutes: 22, raSeconds: 37.5, decDegrees: -40, decMinutes: 57, decSeconds: 52, magnitude: 1.74, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-gru', names: { westernSystemName: '天鹤座β' }, raHours: 22, raMinutes: 42, raSeconds: 2.8, decDegrees: -46, decMinutes: 53, decSeconds: 5, magnitude: 2.04, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-gru', names: { westernSystemName: '天鹤座γ' }, raHours: 21, raMinutes: 53, raSeconds: 55.6, decDegrees: -37, decMinutes: 21, decSeconds: 25, magnitude: 3.01, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-gru', names: { westernSystemName: '天鹤座δ' }, raHours: 22, raMinutes: 29, raSeconds: 49.2, decDegrees: -43, decMinutes: 28, decSeconds: 33, magnitude: 3.97, color: '#b4c8ff', catalog: 'constellation' },

  // 孔雀座 (Pavo)
  { id: 'star:bayer:alpha-pav', names: { westernSystemName: '孔雀座α' }, raHours: 20, raMinutes: 25, raSeconds: 39.2, decDegrees: -56, decMinutes: 44, decSeconds: 6, magnitude: 1.94, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-pav', names: { westernSystemName: '孔雀座β' }, raHours: 20, raMinutes: 44, raSeconds: 39.8, decDegrees: -66, decMinutes: 10, decSeconds: 57, magnitude: 3.31, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-pav', names: { westernSystemName: '孔雀座γ' }, raHours: 21, raMinutes: 26, raSeconds: 26.2, decDegrees: -53, decMinutes: 23, decSeconds: 49, magnitude: 3.26, color: '#b4c8ff', catalog: 'constellation' },

  // 杜鹃座 (Tucana)
  { id: 'star:bayer:alpha-tuc', names: { westernSystemName: '杜鹃座α' }, raHours: 0, raMinutes: 13, raSeconds: 33.2, decDegrees: -60, decMinutes: 49, decSeconds: 14, magnitude: 2.87, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-tuc', names: { westernSystemName: '杜鹃座β' }, raHours: 22, raMinutes: 9, raSeconds: 22.6, decDegrees: -63, decMinutes: 1, decSeconds: 43, magnitude: 3.37, color: '#b4c8ff', catalog: 'constellation' },

  // 飞鱼座 (Volans)
  { id: 'star:bayer:alpha-vol', names: { westernSystemName: '飞鱼座α' }, raHours: 7, raMinutes: 18, raSeconds: 4.6, decDegrees: -66, decMinutes: 23, decSeconds: 46, magnitude: 3.77, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-vol', names: { westernSystemName: '飞鱼座β' }, raHours: 6, raMinutes: 52, raSeconds: 49.2, decDegrees: -68, decMinutes: 30, decSeconds: 29, magnitude: 3.77, color: '#e8e8e8', catalog: 'constellation' },

  // 蝘蜓座 (Chamaeleon)
  { id: 'star:bayer:alpha-cha', names: { westernSystemName: '蝘蜓座α' }, raHours: 10, raMinutes: 42, raSeconds: 57.3, decDegrees: -76, decMinutes: 56, decSeconds: 54, magnitude: 4.07, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-cha', names: { westernSystemName: '蝘蜓座β' }, raHours: 12, raMinutes: 18, raSeconds: 22.8, decDegrees: -79, decMinutes: 3, decSeconds: 10, magnitude: 4.26, color: '#e8e8e8', catalog: 'constellation' },

  // 水蛇座 (Hydrus)
  { id: 'star:bayer:beta-hyi', names: { westernSystemName: '水蛇座β' }, raHours: 0, raMinutes: 25, raSeconds: 46.1, decDegrees: -77, decMinutes: 15, decSeconds: 18, magnitude: 2.8, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:alpha-hyi', names: { westernSystemName: '水蛇座α' }, raHours: 1, raMinutes: 58, raSeconds: 26.6, decDegrees: -61, decMinutes: 34, decSeconds: 16, magnitude: 2.86, color: '#b4c8ff', catalog: 'constellation' },

  // 大麦哲伦云 (LMC) - not a star but included for reference
  // 小麦哲伦云 (SMC) - not a star but included for reference

  // 南三角座 (Triangulum Australe)
  { id: 'star:bayer:alpha-tra', names: { westernSystemName: '南三角座α' }, raHours: 16, raMinutes: 48, raSeconds: 48.4, decDegrees: -69, decMinutes: 1, decSeconds: 39, magnitude: 1.92, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-tra', names: { westernSystemName: '南三角座β' }, raHours: 15, raMinutes: 55, raSeconds: 7.7, decDegrees: -63, decMinutes: 25, decSeconds: 47, magnitude: 2.83, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-tra', names: { westernSystemName: '南三角座γ' }, raHours: 15, raMinutes: 33, raSeconds: 14.8, decDegrees: -68, decMinutes: 40, decSeconds: 57, magnitude: 3.03, color: '#b4c8ff', catalog: 'constellation' },

  // 盾牌座 (Scutum)
  { id: 'star:custom:天弁一', names: { chineseAsterism: '天弁一' }, raHours: 18, raMinutes: 51, raSeconds: 58.3, decDegrees: -10, decMinutes: 47, decSeconds: 20, magnitude: 3.85, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:alpha-sct', names: { westernSystemName: '盾牌座α' }, raHours: 18, raMinutes: 35, raSeconds: 42.5, decDegrees: -8, decMinutes: 11, decSeconds: 51, magnitude: 3.85, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-sct', names: { westernSystemName: '盾牌座β' }, raHours: 18, raMinutes: 44, raSeconds: 23.8, decDegrees: -6, decMinutes: 24, decSeconds: 28, magnitude: 4.22, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-sct', names: { westernSystemName: '盾牌座ζ' }, raHours: 18, raMinutes: 16, raSeconds: 57.5, decDegrees: -9, decMinutes: 12, decSeconds: 47, magnitude: 4.68, color: '#ffe4b5', catalog: 'constellation' },

  // 狐狸座 (Vulpecula)
  { id: 'star:custom:齐增五', names: { chineseAsterism: '齐增五' }, raHours: 19, raMinutes: 28, raSeconds: 57.1, decDegrees: 24, decMinutes: 39, decSeconds: 53, magnitude: 4.44, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:alpha-vul', names: { westernSystemName: '狐狸座α' }, raHours: 19, raMinutes: 29, raSeconds: 3.4, decDegrees: 24, decMinutes: 42, decSeconds: 18, magnitude: 4.44, color: '#e8e8e8', catalog: 'constellation' },

  // 天箭座 (Sagitta)
  { id: 'star:bayer:alpha-sge', names: { westernSystemName: '天箭座α' }, raHours: 19, raMinutes: 40, raSeconds: 45.7, decDegrees: 18, decMinutes: 0, decSeconds: 17, magnitude: 4.37, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-sge', names: { westernSystemName: '天箭座β' }, raHours: 19, raMinutes: 52, raSeconds: 10.2, decDegrees: 17, decMinutes: 29, decSeconds: 39, magnitude: 4.37, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:gamma-sge', names: { westernSystemName: '天箭座γ' }, raHours: 19, raMinutes: 58, raSeconds: 44.6, decDegrees: 19, decMinutes: 29, decSeconds: 27, magnitude: 3.51, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:delta-sge', names: { westernSystemName: '天箭座δ' }, raHours: 19, raMinutes: 47, raSeconds: 42.5, decDegrees: 18, decMinutes: 32, decSeconds: 2, magnitude: 3.82, color: '#e8e8e8', catalog: 'constellation' },

  // 海豚座 (Delphinus)
  { id: 'star:custom:河鼓增一', names: { chineseAsterism: '河鼓增一' }, raHours: 20, raMinutes: 12, raSeconds: 23.9, decDegrees: 16, decMinutes: 7, decSeconds: 56, magnitude: 4.03, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:alpha-del', names: { westernSystemName: '海豚座α' }, raHours: 20, raMinutes: 39, raSeconds: 7.7, decDegrees: 15, decMinutes: 52, decSeconds: 56, magnitude: 3.77, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-del', names: { westernSystemName: '海豚座β' }, raHours: 20, raMinutes: 31, raSeconds: 53.6, decDegrees: 14, decMinutes: 35, decSeconds: 48, magnitude: 3.63, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-del', names: { westernSystemName: '海豚座γ' }, raHours: 20, raMinutes: 45, raSeconds: 31.8, decDegrees: 15, decMinutes: 54, decSeconds: 44, magnitude: 4.27, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-del', names: { westernSystemName: '海豚座δ' }, raHours: 20, raMinutes: 32, raSeconds: 27.5, decDegrees: 11, decMinutes: 22, decSeconds: 45, magnitude: 4.43, color: '#b4c8ff', catalog: 'constellation' },

  // 蝎虎座 (Lacerta)
  { id: 'star:bayer:beta-lac', names: { westernSystemName: '蝎虎座β' }, raHours: 22, raMinutes: 41, raSeconds: 59.2, decDegrees: 52, decMinutes: 13, decSeconds: 58, magnitude: 4.58, color: '#e8e8e8', catalog: 'constellation' },

  // 天猫座 (Lynx)
  { id: 'star:bayer:alpha-lyn', names: { westernSystemName: '天猫座α' }, raHours: 9, raMinutes: 21, raSeconds: 3.3, decDegrees: 61, decMinutes: 28, decSeconds: 59, magnitude: 3.13, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:flamsteed:38-lyn', names: { westernSystemName: '天猫座38' }, raHours: 9, raMinutes: 18, raSeconds: 50.4, decDegrees: 36, decMinutes: 48, decSeconds: 14, magnitude: 3.82, color: '#ffe4b5', catalog: 'constellation' },

  // 小狮座 (Leo Minor)
  { id: 'star:bayer:alpha-lmi', names: { westernSystemName: '小狮座α' }, raHours: 10, raMinutes: 19, raSeconds: 39.6, decDegrees: 37, decMinutes: 0, decSeconds: 17, magnitude: 3.83, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-lmi', names: { westernSystemName: '小狮座β' }, raHours: 10, raMinutes: 28, raSeconds: 0.0, decDegrees: 36, decMinutes: 44, decSeconds: 36, magnitude: 4.21, color: '#e8e8e8', catalog: 'constellation' },

  // 猎犬座 (Canes Venatici) - additional
  { id: 'star:flamsteed:23-cvn', names: { westernSystemName: '猎犬座23' }, raHours: 12, raMinutes: 37, raSeconds: 16.9, decDegrees: 40, decMinutes: 9, decSeconds: 44, magnitude: 4.66, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:flamsteed:24-cvn', names: { westernSystemName: '猎犬座24' }, raHours: 12, raMinutes: 35, raSeconds: 8.0, decDegrees: 48, decMinutes: 56, decSeconds: 45, magnitude: 4.7, color: '#ffe4b5', catalog: 'constellation' },

  // 星座补充 (Additional constellation stars)
  { id: 'star:bayer:alpha-crb', names: { westernSystemName: '北冕座α' }, raHours: 15, raMinutes: 34, raSeconds: 41.4, decDegrees: 26, decMinutes: 42, decSeconds: 39, magnitude: 2.23, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-crb', names: { westernSystemName: '北冕座β' }, raHours: 15, raMinutes: 27, raSeconds: 50.6, decDegrees: 29, decMinutes: 6, decSeconds: 20, magnitude: 3.72, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-crb', names: { westernSystemName: '北冕座γ' }, raHours: 15, raMinutes: 42, raSeconds: 28.7, decDegrees: 26, decMinutes: 17, decSeconds: 48, magnitude: 4.06, color: '#ffe4b5', catalog: 'constellation' },

  { id: 'star:bayer:alpha-cra', names: { westernSystemName: '南冕座α' }, raHours: 18, raMinutes: 36, raSeconds: 48.4, decDegrees: -37, decMinutes: 18, decSeconds: 26, magnitude: 4.1, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-cra', names: { westernSystemName: '南冕座β' }, raHours: 18, raMinutes: 31, raSeconds: 32.2, decDegrees: -39, decMinutes: 20, decSeconds: 7, magnitude: 4.3, color: '#ffe4b5', catalog: 'constellation' },

  { id: 'star:bayer:epsilon-del', names: { westernSystemName: '海豚座ε' }, raHours: 20, raMinutes: 31, raSeconds: 14.5, decDegrees: 11, decMinutes: 30, decSeconds: 12, magnitude: 4.03, color: '#b4c8ff', catalog: 'constellation' },

  { id: 'star:bayer:zeta-sge', names: { westernSystemName: '天箭座ζ' }, raHours: 19, raMinutes: 44, raSeconds: 30.3, decDegrees: 19, decMinutes: 5, decSeconds: 22, magnitude: 5.04, color: '#e8e8e8', catalog: 'constellation' },

  { id: 'star:bayer:alpha-equ', names: { westernSystemName: '小马座α' }, raHours: 21, raMinutes: 13, raSeconds: 53.9, decDegrees: 7, decMinutes: 2, decSeconds: 58, magnitude: 3.92, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-equ', names: { westernSystemName: '小马座β' }, raHours: 21, raMinutes: 0, raSeconds: 55.9, decDegrees: 6, decMinutes: 48, decSeconds: 57, magnitude: 4.35, color: '#e8e8e8', catalog: 'constellation' },

  { id: 'star:flamsteed:6-lac', names: { westernSystemName: '蝎虎座6' }, raHours: 22, raMinutes: 24, raSeconds: 15.9, decDegrees: 43, decMinutes: 7, decSeconds: 38, magnitude: 4.5, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:alpha-lac', names: { westernSystemName: '蝎虎座α' }, raHours: 22, raMinutes: 30, raSeconds: 42.6, decDegrees: 50, decMinutes: 16, decSeconds: 21, magnitude: 3.77, color: '#e8e8e8', catalog: 'constellation' },

  // 天燕座 (Apus)
  { id: 'star:bayer:alpha-aps', names: { westernSystemName: '天燕座α' }, raHours: 14, raMinutes: 47, raSeconds: 51.7, decDegrees: -79, decMinutes: 2, decSeconds: 41, magnitude: 3.83, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-aps', names: { westernSystemName: '天燕座β' }, raHours: 16, raMinutes: 43, raSeconds: 4.7, decDegrees: -77, decMinutes: 31, decSeconds: 29, magnitude: 4.24, color: '#e8e8e8', catalog: 'constellation' },

  // 蝘蜓座 (Chamaeleon) - additional
  { id: 'star:bayer:gamma-cha', names: { westernSystemName: '蝘蜓座γ' }, raHours: 10, raMinutes: 35, raSeconds: 19.2, decDegrees: -78, decMinutes: 36, decSeconds: 47, magnitude: 4.14, color: '#e8e8e8', catalog: 'constellation' },

  // 剑鱼座 (Doradus) - additional
  { id: 'star:bayer:gamma-dor', names: { westernSystemName: '剑鱼座γ' }, raHours: 4, raMinutes: 17, raSeconds: 55.6, decDegrees: -51, decMinutes: 29, decSeconds: 24, magnitude: 4.26, color: '#e8e8e8', catalog: 'constellation' },

  // 天鹤座 (Grus) - additional
  { id: 'star:bayer:epsilon-gru', names: { westernSystemName: '天鹤座ε' }, raHours: 22, raMinutes: 4, raSeconds: 50.2, decDegrees: -51, decMinutes: 19, decSeconds: 1, magnitude: 3.49, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:zeta-gru', names: { westernSystemName: '天鹤座ζ' }, raHours: 21, raMinutes: 9, raSeconds: 42.2, decDegrees: -53, decMinutes: 32, decSeconds: 39, magnitude: 3.95, color: '#b4c8ff', catalog: 'constellation' },

  // 印第安座 (Indus) - additional
  { id: 'star:bayer:gamma-ind', names: { westernSystemName: '印第安座γ' }, raHours: 21, raMinutes: 26, raSeconds: 21.6, decDegrees: -54, decMinutes: 37, decSeconds: 59, magnitude: 4.11, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:delta-ind', names: { westernSystemName: '印第安座δ' }, raHours: 21, raMinutes: 57, raSeconds: 54.3, decDegrees: -55, decMinutes: 0, decSeconds: 39, magnitude: 4.23, color: '#ffe4b5', catalog: 'constellation' },

  // 凤凰座 (Phoenix) - additional
  { id: 'star:bayer:delta-phe', names: { westernSystemName: '凤凰座δ' }, raHours: 1, raMinutes: 15, raSeconds: 48.0, decDegrees: -49, decMinutes: 4, decSeconds: 0, magnitude: 3.93, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-phe', names: { westernSystemName: '凤凰座ε' }, raHours: 0, raMinutes: 9, raSeconds: 25.7, decDegrees: -45, decMinutes: 44, decSeconds: 29, magnitude: 4.42, color: '#ffe4b5', catalog: 'constellation' },

  // 杜鹃座 (Tucana) - additional
  { id: 'star:bayer:gamma-tuc', names: { westernSystemName: '杜鹃座γ' }, raHours: 23, raMinutes: 28, raSeconds: 33.7, decDegrees: -58, decMinutes: 14, decSeconds: 52, magnitude: 3.99, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-tuc', names: { westernSystemName: '杜鹃座δ' }, raHours: 22, raMinutes: 25, raSeconds: 47.1, decDegrees: -64, decMinutes: 49, decSeconds: 51, magnitude: 4.48, color: '#b4c8ff', catalog: 'constellation' },

  // 孔雀座 (Pavo) - additional
  { id: 'star:bayer:delta-pav', names: { westernSystemName: '孔雀座δ' }, raHours: 20, raMinutes: 21, raSeconds: 44.6, decDegrees: -66, decMinutes: 56, decSeconds: 35, magnitude: 3.62, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-pav', names: { westernSystemName: '孔雀座ε' }, raHours: 19, raMinutes: 42, raSeconds: 31.8, decDegrees: -73, decMinutes: 6, decSeconds: 44, magnitude: 3.94, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:kappa-pav', names: { westernSystemName: '孔雀座κ' }, raHours: 18, raMinutes: 40, raSeconds: 43.2, decDegrees: -69, decMinutes: 13, decSeconds: 12, magnitude: 4.4, color: '#b4c8ff', catalog: 'constellation' },

  // 水蛇座 (Hydrus) - additional
  { id: 'star:bayer:gamma-hyi', names: { westernSystemName: '水蛇座γ' }, raHours: 3, raMinutes: 47, raSeconds: 17.5, decDegrees: -74, decMinutes: 14, decSeconds: 16, magnitude: 3.24, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-hyi', names: { westernSystemName: '水蛇座ε' }, raHours: 2, raMinutes: 19, raSeconds: 57.3, decDegrees: -69, decMinutes: 21, decSeconds: 55, magnitude: 4.12, color: '#b4c8ff', catalog: 'constellation' },

  // 大麦哲伦云边缘亮星
  { id: 'star:custom:lmc-1', names: { chineseAsterism: 'LMC-1' }, raHours: 5, raMinutes: 4, raSeconds: 0.0, decDegrees: -68, decMinutes: 47, decSeconds: 0, magnitude: 4.0, color: '#ffe4b5', catalog: 'lmc' },
  { id: 'star:custom:lmc-2', names: { chineseAsterism: 'LMC-2' }, raHours: 5, raMinutes: 22, raSeconds: 0.0, decDegrees: -69, decMinutes: 0, decSeconds: 0, magnitude: 4.5, color: '#ffe4b5', catalog: 'lmc' },

  // 小麦哲伦云边缘亮星
  { id: 'star:custom:smc-1', names: { chineseAsterism: 'SMC-1' }, raHours: 0, raMinutes: 55, raSeconds: 0.0, decDegrees: -73, decMinutes: 0, decSeconds: 0, magnitude: 4.0, color: '#b4c8ff', catalog: 'smc' },
  { id: 'star:custom:smc-2', names: { chineseAsterism: 'SMC-2' }, raHours: 1, raMinutes: 5, raSeconds: 0.0, decDegrees: -73, decMinutes: 10, decSeconds: 0, magnitude: 4.5, color: '#b4c8ff', catalog: 'smc' },
];

// Chinese asterism line definitions - reference stars by stable ids
export const CHINESE_CONSTELLATIONS: Constellation[] = [
  {
    id: 'cn-big-dipper',
    names: { chineseAsterism: '北斗七星', westernConstellation: 'Big Dipper' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-uma', to: 'star:bayer:beta-uma' },
      { from: 'star:bayer:beta-uma', to: 'star:bayer:gamma-uma' },
      { from: 'star:bayer:gamma-uma', to: 'star:bayer:delta-uma' },
      { from: 'star:bayer:delta-uma', to: 'star:bayer:epsilon-uma' },
      { from: 'star:bayer:epsilon-uma', to: 'star:bayer:zeta-uma' },
      { from: 'star:bayer:zeta-uma', to: 'star:bayer:eta-uma' },
    ],
  },
  {
    id: 'cn-aries',
    names: { chineseAsterism: '娄宿', westernConstellation: 'Aries Region' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-ari', to: 'star:bayer:beta-ari' },
      { from: 'star:bayer:beta-ari', to: 'star:bayer:gamma-ari' },
    ],
  },
  {
    id: 'cn-taurus',
    names: { chineseAsterism: '毕宿', westernConstellation: 'Bi Xiu' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-tau', to: 'star:custom:毕宿一' },
      { from: 'star:bayer:alpha-tau', to: 'star:custom:毕宿三' },
      { from: 'star:bayer:alpha-tau', to: 'star:bayer:alpha-aur' },
    ],
  },
  {
    id: 'cn-gemini',
    names: { chineseAsterism: '井宿', westernConstellation: 'Jing Xiu' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-gem', to: 'star:bayer:beta-gem' },
      { from: 'star:bayer:alpha-gem', to: 'star:bayer:gamma-gem' },
      { from: 'star:bayer:beta-gem', to: 'star:bayer:epsilon-gem' },
    ],
  },
  {
    id: 'cn-leo',
    names: { chineseAsterism: '轩辕', westernConstellation: 'Xuanyuan' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-leo', to: 'star:custom:轩辕十二' },
      { from: 'star:custom:轩辕十二', to: 'star:custom:轩辕十一' },
      { from: 'star:custom:轩辕十一', to: 'star:custom:轩辕九' },
      { from: 'star:custom:轩辕九', to: 'star:custom:轩辕八' },
    ],
  },
  {
    id: 'cn-virgo',
    names: { chineseAsterism: '角宿', westernConstellation: 'Jiao Xiu' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-vir', to: 'star:custom:角宿二' },
      { from: 'star:custom:角宿二', to: 'star:custom:亢宿一' },
      { from: 'star:custom:亢宿一', to: 'star:custom:亢宿二' },
    ],
  },
  {
    id: 'cn-libra',
    names: { chineseAsterism: '氐宿', westernConstellation: 'Di Xiu' },
    system: 'chinese',
    lines: [
      { from: 'star:custom:氐宿四', to: 'star:custom:氐宿一' },
      { from: 'star:custom:氐宿一', to: 'star:custom:氐宿二' },
      { from: 'star:custom:氐宿二', to: 'star:custom:氐宿三' },
    ],
  },
  {
    id: 'cn-scorpius',
    names: { chineseAsterism: '心房尾宿', westernConstellation: 'Xin and Wei' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-sco', to: 'star:custom:尾宿二' },
      { from: 'star:custom:尾宿二', to: 'star:custom:尾宿一' },
      { from: 'star:custom:尾宿一', to: 'star:custom:房宿四' },
      { from: 'star:custom:房宿四', to: 'star:custom:钩铃一' },
      { from: 'star:custom:尾宿八', to: 'star:custom:尾宿三' },
      { from: 'star:custom:尾宿三', to: 'star:custom:尾宿四' },
      { from: 'star:custom:尾宿四', to: 'star:custom:尾宿五' },
      { from: 'star:custom:尾宿五', to: 'star:custom:尾宿六' },
    ],
  },
  {
    id: 'cn-sagittarius',
    names: { chineseAsterism: '斗建', westernConstellation: 'Dou and Jian' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:lambda-sgr', to: 'star:bayer:epsilon-sgr' },
      { from: 'star:bayer:epsilon-sgr', to: 'star:custom:斗宿三' },
      { from: 'star:custom:斗宿三', to: 'star:custom:建宿一' },
    ],
  },
  {
    id: 'cn-shen',
    names: { chineseAsterism: '参宿', westernConstellation: 'Shen Xiu' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-ori', to: 'star:bayer:gamma-ori' },
      { from: 'star:bayer:alpha-ori', to: 'star:bayer:zeta-ori' },
      { from: 'star:bayer:gamma-ori', to: 'star:bayer:delta-ori' },
      { from: 'star:bayer:zeta-ori', to: 'star:bayer:epsilon-ori' },
      { from: 'star:bayer:epsilon-ori', to: 'star:bayer:delta-ori' },
      { from: 'star:bayer:zeta-ori', to: 'star:custom:参宿六' },
      { from: 'star:bayer:delta-ori', to: 'star:bayer:beta-ori' },
    ],
  },
  {
    id: 'cn-shenqi',
    names: { chineseAsterism: '参旗', westernConstellation: 'Shenqi' },
    system: 'chinese',
    lines: [
      { from: 'star:custom:参旗一', to: 'star:custom:参旗二' },
      { from: 'star:custom:参旗二', to: 'star:custom:参旗三' },
    ],
  },
  {
    id: 'cn-ursa-major',
    names: { chineseAsterism: '北斗延伸', westernConstellation: 'Northern Dipper' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-uma', to: 'star:bayer:beta-uma' },
      { from: 'star:bayer:beta-uma', to: 'star:bayer:gamma-uma' },
      { from: 'star:bayer:gamma-uma', to: 'star:bayer:delta-uma' },
      { from: 'star:bayer:delta-uma', to: 'star:bayer:epsilon-uma' },
      { from: 'star:bayer:epsilon-uma', to: 'star:bayer:zeta-uma' },
      { from: 'star:bayer:zeta-uma', to: 'star:bayer:eta-uma' },
    ],
  },
  {
    id: 'cn-cygnus',
    names: { chineseAsterism: '天津', westernConstellation: 'Tianjin' },
    system: 'chinese',
    lines: [
      { from: 'star:custom:天津一', to: 'star:custom:天津二' },
      { from: 'star:custom:天津二', to: 'star:bayer:alpha-cyg' },
      { from: 'star:bayer:alpha-cyg', to: 'star:custom:天津五' },
      { from: 'star:custom:天津五', to: 'star:custom:天津八' },
      { from: 'star:custom:天津八', to: 'star:custom:天津九' },
    ],
  },
  {
    id: 'cn-lyra',
    names: { chineseAsterism: '织女', westernConstellation: 'Zhinu' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-lyr', to: 'star:custom:织女二' },
      { from: 'star:custom:织女二', to: 'star:custom:织女一' },
      { from: 'star:custom:织女一', to: 'star:custom:渐台二' },
      { from: 'star:custom:渐台二', to: 'star:custom:辇道一' },
    ],
  },
  {
    id: 'cn-aquila',
    names: { chineseAsterism: '河鼓', westernConstellation: 'Hegu' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-aql', to: 'star:custom:河鼓一' },
      { from: 'star:custom:河鼓一', to: 'star:custom:河鼓三' },
      { from: 'star:bayer:alpha-aql', to: 'star:bayer:zeta-aql' },
    ],
  },
  {
    id: 'cn-scorpius-extended',
    names: { chineseAsterism: '尾宿延长', westernConstellation: 'Wei Extension' },
    system: 'chinese',
    lines: [
      { from: 'star:custom:尾宿八', to: 'star:custom:尾宿九' },
    ],
  },
  {
    id: 'cn-centaurus',
    names: { chineseAsterism: '南门', westernConstellation: 'Nanmen' },
    system: 'chinese',
    lines: [
      { from: 'star:custom:南门二', to: 'star:bayer:beta-cen' },
    ],
  },
  {
    id: 'cn-hydra',
    names: { chineseAsterism: '平', westernConstellation: 'Ping' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:gamma-hya', to: 'star:bayer:pi-hya' },
    ],
  },
  {
    id: 'cn-cassiopeia',
    names: { chineseAsterism: '王良', westernConstellation: 'Wangliang' },
    system: 'chinese',
    lines: [
      { from: 'star:custom:王良一', to: 'star:custom:王良三' },
      { from: 'star:custom:王良三', to: 'star:custom:王良二' },
      { from: 'star:custom:王良二', to: 'star:custom:王良四' },
      { from: 'star:custom:王良四', to: 'star:custom:策' },
    ],
  },
  {
    id: 'cn-perseus',
    names: { chineseAsterism: '大陵', westernConstellation: 'Daling' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-per', to: 'star:custom:大陵五' },
    ],
  },
];

export const WESTERN_CONSTELLATIONS: Constellation[] = [
  {
    id: 'western-aries',
    names: { westernSystemName: '白羊座', westernConstellation: 'Aries' },
    system: 'western',
    lines: [
      { from: 'star:bayer:alpha-ari', to: 'star:bayer:beta-ari' },
      { from: 'star:bayer:beta-ari', to: 'star:bayer:gamma-ari' },
    ],
  },
  {
    id: 'western-taurus',
    names: { westernSystemName: '金牛座', westernConstellation: 'Taurus' },
    system: 'western',
    lines: [
      { from: 'star:bayer:alpha-tau', to: 'star:bayer:alpha-aur' },
      { from: 'star:bayer:alpha-tau', to: 'star:custom:毕宿一' },
      { from: 'star:bayer:alpha-tau', to: 'star:custom:毕宿三' },
    ],
  },
  {
    id: 'western-gemini',
    names: { westernSystemName: '双子座', westernConstellation: 'Gemini' },
    system: 'western',
    lines: [
      { from: 'star:bayer:alpha-gem', to: 'star:bayer:beta-gem' },
      { from: 'star:bayer:alpha-gem', to: 'star:bayer:gamma-gem' },
      { from: 'star:bayer:beta-gem', to: 'star:bayer:epsilon-gem' },
    ],
  },
  {
    id: 'western-orion',
    names: { westernSystemName: '猎户座', westernConstellation: 'Orion' },
    system: 'western',
    lines: [
      { from: 'star:bayer:lambda-ori', to: 'star:bayer:alpha-ori' },
      { from: 'star:bayer:lambda-ori', to: 'star:bayer:gamma-ori' },
      { from: 'star:bayer:alpha-ori', to: 'star:bayer:gamma-ori' },
      { from: 'star:bayer:alpha-ori', to: 'star:bayer:zeta-ori' },
      { from: 'star:bayer:gamma-ori', to: 'star:bayer:delta-ori' },
      { from: 'star:bayer:zeta-ori', to: 'star:bayer:delta-ori' },
      { from: 'star:bayer:delta-ori', to: 'star:bayer:epsilon-ori' },
      { from: 'star:bayer:zeta-ori', to: 'star:custom:参宿六' },
      { from: 'star:bayer:delta-ori', to: 'star:bayer:beta-ori' },
      { from: 'star:custom:参宿六', to: 'star:bayer:beta-ori' },
    ],
  },
  {
    id: 'western-ursa-major',
    names: { westernSystemName: '大熊座', westernConstellation: 'Ursa Major' },
    system: 'western',
    lines: [
      { from: 'star:bayer:alpha-uma', to: 'star:bayer:beta-uma' },
      { from: 'star:bayer:beta-uma', to: 'star:bayer:gamma-uma' },
      { from: 'star:bayer:gamma-uma', to: 'star:bayer:delta-uma' },
      { from: 'star:bayer:delta-uma', to: 'star:bayer:epsilon-uma' },
      { from: 'star:bayer:epsilon-uma', to: 'star:bayer:zeta-uma' },
      { from: 'star:bayer:zeta-uma', to: 'star:bayer:eta-uma' },
    ],
  },
  {
    id: 'western-cygnus',
    names: { westernSystemName: '天鹅座', westernConstellation: 'Cygnus' },
    system: 'western',
    lines: [
      { from: 'star:bayer:alpha-cyg', to: 'star:custom:天津一' },
      { from: 'star:custom:天津一', to: 'star:custom:辇道增七' },
      { from: 'star:custom:天津一', to: 'star:custom:天津二' },
      { from: 'star:custom:天津一', to: 'star:custom:天津九' },
    ],
  },
  {
    id: 'western-lyra',
    names: { westernSystemName: '天琴座', westernConstellation: 'Lyra' },
    system: 'western',
    lines: [
      { from: 'star:bayer:alpha-lyr', to: 'star:custom:织女二' },
      { from: 'star:custom:织女二', to: 'star:custom:织女一' },
      { from: 'star:custom:织女一', to: 'star:custom:渐台二' },
      { from: 'star:custom:渐台二', to: 'star:custom:辇道一' },
    ],
  },
  {
    id: 'western-aquila',
    names: { westernSystemName: '天鹰座', westernConstellation: 'Aquila' },
    system: 'western',
    lines: [
      { from: 'star:custom:河鼓一', to: 'star:bayer:alpha-aql' },
      { from: 'star:bayer:alpha-aql', to: 'star:custom:河鼓三' },
      { from: 'star:bayer:alpha-aql', to: 'star:bayer:delta-aql' },
      { from: 'star:bayer:delta-aql', to: 'star:bayer:zeta-aql' },
      { from: 'star:bayer:delta-aql', to: 'star:bayer:theta-aql' },
    ],
  },
  {
    id: 'western-cassiopeia',
    names: { westernSystemName: '仙后座', westernConstellation: 'Cassiopeia' },
    system: 'western',
    lines: [
      { from: 'star:custom:王良一', to: 'star:custom:王良三' },
      { from: 'star:custom:王良三', to: 'star:custom:王良二' },
      { from: 'star:custom:王良二', to: 'star:custom:王良四' },
      { from: 'star:custom:王良四', to: 'star:custom:策' },
    ],
  },
  {
    id: 'western-perseus',
    names: { westernSystemName: '英仙座', westernConstellation: 'Perseus' },
    system: 'western',
    lines: [
      { from: 'star:bayer:alpha-per', to: 'star:bayer:epsilon-per' },
      { from: 'star:bayer:epsilon-per', to: 'star:bayer:zeta-per' },
      { from: 'star:bayer:zeta-per', to: 'star:custom:大陵五' },
    ],
  },
  {
    id: 'western-centaurus',
    names: { westernSystemName: '半人马座', westernConstellation: 'Centaurus' },
    system: 'western',
    lines: [
      { from: 'star:custom:南门二', to: 'star:bayer:beta-cen' },
      { from: 'star:bayer:beta-cen', to: 'star:bayer:epsilon-cen' },
      { from: 'star:bayer:epsilon-cen', to: 'star:bayer:zeta-cen' },
      { from: 'star:bayer:zeta-cen', to: 'star:bayer:gamma-cen' },
    ],
  },
  {
    id: 'western-hydra',
    names: { westernSystemName: '长蛇座', westernConstellation: 'Hydra' },
    system: 'western',
    lines: [
      { from: 'star:custom:星宿一', to: 'star:bayer:gamma-hya' },
      { from: 'star:bayer:gamma-hya', to: 'star:bayer:rho-hya' },
      { from: 'star:bayer:rho-hya', to: 'star:bayer:pi-hya' },
    ],
  },
];

export const CONSTELLATIONS_BY_CULTURE: Record<SkyCulture, Constellation[]> = {
  western: WESTERN_CONSTELLATIONS,
  chinese: CHINESE_CONSTELLATIONS,
};
