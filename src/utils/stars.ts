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
  /** Internal grouping tag, not an astronomy source catalog such as Hipparcos / BSC / Gaia. */
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
  { id: 'star:bayer:alpha-umi', names: { chineseAsterism: '北极星', westernProper: 'Polaris', westernDesignation: 'Alpha UMi', westernSystemName: '小熊座α' }, raHours: 2, raMinutes: 31, raSeconds: 49.09456, decDegrees: 89, decMinutes: 15, decSeconds: 50.7923, magnitude: 1.98, color: '#d8e6ff', catalog: 'common' },
  { id: 'star:bayer:alpha-cma', names: { chineseAsterism: '天狼星', westernProper: 'Sirius', westernDesignation: 'Alpha CMa', westernSystemName: '大犬座α' }, raHours: 6, raMinutes: 45, raSeconds: 8.91728, decDegrees: -16, decMinutes: 42, decSeconds: 58.0171, magnitude: -1.46, color: '#e9f4ff', catalog: 'common' },
  { id: 'star:bayer:alpha-ori', names: { chineseAsterism: '参宿四', westernProper: 'Betelgeuse', westernDesignation: 'Alpha Ori', westernSystemName: '猎户座α' }, raHours: 5, raMinutes: 55, raSeconds: 10.30536, decDegrees: 7, decMinutes: 24, decSeconds: 25.4304, magnitude: 0.42, color: '#ffd1b0', catalog: 'common' },
  { id: 'star:bayer:alpha-lyr', names: { chineseAsterism: '织女一', westernProper: 'Vega', westernDesignation: 'Alpha Lyr', westernSystemName: '天琴座α' }, raHours: 18, raMinutes: 36, raSeconds: 56.33635, decDegrees: 38, decMinutes: 47, decSeconds: 1.2802, magnitude: 0.03, color: '#cfe3ff', catalog: 'common' },
  { id: 'star:bayer:alpha-aql', names: { chineseAsterism: '河鼓二', westernProper: 'Altair', westernDesignation: 'Alpha Aql', westernSystemName: '天鹰座α' }, raHours: 19, raMinutes: 50, raSeconds: 46.99855, decDegrees: 8, decMinutes: 52, decSeconds: 5.9563, magnitude: 0.77, color: '#fff0d6', catalog: 'common' },
  { id: 'star:bayer:alpha-cyg', names: { chineseAsterism: '天津四', westernProper: 'Deneb', westernDesignation: 'Alpha Cyg', westernSystemName: '天鹅座α' }, raHours: 20, raMinutes: 41, raSeconds: 25.91514, decDegrees: 45, decMinutes: 16, decSeconds: 49.2197, magnitude: 1.25, color: '#eef5ff', catalog: 'common' },
  { id: 'star:bayer:alpha-cmi', names: { chineseAsterism: '南河三', westernProper: 'Procyon', westernDesignation: 'Alpha CMi', westernSystemName: '小犬座α' }, raHours: 7, raMinutes: 39, raSeconds: 18.1, decDegrees: 5, decMinutes: 13, decSeconds: 30, magnitude: 0.34, color: '#ffe4b5', catalog: 'common' },
  { id: 'star:bayer:alpha-car', names: { chineseAsterism: '老人星', westernProper: 'Canopus', westernDesignation: 'Alpha Car', westernSystemName: '船底座α' }, raHours: 6, raMinutes: 23, raSeconds: 57.1, decDegrees: -52, decMinutes: 41, decSeconds: 44, magnitude: -0.72, color: '#ffe4b5', catalog: 'common' },
  { id: 'star:bayer:alpha-boo', names: { chineseAsterism: '大角星', westernProper: 'Arcturus', westernDesignation: 'Alpha Boo', westernSystemName: '牧夫座α' }, raHours: 14, raMinutes: 16, raSeconds: 22.3, decDegrees: 19, decMinutes: 10, decSeconds: 57, magnitude: -0.05, color: '#ffe4b5', catalog: 'common' },
  { id: 'star:bayer:alpha-vir', names: { chineseAsterism: '角宿一', westernProper: 'Spica', westernDesignation: 'Alpha Vir', westernSystemName: '室女座α' }, raHours: 13, raMinutes: 25, raSeconds: 11.6, decDegrees: -11, decMinutes: 9, decSeconds: 41, magnitude: 0.97, color: '#b4c8ff', catalog: 'common' },
  { id: 'star:bayer:alpha-sco', names: { chineseAsterism: '心宿二', westernProper: 'Antares', westernDesignation: 'Alpha Sco', westernSystemName: '天蝎座α' }, raHours: 16, raMinutes: 29, raSeconds: 24.4, decDegrees: -26, decMinutes: 25, decSeconds: 55, magnitude: 1.06, color: '#ff7f50', catalog: 'common' },
  { id: 'star:bayer:alpha-tau', names: { chineseAsterism: '毕宿五', westernProper: 'Aldebaran', westernDesignation: 'Alpha Tau', westernSystemName: '金牛座α' }, raHours: 4, raMinutes: 35, raSeconds: 55.2, decDegrees: 16, decMinutes: 30, decSeconds: 33, magnitude: 0.85, color: '#ffd699', catalog: 'common' },
  { id: 'star:bayer:alpha-psa', names: { chineseAsterism: '北落师门', westernProper: 'Fomalhaut', westernDesignation: 'Alpha PsA', westernSystemName: '南鱼座α' }, raHours: 22, raMinutes: 57, raSeconds: 39.0, decDegrees: -29, decMinutes: 37, decSeconds: 20, magnitude: 1.16, color: '#b4c8ff', catalog: 'common' },
  { id: 'star:bayer:alpha-gem', names: { chineseAsterism: '北河二', westernProper: 'Castor', westernDesignation: 'Alpha Gem', westernSystemName: '双子座α' }, raHours: 7, raMinutes: 34, raSeconds: 36.0, decDegrees: 31, decMinutes: 53, decSeconds: 18, magnitude: 1.58, color: '#ffffff', catalog: 'common' },
  { id: 'star:bayer:beta-gem', names: { chineseAsterism: '北河三', westernProper: 'Pollux', westernDesignation: 'Beta Gem', westernSystemName: '双子座β' }, raHours: 7, raMinutes: 45, raSeconds: 18.9, decDegrees: 28, decMinutes: 1, decSeconds: 34, magnitude: 1.14, color: '#ffebcd', catalog: 'common' },
  { id: 'star:bayer:alpha-leo', names: { chineseAsterism: '轩辕十四', westernProper: 'Regulus', westernDesignation: 'Alpha Leo', westernSystemName: '狮子座α' }, raHours: 10, raMinutes: 8, raSeconds: 22.0, decDegrees: 11, decMinutes: 58, decSeconds: 2, magnitude: 1.35, color: '#d4e5ff', catalog: 'common' },

  // 小熊座 (Ursa Minor)
  { id: 'star:bayer:beta-umi', names: { westernProper: 'Kochab', westernDesignation: 'Beta UMi', westernSystemName: '小熊座β' }, raHours: 14, raMinutes: 50, raSeconds: 42.3, decDegrees: 74, decMinutes: 9, decSeconds: 20, magnitude: 2.08, color: '#ffd699', catalog: 'constellation' },
  { id: 'star:bayer:gamma-umi', names: { westernProper: 'Pherkad', westernDesignation: 'Gamma UMi', westernSystemName: '小熊座γ' }, raHours: 15, raMinutes: 20, raSeconds: 43.7, decDegrees: 71, decMinutes: 50, decSeconds: 2, magnitude: 3.05, color: '#fff0d6', catalog: 'constellation' },

  // ===== 北斗七星 (Big Dipper) =====
  { id: 'star:bayer:alpha-uma', names: { chineseAsterism: '天枢', westernDesignation: 'Alpha UMa', westernSystemName: '大熊座α' }, raHours: 11, raMinutes: 3, raSeconds: 43.7, decDegrees: 61, decMinutes: 45, decSeconds: 3, magnitude: 1.79, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:beta-uma', names: { chineseAsterism: '天璇', westernDesignation: 'Beta UMa', westernSystemName: '大熊座β' }, raHours: 11, raMinutes: 3, raSeconds: 31.8, decDegrees: 54, decMinutes: 55, decSeconds: 27, magnitude: 2.27, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:gamma-uma', names: { chineseAsterism: '天玑', westernDesignation: 'Gamma UMa', westernSystemName: '大熊座γ' }, raHours: 11, raMinutes: 53, raSeconds: 59.9, decDegrees: 53, decMinutes: 41, decSeconds: 45, magnitude: 2.44, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:delta-uma', names: { chineseAsterism: '天权', westernDesignation: 'Delta UMa', westernSystemName: '大熊座δ' }, raHours: 12, raMinutes: 15, raSeconds: 25.6, decDegrees: 57, decMinutes: 1, decSeconds: 58, magnitude: 3.31, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:epsilon-uma', names: { chineseAsterism: '玉衡', westernDesignation: 'Epsilon UMa', westernSystemName: '大熊座ε' }, raHours: 12, raMinutes: 54, raSeconds: 2.6, decDegrees: 55, decMinutes: 59, decSeconds: 51, magnitude: 1.77, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:zeta-uma', names: { chineseAsterism: '开阳', westernDesignation: 'Zeta UMa', westernSystemName: '大熊座ζ' }, raHours: 13, raMinutes: 23, raSeconds: 55.5, decDegrees: 54, decMinutes: 55, decSeconds: 31, magnitude: 2.06, color: '#ffe4b5', catalog: 'big-dipper' },
  { id: 'star:bayer:eta-uma', names: { chineseAsterism: '摇光', westernDesignation: 'Eta UMa', westernSystemName: '大熊座η' }, raHours: 13, raMinutes: 47, raSeconds: 32.2, decDegrees: 49, decMinutes: 13, decSeconds: 51, magnitude: 1.86, color: '#ffe4b5', catalog: 'big-dipper' },

  // ===== 黄道星座 (Zodiac Constellations) =====

  // 白羊座 (Aries)
  { id: 'star:bayer:alpha-ari', names: { chineseAsterism: '娄宿一', westernDesignation: 'Alpha Ari', westernSystemName: '白羊座α' }, raHours: 2, raMinutes: 7, raSeconds: 10.4, decDegrees: 23, decMinutes: 27, decSeconds: 44, magnitude: 2.00, color: '#ffd4a3', catalog: 'zodiac' },
  { id: 'star:bayer:beta-ari', names: { chineseAsterism: '娄宿二', westernDesignation: 'Beta Ari', westernSystemName: '白羊座β' }, raHours: 1, raMinutes: 54, raSeconds: 38.7, decDegrees: 20, decMinutes: 48, decSeconds: 29, magnitude: 2.64, color: '#ffd4a3', catalog: 'zodiac' },
  { id: 'star:bayer:gamma-ari', names: { chineseAsterism: '娄宿三', westernDesignation: 'Gamma Ari', westernSystemName: '白羊座γ' }, raHours: 1, raMinutes: 53, raSeconds: 31.8, decDegrees: 19, decMinutes: 17, decSeconds: 45, magnitude: 4.59, color: '#ffd4a3', catalog: 'zodiac' },

  // 金牛座 (Taurus)
  { id: 'star:bayer:eta-tau', names: { chineseAsterism: '昴宿六', westernDesignation: 'Eta Tau', westernSystemName: '金牛座η' }, raHours: 3, raMinutes: 47, raSeconds: 29.1, decDegrees: 24, decMinutes: 6, decSeconds: 18, magnitude: 2.87, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:flamsteed:17-tau', names: { chineseAsterism: '昴宿一', westernDesignation: '17 Tau', westernSystemName: '金牛座17' }, raHours: 3, raMinutes: 44, raSeconds: 52.5, decDegrees: 24, decMinutes: 28, decSeconds: 2, magnitude: 3.64, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:flamsteed:19-tau', names: { chineseAsterism: '昴宿二', westernDesignation: '19 Tau', westernSystemName: '金牛座19' }, raHours: 3, raMinutes: 45, raSeconds: 50.3, decDegrees: 23, decMinutes: 56, decSeconds: 51, magnitude: 4.18, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:flamsteed:20-tau', names: { chineseAsterism: '昴宿四', westernDesignation: '20 Tau', westernSystemName: '金牛座20' }, raHours: 3, raMinutes: 49, raSeconds: 13.7, decDegrees: 24, decMinutes: 22, decSeconds: 36, magnitude: 3.88, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:bayer:epsilon-tau', names: { chineseAsterism: '毕宿一', westernDesignation: 'Epsilon Tau', westernSystemName: '金牛座ε' }, raHours: 4, raMinutes: 21, raSeconds: 57.1, decDegrees: 15, decMinutes: 37, decSeconds: 55, magnitude: 3.53, color: '#ffd699', catalog: 'zodiac' },
  { id: 'star:bayer:delta-tau', names: { chineseAsterism: '毕宿三', westernDesignation: 'Delta Tau', westernSystemName: '金牛座δ' }, raHours: 4, raMinutes: 37, raSeconds: 53.4, decDegrees: 12, decMinutes: 52, decSeconds: 24, magnitude: 4.27, color: '#ffd699', catalog: 'zodiac' },
  { id: 'star:bayer:beta-tau', names: { chineseAsterism: '五车五', westernDesignation: 'Beta Tau', westernSystemName: '金牛座β' }, raHours: 5, raMinutes: 26, raSeconds: 17.5, decDegrees: 28, decMinutes: 36, decSeconds: 26.8, magnitude: 1.65, color: '#cfe3ff', catalog: 'zodiac' },

  // 双子座 (Gemini)
  { id: 'star:bayer:mu-gem', names: { chineseAsterism: '井宿一', westernDesignation: 'Mu Gem', westernSystemName: '双子座μ' }, raHours: 6, raMinutes: 22, raSeconds: 57.6, decDegrees: 22, decMinutes: 30, decSeconds: 48.9, magnitude: 2.87, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:bayer:nu-gem', names: { chineseAsterism: '井宿二', westernDesignation: 'Nu Gem', westernSystemName: '双子座ν' }, raHours: 6, raMinutes: 28, raSeconds: 57.8, decDegrees: 20, decMinutes: 12, decSeconds: 43.7, magnitude: 4.13, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:bayer:gamma-gem', names: { chineseAsterism: '井宿三', westernDesignation: 'Gamma Gem', westernSystemName: '双子座γ' }, raHours: 6, raMinutes: 37, raSeconds: 42.7, decDegrees: 16, decMinutes: 23, decSeconds: 57.3, magnitude: 1.93, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:bayer:xi-gem', names: { chineseAsterism: '井宿四', westernDesignation: 'Xi Gem', westernSystemName: '双子座ξ' }, raHours: 6, raMinutes: 45, raSeconds: 17.4, decDegrees: 12, decMinutes: 53, decSeconds: 44.1, magnitude: 3.35, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:bayer:epsilon-gem', names: { chineseAsterism: '井宿五', westernDesignation: 'Epsilon Gem', westernSystemName: '双子座ε' }, raHours: 6, raMinutes: 43, raSeconds: 55.9, decDegrees: 25, decMinutes: 7, decSeconds: 52, magnitude: 3.06, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:flamsteed:36-gem', names: { chineseAsterism: '井宿六', westernDesignation: '36 Gem', westernSystemName: '双子座36' }, raHours: 6, raMinutes: 51, raSeconds: 33.0, decDegrees: 21, decMinutes: 45, decSeconds: 40.1, magnitude: 5.28, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:bayer:zeta-gem', names: { chineseAsterism: '井宿七', westernDesignation: 'Zeta Gem', westernSystemName: '双子座ζ' }, raHours: 7, raMinutes: 4, raSeconds: 6.5, decDegrees: 20, decMinutes: 34, decSeconds: 13.1, magnitude: 4.01, color: '#ffffff', catalog: 'zodiac' },
  { id: 'star:bayer:lambda-gem', names: { chineseAsterism: '井宿八', westernDesignation: 'Lambda Gem', westernSystemName: '双子座λ' }, raHours: 7, raMinutes: 18, raSeconds: 5.6, decDegrees: 16, decMinutes: 32, decSeconds: 25.4, magnitude: 3.58, color: '#ffffff', catalog: 'zodiac' },

  // 巨蟹座 (Cancer)
  { id: 'star:bayer:beta-cnc', names: { westernProper: 'Altarf', westernDesignation: 'Beta Cnc', westernSystemName: '巨蟹座β' }, raHours: 8, raMinutes: 16, raSeconds: 30.9, decDegrees: 9, decMinutes: 11, decSeconds: 8, magnitude: 3.53, color: '#ffb07c', catalog: 'zodiac' },
  { id: 'star:bayer:alpha-cnc', names: { westernProper: 'Acubens', westernDesignation: 'Alpha Cnc', westernSystemName: '巨蟹座α' }, raHours: 8, raMinutes: 58, raSeconds: 29.2, decDegrees: 11, decMinutes: 51, decSeconds: 28, magnitude: 4.26, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:bayer:zeta-cnc', names: { chineseAsterism: '柳宿增一', westernDesignation: 'Zeta Cnc', westernSystemName: '巨蟹座ζ' }, raHours: 8, raMinutes: 58, raSeconds: 29.2, decDegrees: 23, decMinutes: 25, decSeconds: 55, magnitude: 4.24, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:bayer:delta-cnc', names: { chineseAsterism: '鬼宿四', westernDesignation: 'Delta Cnc', westernSystemName: '巨蟹座δ' }, raHours: 8, raMinutes: 44, raSeconds: 46.8, decDegrees: 18, decMinutes: 9, decSeconds: 15, magnitude: 3.94, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:bayer:lambda-cnc', names: { chineseAsterism: '鬼宿三', westernDesignation: 'Lambda Cnc', westernSystemName: '巨蟹座λ' }, raHours: 8, raMinutes: 51, raSeconds: 57.6, decDegrees: 21, decMinutes: 28, decSeconds: 5, magnitude: 4.73, color: '#e8e8e8', catalog: 'zodiac' },

  // 狮子座 (Leo)
  { id: 'star:bayer:zeta-leo', names: { chineseAsterism: '轩辕十二', westernDesignation: 'Zeta Leo', westernSystemName: '狮子座ζ' }, raHours: 10, raMinutes: 16, raSeconds: 41.4, decDegrees: 19, decMinutes: 50, decSeconds: 29, magnitude: 2.56, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:gamma-leo', names: { chineseAsterism: '轩辕十一', westernDesignation: 'Gamma Leo', westernSystemName: '狮子座γ' }, raHours: 10, raMinutes: 7, raSeconds: 55.9, decDegrees: 16, decMinutes: 30, decSeconds: 33, magnitude: 3.44, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:beta-leo', names: { chineseAsterism: '五帝座一', westernDesignation: 'Beta Leo', westernSystemName: '狮子座β' }, raHours: 11, raMinutes: 49, raSeconds: 51.8, decDegrees: 14, decMinutes: 31, decSeconds: 45, magnitude: 2.14, color: '#fff8f0', catalog: 'zodiac' },
  { id: 'star:bayer:mu-leo', names: { chineseAsterism: '轩辕九', westernDesignation: 'Mu Leo', westernSystemName: '狮子座μ' }, raHours: 9, raMinutes: 45, raSeconds: 51.2, decDegrees: 6, decMinutes: 25, decSeconds: 58, magnitude: 3.44, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:lambda-leo', names: { chineseAsterism: '轩辕八', westernDesignation: 'Lambda Leo', westernSystemName: '狮子座λ' }, raHours: 9, raMinutes: 27, raSeconds: 40.1, decDegrees: 6, decMinutes: 21, decSeconds: 29, magnitude: 3.0, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:beta-vir', names: { chineseAsterism: '太微右垣一', westernDesignation: 'Beta Vir', westernSystemName: '室女座β' }, raHours: 11, raMinutes: 21, raSeconds: 31.8, decDegrees: 10, decMinutes: 47, decSeconds: 38, magnitude: 4.98, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:eta-vir', names: { chineseAsterism: '太微左垣一', westernDesignation: 'Eta Vir', westernSystemName: '室女座η' }, raHours: 10, raMinutes: 33, raSeconds: 0.5, decDegrees: 9, decMinutes: 54, decSeconds: 43, magnitude: 4.47, color: '#d4e5ff', catalog: 'zodiac' },

  // 处女座 (Virgo)
  { id: 'star:bayer:gamma-vir', names: { chineseAsterism: '太微左垣二', westernDesignation: 'Gamma Vir', westernSystemName: '室女座γ' }, raHours: 13, raMinutes: 34, raSeconds: 46.1, decDegrees: -1, decMinutes: 26, decSeconds: 58, magnitude: 2.74, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:delta-vir', names: { chineseAsterism: '太微左垣三', westernDesignation: 'Delta Vir', westernSystemName: '室女座δ' }, raHours: 13, raMinutes: 42, raSeconds: 28.6, decDegrees: -0, decMinutes: 35, decSeconds: 19, magnitude: 3.79, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:zeta-vir', names: { chineseAsterism: '角宿二', westernDesignation: 'Zeta Vir', westernSystemName: '室女座ζ' }, raHours: 13, raMinutes: 2, raSeconds: 17.6, decDegrees: -0, decMinutes: 35, decSeconds: 45, magnitude: 3.65, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:iota-vir', names: { chineseAsterism: '亢宿二', westernDesignation: 'Iota Vir', westernSystemName: '室女座ι' }, raHours: 12, raMinutes: 41, raSeconds: 13.2, decDegrees: -1, decMinutes: 50, decSeconds: 16, magnitude: 4.06, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:omicron-vir', names: { chineseAsterism: '招摇', westernDesignation: 'Omicron Vir', westernSystemName: '室女座ο' }, raHours: 14, raMinutes: 29, raSeconds: 43.1, decDegrees: 2, decMinutes: 5, decSeconds: 49, magnitude: 3.44, color: '#b4c8ff', catalog: 'zodiac' },

  // 天秤座 (Libra)
  { id: 'star:bayer:beta-lib', names: { chineseAsterism: '氐宿四', westernDesignation: 'Beta Lib', westernSystemName: '天秤座β' }, raHours: 14, raMinutes: 50, raSeconds: 52.8, decDegrees: -15, decMinutes: 43, decSeconds: 29, magnitude: 2.61, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:alpha-lib', names: { chineseAsterism: '氐宿一', westernDesignation: 'Alpha Lib', westernSystemName: '天秤座α' }, raHours: 14, raMinutes: 41, raSeconds: 59.0, decDegrees: -15, decMinutes: 40, decSeconds: 44, magnitude: 3.25, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:sigma-lib', names: { chineseAsterism: '氐宿增七', westernDesignation: 'Sigma Lib', westernSystemName: '天秤座σ' }, raHours: 15, raMinutes: 28, raSeconds: 5.7, decDegrees: -25, decMinutes: 16, decSeconds: 54, magnitude: 3.25, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:iota-lib', names: { chineseAsterism: '氐宿二', westernDesignation: 'Iota Lib', westernSystemName: '天秤座ι' }, raHours: 14, raMinutes: 49, raSeconds: 32.8, decDegrees: -20, decMinutes: 4, decSeconds: 35, magnitude: 2.81, color: '#d4e5ff', catalog: 'zodiac' },
  { id: 'star:bayer:gamma-lib', names: { chineseAsterism: '氐宿三', westernDesignation: 'Gamma Lib', westernSystemName: '天秤座γ' }, raHours: 15, raMinutes: 1, raSeconds: 25.5, decDegrees: -18, decMinutes: 9, decSeconds: 35, magnitude: 4.86, color: '#d4e5ff', catalog: 'zodiac' },

  // 天蝎座 (Scorpius)
  { id: 'star:bayer:lambda-sco', names: { chineseAsterism: '尾宿二', westernDesignation: 'Lambda Sco', westernSystemName: '天蝎座λ' }, raHours: 16, raMinutes: 21, raSeconds: 11.3, decDegrees: -25, decMinutes: 36, decSeconds: 48, magnitude: 2.32, color: '#ff7f50', catalog: 'zodiac' },
  { id: 'star:bayer:mu-sco', names: { chineseAsterism: '尾宿一', westernDesignation: 'Mu Sco', westernSystemName: '天蝎座μ' }, raHours: 17, raMinutes: 12, raSeconds: 19.2, decDegrees: -22, decMinutes: 1, decSeconds: 17, magnitude: 2.64, color: '#ff7f50', catalog: 'zodiac' },
  { id: 'star:bayer:zeta-sco', names: { chineseAsterism: '尾宿三', westernDesignation: 'Zeta Sco', westernSystemName: '天蝎座ζ' }, raHours: 17, raMinutes: 42, raSeconds: 29.3, decDegrees: -34, decMinutes: 17, decSeconds: 47, magnitude: 2.62, color: '#ffb07c', catalog: 'zodiac' },
  { id: 'star:bayer:beta-sco', names: { chineseAsterism: '房宿四', westernDesignation: 'Beta Sco', westernSystemName: '天蝎座β' }, raHours: 16, raMinutes: 1, raSeconds: 37.9, decDegrees: -25, decMinutes: 20, decSeconds: 12, magnitude: 2.62, color: '#ff7f50', catalog: 'zodiac' },
  { id: 'star:bayer:pi-sco', names: { chineseAsterism: '钩铃一', westernDesignation: 'Pi Sco', westernSystemName: '天蝎座π' }, raHours: 16, raMinutes: 8, raSeconds: 22.9, decDegrees: -28, decMinutes: 0, decSeconds: 42, magnitude: 2.87, color: '#ff7f50', catalog: 'zodiac' },

  // 射手座 (Sagittarius)
  { id: 'star:bayer:epsilon-sgr', names: { chineseAsterism: '斗宿二', westernDesignation: 'Epsilon Sgr', westernSystemName: '人马座ε' }, raHours: 18, raMinutes: 21, raSeconds: 35.0, decDegrees: -25, decMinutes: 25, decSeconds: 28, magnitude: 1.98, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:bayer:gamma-sgr', names: { chineseAsterism: '箕宿一', westernDesignation: 'Gamma Sgr', westernSystemName: '人马座γ' }, raHours: 18, raMinutes: 55, raSeconds: 15.9, decDegrees: -30, decMinutes: 12, decSeconds: 19, magnitude: 2.82, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:bayer:sigma-sgr', names: { westernProper: 'Nunki', westernDesignation: 'Sigma Sgr', westernSystemName: '人马座σ' }, raHours: 18, raMinutes: 55, raSeconds: 15.9, decDegrees: -26, decMinutes: 17, decSeconds: 48, magnitude: 2.05, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:lambda-sgr', names: { chineseAsterism: '斗宿一', westernDesignation: 'Lambda Sgr', westernSystemName: '人马座λ' }, raHours: 18, raMinutes: 5, raSeconds: 19.1, decDegrees: -24, decMinutes: 52, decSeconds: 57, magnitude: 3.17, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:bayer:phi-sgr', names: { chineseAsterism: '斗宿三', westernDesignation: 'Phi Sgr', westernSystemName: '人马座φ' }, raHours: 18, raMinutes: 40, raSeconds: 13.6, decDegrees: -23, decMinutes: 55, decSeconds: 2, magnitude: 2.7, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:bayer:delta-sgr', names: { chineseAsterism: '箕宿三', westernDesignation: 'Delta Sgr', westernSystemName: '人马座δ' }, raHours: 19, raMinutes: 2, raSeconds: 58.1, decDegrees: -30, decMinutes: 25, decSeconds: 20, magnitude: 3.12, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:bayer:zeta-sgr', names: { westernProper: 'Ascella', westernDesignation: 'Zeta Sgr', westernSystemName: '人马座ζ' }, raHours: 19, raMinutes: 2, raSeconds: 36.7, decDegrees: -29, decMinutes: 52, decSeconds: 48, magnitude: 2.6, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:xi-sgr', names: { chineseAsterism: '建宿一', westernDesignation: 'Xi Sgr', westernSystemName: '人马座ξ' }, raHours: 19, raMinutes: 23, raSeconds: 18.7, decDegrees: -29, decMinutes: 42, decSeconds: 17, magnitude: 3.54, color: '#ffe4b5', catalog: 'zodiac' },
  { id: 'star:bayer:beta-sgr', names: { chineseAsterism: '天渊一', westernDesignation: 'Beta Sgr', westernSystemName: '人马座β' }, raHours: 18, raMinutes: 27, raSeconds: 58.0, decDegrees: -25, decMinutes: 25, decSeconds: 18.2, magnitude: 3.96, color: '#ffe4b5', catalog: 'zodiac' },

  // 摩羯座 (Capricornus)
  { id: 'star:bayer:delta-cap', names: { westernProper: 'Deneb Algedi', westernDesignation: 'Delta Cap', westernSystemName: '摩羯座δ' }, raHours: 21, raMinutes: 47, raSeconds: 2.44424, decDegrees: -16, decMinutes: 7, decSeconds: 38.2335, magnitude: 2.81, color: '#fff0d6', catalog: 'zodiac' },
  { id: 'star:bayer:beta-cap', names: { chineseAsterism: '牛宿一', westernDesignation: 'Beta Cap', westernSystemName: '摩羯座β' }, raHours: 21, raMinutes: 27, raSeconds: 58.1, decDegrees: -12, decMinutes: 30, decSeconds: 29, magnitude: 3.77, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:bayer:kappa-cap', names: { chineseAsterism: '垒壁阵四', westernDesignation: 'Kappa Cap', westernSystemName: '摩羯座κ' }, raHours: 22, raMinutes: 5, raSeconds: 51.8, decDegrees: -21, decMinutes: 11, decSeconds: 0, magnitude: 2.87, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:bayer:iota-cap', names: { chineseAsterism: '垒壁阵一', westernDesignation: 'Iota Cap', westernSystemName: '摩羯座ι' }, raHours: 21, raMinutes: 43, raSeconds: 36.2, decDegrees: -16, decMinutes: 7, decSeconds: 51, magnitude: 3.58, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:bayer:gamma-cap', names: { chineseAsterism: '垒壁阵二', westernDesignation: 'Gamma Cap', westernSystemName: '摩羯座γ' }, raHours: 21, raMinutes: 53, raSeconds: 28.1, decDegrees: -14, decMinutes: 46, decSeconds: 41, magnitude: 4.3, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:bayer:alpha-cap', names: { chineseAsterism: '牛宿增一', westernDesignation: 'Alpha Cap', westernSystemName: '摩羯座α' }, raHours: 20, raMinutes: 17, raSeconds: 59.7, decDegrees: -12, decMinutes: 30, decSeconds: 30, magnitude: 4.52, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:bayer:rho-aql', names: { chineseAsterism: '右旗一', westernDesignation: 'Rho Aql', westernSystemName: '天鹰座ρ' }, raHours: 20, raMinutes: 8, raSeconds: 33.7, decDegrees: -16, decMinutes: 8, decSeconds: 47, magnitude: 3.77, color: '#e8e8e8', catalog: 'zodiac' },

  // 水瓶座 (Aquarius)
  { id: 'star:bayer:beta-aqr', names: { chineseAsterism: '虚宿一', westernDesignation: 'Beta Aqr', westernSystemName: '宝瓶座β' }, raHours: 21, raMinutes: 31, raSeconds: 33.5, decDegrees: -5, decMinutes: 34, decSeconds: 16, magnitude: 2.91, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:alpha-aqr', names: { chineseAsterism: '危宿一', westernDesignation: 'Alpha Aqr', westernSystemName: '宝瓶座α' }, raHours: 22, raMinutes: 6, raSeconds: 19.6, decDegrees: -0, decMinutes: 19, decSeconds: 12, magnitude: 2.96, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:gamma-aqr', names: { chineseAsterism: '坟墓二', westernProper: 'Sadachbia', westernDesignation: 'Gamma Aqr', westernSystemName: '宝瓶座γ' }, raHours: 22, raMinutes: 21, raSeconds: 39.37542, decDegrees: -1, decMinutes: 23, decSeconds: 14.4031, magnitude: 3.849, color: '#cfe3ff', catalog: 'zodiac' },
  { id: 'star:bayer:delta-aqr', names: { westernDesignation: 'Delta Aqr', westernSystemName: '宝瓶座δ' }, raHours: 22, raMinutes: 54, raSeconds: 37.2, decDegrees: -16, decMinutes: 13, decSeconds: 33, magnitude: 3.27, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:zeta-aqr', names: { chineseAsterism: '坟墓一', westernDesignation: 'Zeta Aqr', westernSystemName: '宝瓶座ζ' }, raHours: 22, raMinutes: 23, raSeconds: 23.4, decDegrees: -10, decMinutes: 41, decSeconds: 50, magnitude: 3.97, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:epsilon-aqr', names: { chineseAsterism: '女宿一', westernDesignation: 'Epsilon Aqr', westernSystemName: '宝瓶座ε' }, raHours: 23, raMinutes: 6, raSeconds: 44.3, decDegrees: -7, decMinutes: 46, decSeconds: 59, magnitude: 3.77, color: '#b4c8ff', catalog: 'zodiac' },

  // 双鱼座 (Pisces)
  { id: 'star:bayer:alpha-psc', names: { westernProper: 'Alrescha', westernDesignation: 'Alpha Psc', westernSystemName: '双鱼座α' }, raHours: 2, raMinutes: 2, raSeconds: 2.8, decDegrees: 2, decMinutes: 45, decSeconds: 49, magnitude: 3.82, color: '#e8e8e8', catalog: 'zodiac' },
  { id: 'star:bayer:nu-psc', names: { chineseAsterism: '外屏七', westernDesignation: 'Nu Psc', westernSystemName: '双鱼座ν' }, raHours: 0, raMinutes: 26, raSeconds: 45.6, decDegrees: 5, decMinutes: 36, decSeconds: 51, magnitude: 4.27, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:eta-psc', names: { chineseAsterism: '右更二', westernDesignation: 'Eta Psc', westernSystemName: '双鱼座η' }, raHours: 1, raMinutes: 31, raSeconds: 29.0, decDegrees: 15, decMinutes: 20, decSeconds: 49, magnitude: 3.62, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:gamma-psc', names: { westernDesignation: 'Gamma Psc', westernSystemName: '双鱼座γ' }, raHours: 23, raMinutes: 17, raSeconds: 7.9, decDegrees: 1, decMinutes: 16, decSeconds: 24, magnitude: 3.69, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:omicron-psc', names: { chineseAsterism: '右更一', westernDesignation: 'Omicron Psc', westernSystemName: '双鱼座ο' }, raHours: 1, raMinutes: 14, raSeconds: 8.3, decDegrees: 6, decMinutes: 44, decSeconds: 0, magnitude: 4.94, color: '#b4c8ff', catalog: 'zodiac' },
  { id: 'star:bayer:delta-psc', names: { chineseAsterism: '外屏一', westernDesignation: 'Delta Psc', westernSystemName: '双鱼座δ' }, raHours: 23, raMinutes: 55, raSeconds: 59.6, decDegrees: 2, decMinutes: 55, decSeconds: 22, magnitude: 4.5, color: '#b4c8ff', catalog: 'zodiac' },

  // 鲸鱼座 (Cetus)
  { id: 'star:bayer:beta-cet', names: { chineseAsterism: '土司空', westernProper: 'Diphda', westernDesignation: 'Beta Cet', westernSystemName: '鲸鱼座β' }, raHours: 0, raMinutes: 43, raSeconds: 35.3709, decDegrees: -17, decMinutes: 59, decSeconds: 11.7827, magnitude: 2.02, color: '#ffd699', catalog: 'constellation' },
  { id: 'star:bayer:alpha-cet', names: { chineseAsterism: '天囷一', westernProper: 'Menkar', westernDesignation: 'Alpha Cet', westernSystemName: '鲸鱼座α' }, raHours: 3, raMinutes: 2, raSeconds: 16.77307, decDegrees: 4, decMinutes: 5, decSeconds: 23.0596, magnitude: 2.53, color: '#ffb07c', catalog: 'constellation' },

  // ===== 其他重要星座 (Other Major Constellations) =====

  // 猎户座 (Orion)
  // Verified: 觜宿一 = λ Orionis (Meissa)
  { id: 'star:bayer:lambda-ori', names: { chineseAsterism: '觜宿一', westernProper: 'Meissa', westernDesignation: 'Lambda Ori', westernSystemName: '猎户座λ' }, raHours: 5, raMinutes: 35, raSeconds: 8.3, decDegrees: 9, decMinutes: 56, decSeconds: 2.9, magnitude: 3.47, color: '#d8e6ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-ori', names: { chineseAsterism: '参宿七', westernDesignation: 'Beta Ori', westernSystemName: '猎户座β' }, raHours: 5, raMinutes: 14, raSeconds: 32.3, decDegrees: -8, decMinutes: 12, decSeconds: 5.9, magnitude: 0.12, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-ori', names: { chineseAsterism: '参宿三', westernDesignation: 'Epsilon Ori', westernSystemName: '猎户座ε' }, raHours: 5, raMinutes: 31, raSeconds: 38.4, decDegrees: -1, decMinutes: 12, decSeconds: 6.9, magnitude: 1.77, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-ori', names: { chineseAsterism: '参宿二', westernDesignation: 'Delta Ori', westernSystemName: '猎户座δ' }, raHours: 5, raMinutes: 32, raSeconds: 0.4, decDegrees: -0, decMinutes: 17, decSeconds: 46.9, magnitude: 1.69, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:zeta-ori', names: { chineseAsterism: '参宿一', westernDesignation: 'Zeta Ori', westernSystemName: '猎户座ζ' }, raHours: 5, raMinutes: 40, raSeconds: 45.5, decDegrees: -1, decMinutes: 56, decSeconds: 33.8, magnitude: 1.74, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-ori', names: { chineseAsterism: '参宿五', westernDesignation: 'Gamma Ori', westernSystemName: '猎户座γ' }, raHours: 5, raMinutes: 26, raSeconds: 17.5, decDegrees: 6, decMinutes: 20, decSeconds: 58.9, magnitude: 1.64, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:kappa-ori', names: { chineseAsterism: '参宿六', westernProper: 'Saiph', westernDesignation: 'Kappa Ori', westernSystemName: '猎户座κ' }, raHours: 5, raMinutes: 47, raSeconds: 45.4, decDegrees: -9, decMinutes: 40, decSeconds: 10.6, magnitude: 2.06, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:flamsteed:4-ori', names: { chineseAsterism: '参旗一', westernDesignation: '4 Ori', westernSystemName: '猎户座4' }, raHours: 4, raMinutes: 52, raSeconds: 32.0, decDegrees: 14, decMinutes: 15, decSeconds: 2.3, magnitude: 4.71, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:flamsteed:9-ori', names: { chineseAsterism: '参旗二', westernDesignation: '9 Ori', westernSystemName: '猎户座9' }, raHours: 4, raMinutes: 56, raSeconds: 22.3, decDegrees: 13, decMinutes: 30, decSeconds: 52.1, magnitude: 4.06, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:flamsteed:6-ori', names: { chineseAsterism: '参旗三', westernDesignation: '6 Ori', westernSystemName: '猎户座6' }, raHours: 4, raMinutes: 54, raSeconds: 46.9, decDegrees: 11, decMinutes: 25, decSeconds: 33.6, magnitude: 5.18, color: '#b4c8ff', catalog: 'constellation' },

  // 大犬座 (Canis Major)
  { id: 'star:bayer:epsilon-cma', names: { chineseAsterism: '弧矢七', westernProper: 'Adhara', westernDesignation: 'Epsilon CMa', westernSystemName: '大犬座ε' }, raHours: 6, raMinutes: 58, raSeconds: 37.5, decDegrees: -28, decMinutes: 58, decSeconds: 19.5, magnitude: 1.5, color: '#e9f4ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-cma', names: { chineseAsterism: '弧矢一', westernDesignation: 'Delta CMa', westernSystemName: '大犬座δ' }, raHours: 7, raMinutes: 8, raSeconds: 23.5, decDegrees: -26, decMinutes: 23, decSeconds: 35.5, magnitude: 1.83, color: '#e9f4ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-cma', names: { chineseAsterism: '军市一', westernProper: 'Mirzam', westernDesignation: 'Beta CMa', westernSystemName: '大犬座β' }, raHours: 6, raMinutes: 22, raSeconds: 42.0, decDegrees: -17, decMinutes: 57, decSeconds: 21.3, magnitude: 1.98, color: '#e9f4ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-cma', names: { chineseAsterism: '天狼增四', westernDesignation: 'Gamma CMa', westernSystemName: '大犬座γ' }, raHours: 7, raMinutes: 3, raSeconds: 45.5, decDegrees: -15, decMinutes: 37, decSeconds: 59.8, magnitude: 4.11, color: '#e9f4ff', catalog: 'constellation' },

  // 小犬座 (Canis Minor)
  { id: 'star:bayer:epsilon-cmi', names: { chineseAsterism: '南河一', westernDesignation: 'Epsilon CMi', westernSystemName: '小犬座ε' }, raHours: 7, raMinutes: 25, raSeconds: 38.9, decDegrees: 9, decMinutes: 16, decSeconds: 33.9, magnitude: 4.99, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-cmi', names: { chineseAsterism: '南河二', westernProper: 'Gomeisa', westernDesignation: 'Beta CMi', westernSystemName: '小犬座β' }, raHours: 7, raMinutes: 27, raSeconds: 9.0, decDegrees: 8, decMinutes: 17, decSeconds: 21.5, magnitude: 2.89, color: '#ffe4b5', catalog: 'constellation' },

  // 御夫座 (Auriga)
  { id: 'star:bayer:iota-aur', names: { chineseAsterism: '五车一', westernDesignation: 'Iota Aur', westernSystemName: '御夫座ι' }, raHours: 4, raMinutes: 56, raSeconds: 59.5, decDegrees: 33, decMinutes: 9, decSeconds: 48, magnitude: 2.69, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:alpha-aur', names: { chineseAsterism: '五车二', westernDesignation: 'Alpha Aur', westernSystemName: '御夫座α' }, raHours: 5, raMinutes: 16, raSeconds: 41.3, decDegrees: 45, decMinutes: 59, decSeconds: 52.8, magnitude: 0.08, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-aur', names: { chineseAsterism: '五车三', westernDesignation: 'Beta Aur', westernSystemName: '御夫座β' }, raHours: 5, raMinutes: 59, raSeconds: 31.7, decDegrees: 44, decMinutes: 56, decSeconds: 50.8, magnitude: 1.9, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:theta-aur', names: { chineseAsterism: '五车四', westernDesignation: 'Theta Aur', westernSystemName: '御夫座θ' }, raHours: 5, raMinutes: 59, raSeconds: 43.3, decDegrees: 37, decMinutes: 12, decSeconds: 45.3, magnitude: 2.65, color: '#ffe4b5', catalog: 'constellation' },

  // 金牛座 (Taurus) - already have some
  { id: 'star:bayer:zeta-tau', names: { chineseAsterism: '天关', westernProper: 'Tianguan', westernDesignation: 'Zeta Tau', westernSystemName: '金牛座ζ' }, raHours: 5, raMinutes: 35, raSeconds: 15.4, decDegrees: 21, decMinutes: 8, decSeconds: 22, magnitude: 3.8, color: '#ffd699', catalog: 'constellation' },
  { id: 'star:bayer:mu-tau', names: { chineseAsterism: '毕宿增七', westernDesignation: 'Mu Tau', westernSystemName: '金牛座μ' }, raHours: 4, raMinutes: 15, raSeconds: 32.1, decDegrees: 8, decMinutes: 53, decSeconds: 32.5, magnitude: 4.27, color: '#ffd699', catalog: 'constellation' },
  { id: 'star:flamsteed:29-tau', names: { chineseAsterism: '天廪增二', westernDesignation: '29 Tau', westernSystemName: '金牛座29' }, raHours: 3, raMinutes: 45, raSeconds: 40.4, decDegrees: 6, decMinutes: 3, decSeconds: 0.0, magnitude: 5.34, color: '#ffd699', catalog: 'constellation' },

  // 室女座 (Virgo) - already have some
  { id: 'star:bayer:epsilon-vir', names: { chineseAsterism: '太微左垣四', westernDesignation: 'Epsilon Vir', westernSystemName: '室女座ε' }, raHours: 13, raMinutes: 2, raSeconds: 10.6, decDegrees: 10, decMinutes: 57, decSeconds: 32.9, magnitude: 2.85, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:kappa-vir', names: { chineseAsterism: '亢宿一', westernDesignation: 'Kappa Vir', westernSystemName: '室女座κ' }, raHours: 14, raMinutes: 12, raSeconds: 53.7, decDegrees: -10, decMinutes: 16, decSeconds: 25.3, magnitude: 4.18, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:sigma-leo', names: { chineseAsterism: '太微右垣二', westernDesignation: 'Sigma Leo', westernSystemName: '狮子座σ' }, raHours: 11, raMinutes: 21, raSeconds: 8.2, decDegrees: 6, decMinutes: 1, decSeconds: 45.6, magnitude: 4.05, color: '#b4c8ff', catalog: 'constellation' },

  // 牧夫座 (Boötes)
  { id: 'star:flamsteed:51-boo', names: { chineseAsterism: '七公六', westernProper: 'Alkalurops', westernDesignation: '51 Boo', westernSystemName: '牧夫座51' }, raHours: 15, raMinutes: 24, raSeconds: 29.5, decDegrees: 37, decMinutes: 22, decSeconds: 37.8, magnitude: 4.31, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-boo', names: { chineseAsterism: '招摇-2', westernProper: 'Seginus', westernDesignation: 'Gamma Boo', westernSystemName: '牧夫座γ' }, raHours: 14, raMinutes: 32, raSeconds: 4.7, decDegrees: 38, decMinutes: 18, decSeconds: 29.7, magnitude: 3.04, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:kappa-boo', names: { westernDesignation: 'Kappa Boo', westernSystemName: '牧夫座κ' }, raHours: 14, raMinutes: 13, raSeconds: 29.0, decDegrees: 51, decMinutes: 47, decSeconds: 15, magnitude: 4.54, color: '#ffe4b5', catalog: 'constellation' },

  // 天琴座 (Lyra)
  { id: 'star:flamsteed:4-lyr', names: { chineseAsterism: '织女二', westernDesignation: '4 Lyr', westernSystemName: '天琴座4' }, raHours: 18, raMinutes: 44, raSeconds: 20.3, decDegrees: 39, decMinutes: 40, decSeconds: 12.4, magnitude: 4.67, color: '#cfe3ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-lyr', names: { chineseAsterism: '渐台二', westernProper: 'Sheliak', westernDesignation: 'Beta Lyr', westernSystemName: '天琴座β' }, raHours: 18, raMinutes: 45, raSeconds: 42.6, decDegrees: 33, decMinutes: 21, decSeconds: 53, magnitude: 3.47, color: '#cfe3ff', catalog: 'constellation' },
  { id: 'star:flamsteed:13-lyr', names: { chineseAsterism: '辇道一', westernDesignation: '13 Lyr', westernSystemName: '天琴座13' }, raHours: 18, raMinutes: 55, raSeconds: 20.1, decDegrees: 43, decMinutes: 56, decSeconds: 45.9, magnitude: 4.08, color: '#cfe3ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-lyr', names: { westernDesignation: 'Delta Lyr', westernSystemName: '天琴座δ' }, raHours: 18, raMinutes: 53, raSeconds: 3.7, decDegrees: 36, decMinutes: 58, decSeconds: 43, magnitude: 4.22, color: '#cfe3ff', catalog: 'constellation' },

  // 天鹅座 (Cygnus)
  { id: 'star:bayer:gamma-cyg', names: { chineseAsterism: '天津一', westernProper: 'Sadr', westernDesignation: 'Gamma Cyg', westernSystemName: '天鹅座γ' }, raHours: 20, raMinutes: 22, raSeconds: 13.7, decDegrees: 40, decMinutes: 15, decSeconds: 24, magnitude: 2.23, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-cyg', names: { chineseAsterism: '天津九', westernProper: 'Aljanah', westernDesignation: 'Epsilon Cyg', westernSystemName: '天鹅座ε' }, raHours: 20, raMinutes: 46, raSeconds: 12.6, decDegrees: 33, decMinutes: 58, decSeconds: 12.9, magnitude: 2.48, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-cyg', names: { chineseAsterism: '天津二', westernProper: 'Fawaris', westernDesignation: 'Delta Cyg', westernSystemName: '天鹅座δ' }, raHours: 19, raMinutes: 50, raSeconds: 46.99855, decDegrees: 45, decMinutes: 7, decSeconds: 52, magnitude: 2.87, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:bayer:zeta-cyg', names: { chineseAsterism: '天津八', westernDesignation: 'Zeta Cyg', westernSystemName: '天鹅座ζ' }, raHours: 21, raMinutes: 12, raSeconds: 56.2, decDegrees: 30, decMinutes: 13, decSeconds: 36.9, magnitude: 3.21, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-cyg', names: { chineseAsterism: '辇道增七', westernProper: 'Albireo', westernDesignation: 'Beta Cyg', westernSystemName: '天鹅座β' }, raHours: 19, raMinutes: 30, raSeconds: 43.3, decDegrees: 27, decMinutes: 57, decSeconds: 34.9, magnitude: 3.05, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:bayer:chi-cyg', names: { westernDesignation: 'Chi Cyg', westernSystemName: '天鹅座χ' }, raHours: 19, raMinutes: 50, raSeconds: 34.8, decDegrees: 32, decMinutes: 54, decSeconds: 53, magnitude: 3.32, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:bayer:nu-cyg', names: { chineseAsterism: '天津五', westernDesignation: 'Nu Cyg', westernSystemName: '天鹅座ν' }, raHours: 20, raMinutes: 57, raSeconds: 10.4, decDegrees: 41, decMinutes: 10, decSeconds: 1.7, magnitude: 3.94, color: '#eef5ff', catalog: 'constellation' },

  // 天鹰座 (Aquila)
  { id: 'star:bayer:beta-aql', names: { chineseAsterism: '河鼓一', westernProper: 'Alshain', westernDesignation: 'Beta Aql', westernSystemName: '天鹰座β' }, raHours: 19, raMinutes: 55, raSeconds: 16.6, decDegrees: 11, decMinutes: 56, decSeconds: 39, magnitude: 3.71, color: '#fff0d6', catalog: 'constellation' },
  { id: 'star:bayer:gamma-aql', names: { chineseAsterism: '河鼓三', westernProper: 'Tarazed', westernDesignation: 'Gamma Aql', westernSystemName: '天鹰座γ' }, raHours: 20, raMinutes: 1, raSeconds: 47.0, decDegrees: 14, decMinutes: 2, decSeconds: 2, magnitude: 2.72, color: '#fff0d6', catalog: 'constellation' },
  // Verified: 天市左垣六 = ζ Aquilae
  { id: 'star:bayer:zeta-aql', names: { chineseAsterism: '天市左垣六', westernProper: 'Deneb el Okab', westernDesignation: 'Zeta Aql', westernSystemName: '天鹰座ζ' }, raHours: 19, raMinutes: 5, raSeconds: 24.3, decDegrees: 13, decMinutes: 51, decSeconds: 49, magnitude: 2.99, color: '#fff0d6', catalog: 'constellation' },
  { id: 'star:bayer:theta-aql', names: { westernDesignation: 'Theta Aql', westernSystemName: '天鹰座θ' }, raHours: 20, raMinutes: 11, raSeconds: 19.2, decDegrees: 0, decMinutes: 49, decSeconds: 17, magnitude: 3.22, color: '#fff0d6', catalog: 'constellation' },
  { id: 'star:bayer:delta-aql', names: { chineseAsterism: '右旗三', westernDesignation: 'Delta Aql', westernSystemName: '天鹰座δ' }, raHours: 19, raMinutes: 25, raSeconds: 29.9, decDegrees: 3, decMinutes: 6, decSeconds: 53, magnitude: 3.35, color: '#fff0d6', catalog: 'constellation' },

  // 飞马座 (Pegasus)
  { id: 'star:bayer:epsilon-peg', names: { chineseAsterism: '危宿三', westernProper: 'Enif', westernDesignation: 'Epsilon Peg', westernSystemName: '飞马座ε' }, raHours: 21, raMinutes: 44, raSeconds: 11.15614, decDegrees: 9, decMinutes: 52, decSeconds: 30.0311, magnitude: 2.41, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:alpha-peg', names: { chineseAsterism: '室宿一', westernProper: 'Markab', westernDesignation: 'Alpha Peg', westernSystemName: '飞马座α' }, raHours: 23, raMinutes: 4, raSeconds: 45.6, decDegrees: 15, decMinutes: 12, decSeconds: 19, magnitude: 2.49, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:beta-peg', names: { chineseAsterism: '室宿二', westernProper: 'Scheat', westernDesignation: 'Beta Peg', westernSystemName: '飞马座β' }, raHours: 23, raMinutes: 3, raSeconds: 46.45746, decDegrees: 28, decMinutes: 4, decSeconds: 58.0336, magnitude: 2.42, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:gamma-peg', names: { chineseAsterism: '壁宿一', westernDesignation: 'Gamma Peg', westernSystemName: '飞马座γ' }, raHours: 0, raMinutes: 13, raSeconds: 14.2, decDegrees: 15, decMinutes: 11, decSeconds: 0.9, magnitude: 2.83, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:alpha-and', names: { chineseAsterism: '壁宿二', westernProper: 'Alpheratz', westernDesignation: 'Alpha And', westernSystemName: '仙女座α' }, raHours: 0, raMinutes: 8, raSeconds: 23.2, decDegrees: 29, decMinutes: 5, decSeconds: 25.6, magnitude: 2.07, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:eta-peg', names: { chineseAsterism: '离宫四', westernDesignation: 'Eta Peg', westernSystemName: '飞马座η' }, raHours: 22, raMinutes: 43, raSeconds: 0.3, decDegrees: 30, decMinutes: 13, decSeconds: 18, magnitude: 2.93, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:zeta-peg', names: { westernDesignation: 'Zeta Peg', westernSystemName: '飞马座ζ' }, raHours: 22, raMinutes: 52, raSeconds: 2.1, decDegrees: 10, decMinutes: 48, decSeconds: 49, magnitude: 3.4, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:mu-peg', names: { westernDesignation: 'Mu Peg', westernSystemName: '飞马座μ' }, raHours: 23, raMinutes: 0, raSeconds: 17.1, decDegrees: 21, decMinutes: 30, decSeconds: 29, magnitude: 3.48, color: '#ff9f7f', catalog: 'constellation' },

  // 仙女座 (Andromeda)
  { id: 'star:bayer:beta-and', names: { chineseAsterism: '奎宿九', westernProper: 'Mirach', westernDesignation: 'Beta And', westernSystemName: '仙女座β' }, raHours: 1, raMinutes: 9, raSeconds: 43.1, decDegrees: 35, decMinutes: 37, decSeconds: 12, magnitude: 2.17, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:flamsteed:57-and', names: { chineseAsterism: '天大将军一', westernProper: 'Almach', westernDesignation: '57 And', westernSystemName: '仙女座57' }, raHours: 2, raMinutes: 3, raSeconds: 53.9, decDegrees: 42, decMinutes: 19, decSeconds: 47.0, magnitude: 2.1, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-and', names: { westernDesignation: 'Delta And', westernSystemName: '仙女座δ' }, raHours: 0, raMinutes: 22, raSeconds: 31.6, decDegrees: 30, decMinutes: 52, decSeconds: 5, magnitude: 3.28, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:pi-and', names: { chineseAsterism: '奎宿六', westernDesignation: 'Pi And', westernSystemName: '仙女座π' }, raHours: 0, raMinutes: 36, raSeconds: 22.8, decDegrees: 33, decMinutes: 43, decSeconds: 7, magnitude: 4.36, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:upsilon-and', names: { chineseAsterism: '天大将军六', westernDesignation: 'Upsilon And', westernSystemName: '仙女座υ' }, raHours: 1, raMinutes: 36, raSeconds: 47.9, decDegrees: 41, decMinutes: 24, decSeconds: 19.7, magnitude: 4.1, color: '#b4c8ff', catalog: 'constellation' },

  // 英仙座 (Perseus)
  // Verified: Mirfak = α Persei = 天船三; Algol = β Persei = 大陵五
  { id: 'star:bayer:alpha-per', names: { chineseAsterism: '天船三', westernProper: 'Mirfak', westernDesignation: 'Alpha Per', westernSystemName: '英仙座α' }, raHours: 3, raMinutes: 24, raSeconds: 19.4, decDegrees: 49, decMinutes: 51, decSeconds: 40, magnitude: 1.79, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-per', names: { chineseAsterism: '大陵五', westernProper: 'Algol', westernDesignation: 'Beta Per', westernSystemName: '英仙座β' }, raHours: 3, raMinutes: 8, raSeconds: 10.1, decDegrees: 40, decMinutes: 57, decSeconds: 21, magnitude: 2.12, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-per', names: { chineseAsterism: '卷舌二', westernDesignation: 'Epsilon Per', westernSystemName: '英仙座ε' }, raHours: 3, raMinutes: 57, raSeconds: 51.4, decDegrees: 40, decMinutes: 0, decSeconds: 36, magnitude: 2.89, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-per', names: { chineseAsterism: '卷舌四', westernDesignation: 'Zeta Per', westernSystemName: '英仙座ζ' }, raHours: 3, raMinutes: 54, raSeconds: 22.6, decDegrees: 31, decMinutes: 53, decSeconds: 16, magnitude: 4.04, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-per', names: { chineseAsterism: '天船二', westernDesignation: 'Gamma Per', westernSystemName: '英仙座γ' }, raHours: 3, raMinutes: 4, raSeconds: 47.8, decDegrees: 53, decMinutes: 30, decSeconds: 23.2, magnitude: 2.91, color: '#ffe4b5', catalog: 'constellation' },

  // 仙王座 (Cepheus)
  { id: 'star:bayer:alpha-cep', names: { westernProper: 'Alderamin', westernDesignation: 'Alpha Cep', westernSystemName: '仙王座α' }, raHours: 21, raMinutes: 18, raSeconds: 34.7723, decDegrees: 62, decMinutes: 35, decSeconds: 8.069, magnitude: 2.46, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-cep', names: { westernDesignation: 'Beta Cep', westernSystemName: '仙王座β' }, raHours: 21, raMinutes: 28, raSeconds: 43.2, decDegrees: 70, decMinutes: 33, decSeconds: 38, magnitude: 3.23, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-cep', names: { westernDesignation: 'Gamma Cep', westernSystemName: '仙王座γ' }, raHours: 23, raMinutes: 3, raSeconds: 53.1, decDegrees: 56, decMinutes: 59, decSeconds: 26, magnitude: 3.22, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:delta-cep', names: { chineseAsterism: '造父一', westernDesignation: 'Delta Cep', westernSystemName: '仙王座δ' }, raHours: 22, raMinutes: 29, raSeconds: 17.1, decDegrees: 58, decMinutes: 24, decSeconds: 50, magnitude: 4.07, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-cep', names: { westernDesignation: 'Zeta Cep', westernSystemName: '仙王座ζ' }, raHours: 22, raMinutes: 10, raSeconds: 36.3, decDegrees: 57, decMinutes: 59, decSeconds: 51, magnitude: 3.35, color: '#ffe4b5', catalog: 'constellation' },

  // 天龙座 (Draco)
  { id: 'star:bayer:alpha-dra', names: { westernProper: 'Thuban', westernDesignation: 'Alpha Dra', westernSystemName: '天龙座α' }, raHours: 14, raMinutes: 4, raSeconds: 23.3498, decDegrees: 64, decMinutes: 22, decSeconds: 33.062, magnitude: 3.67, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-dra', names: { westernProper: 'Rastaban', westernDesignation: 'Beta Dra', westernSystemName: '天龙座β' }, raHours: 17, raMinutes: 30, raSeconds: 25.9617, decDegrees: 52, decMinutes: 18, decSeconds: 4.9993, magnitude: 2.79, color: '#ffd699', catalog: 'constellation' },
  { id: 'star:bayer:eta-dra', names: { chineseAsterism: '紫微左垣三', westernProper: 'Athebyne', westernDesignation: 'Eta Dra', westernSystemName: '天龙座η' }, raHours: 16, raMinutes: 23, raSeconds: 59.48594, decDegrees: 61, decMinutes: 30, decSeconds: 51.1699, magnitude: 2.73, color: '#ffd699', catalog: 'constellation' },
  { id: 'star:bayer:gamma-dra', names: { westernProper: 'Eltanin', westernDesignation: 'Gamma Dra', westernSystemName: '天龙座γ' }, raHours: 17, raMinutes: 56, raSeconds: 36.36988, decDegrees: 51, decMinutes: 29, decSeconds: 20.0242, magnitude: 2.23, color: '#ffb07c', catalog: 'constellation' },
  { id: 'star:bayer:delta-dra', names: { chineseAsterism: '天厨一', westernProper: 'Altais', westernDesignation: 'Delta Dra', westernSystemName: '天龙座δ' }, raHours: 19, raMinutes: 12, raSeconds: 33.30137, decDegrees: 67, decMinutes: 39, decSeconds: 41.5392, magnitude: 3.07, color: '#ffd699', catalog: 'constellation' },

  // 仙后座 (Cassiopeia)
  { id: 'star:bayer:beta-cas', names: { chineseAsterism: '王良一', westernProper: 'Caph', westernDesignation: 'Beta Cas', westernSystemName: '仙后座β' }, raHours: 0, raMinutes: 9, raSeconds: 10.4, decDegrees: 59, decMinutes: 8, decSeconds: 59.2, magnitude: 2.28, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:alpha-cas', names: { chineseAsterism: '王良四', westernProper: 'Schedar', westernDesignation: 'Alpha Cas', westernSystemName: '仙后座α' }, raHours: 0, raMinutes: 40, raSeconds: 30.4, decDegrees: 56, decMinutes: 32, decSeconds: 14.4, magnitude: 2.24, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:eta-cas', names: { chineseAsterism: '王良三', westernProper: 'Achird', westernDesignation: 'Eta Cas', westernSystemName: '仙后座η' }, raHours: 0, raMinutes: 49, raSeconds: 5.7, decDegrees: 57, decMinutes: 48, decSeconds: 54.7, magnitude: 3.46, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-cas', names: { chineseAsterism: '策', westernProper: 'Cih', westernDesignation: 'Gamma Cas', westernSystemName: '仙后座γ' }, raHours: 0, raMinutes: 56, raSeconds: 42.5, decDegrees: 60, decMinutes: 43, decSeconds: 0.3, magnitude: 2.15, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:delta-cas', names: { westernProper: 'Ruchbah', westernDesignation: 'Delta Cas', westernSystemName: '仙后座δ' }, raHours: 1, raMinutes: 25, raSeconds: 48.9, decDegrees: 60, decMinutes: 14, decSeconds: 7, magnitude: 2.68, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-cas', names: { westernProper: 'Segin', westernDesignation: 'Epsilon Cas', westernSystemName: '仙后座ε' }, raHours: 1, raMinutes: 54, raSeconds: 23.7, decDegrees: 63, decMinutes: 40, decSeconds: 12, magnitude: 3.37, color: '#eef5ff', catalog: 'constellation' },
  { id: 'star:bayer:kappa-cas', names: { chineseAsterism: '王良二', westernDesignation: 'Kappa Cas', westernSystemName: '仙后座κ' }, raHours: 0, raMinutes: 32, raSeconds: 59.9, decDegrees: 62, decMinutes: 56, decSeconds: 3, magnitude: 4.16, color: '#ffe4b5', catalog: 'constellation' },

  // 鹿豹座 (Camelopardalis)
  { id: 'star:bayer:alpha-cam', names: { chineseAsterism: '紫微右垣六', westernDesignation: 'Alpha Cam', westernSystemName: '鹿豹座α' }, raHours: 4, raMinutes: 54, raSeconds: 3.0, decDegrees: 66, decMinutes: 22, decSeconds: 47, magnitude: 4.29, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-cam', names: { westernDesignation: 'Beta Cam', westernSystemName: '鹿豹座β' }, raHours: 5, raMinutes: 3, raSeconds: 25.4, decDegrees: 60, decMinutes: 26, decSeconds: 32, magnitude: 4.03, color: '#e8e8e8', catalog: 'constellation' },

  // 猎犬座 (Canes Venatici)
  { id: 'star:bayer:alpha-cvn', names: { chineseAsterism: '常陈一', westernDesignation: 'Alpha CVn', westernSystemName: '猎犬座α' }, raHours: 12, raMinutes: 56, raSeconds: 0.0, decDegrees: 38, decMinutes: 19, decSeconds: 6, magnitude: 2.89, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-cvn', names: { chineseAsterism: '常陈四', westernDesignation: 'Beta CVn', westernSystemName: '猎犬座β' }, raHours: 12, raMinutes: 33, raSeconds: 54.4, decDegrees: 41, decMinutes: 21, decSeconds: 24, magnitude: 4.24, color: '#ffe4b5', catalog: 'constellation' },

  // 室女座 (Coma Berenices)

  // 后发座 (Coma Berenices)
  { id: 'star:bayer:beta-com', names: { chineseAsterism: '周鼎一', westernDesignation: 'Beta Com', westernSystemName: '后发座β' }, raHours: 13, raMinutes: 11, raSeconds: 52.4, decDegrees: 27, decMinutes: 52, decSeconds: 50, magnitude: 4.24, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:alpha-com', names: { chineseAsterism: '太微左垣五', westernDesignation: 'Alpha Com', westernSystemName: '后发座α' }, raHours: 13, raMinutes: 6, raSeconds: 27.3, decDegrees: 17, decMinutes: 31, decSeconds: 45, magnitude: 4.32, color: '#b4c8ff', catalog: 'constellation' },

  // 巨蛇座 (Serpens)
  { id: 'star:bayer:alpha-ser', names: { chineseAsterism: '天市右垣七', westernDesignation: 'Alpha Ser', westernSystemName: '巨蛇座α' }, raHours: 15, raMinutes: 44, raSeconds: 16.4, decDegrees: 6, decMinutes: 25, decSeconds: 29, magnitude: 2.63, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:delta-ser', names: { chineseAsterism: '天市右垣六', westernDesignation: 'Delta Ser', westernSystemName: '巨蛇座δ' }, raHours: 15, raMinutes: 34, raSeconds: 53.1, decDegrees: 10, decMinutes: 34, decSeconds: 48, magnitude: 3.8, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-ser', names: { westernDesignation: 'Epsilon Ser', westernSystemName: '巨蛇座ε' }, raHours: 15, raMinutes: 51, raSeconds: 48.5, decDegrees: 4, decMinutes: 55, decSeconds: 42, magnitude: 3.69, color: '#ffe4b5', catalog: 'constellation' },

  // 蛇夫座 (Ophiuchus)
  // Verified: Rasalhague = α Ophiuchi = 侯
  { id: 'star:bayer:alpha-oph', names: { chineseAsterism: '候', westernProper: 'Rasalhague', westernDesignation: 'Alpha Oph', westernSystemName: '蛇夫座α' }, raHours: 17, raMinutes: 34, raSeconds: 59.0, decDegrees: 12, decMinutes: 33, decSeconds: 36, magnitude: 2.07, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-oph', names: { chineseAsterism: '宗正一', westernDesignation: 'Beta Oph', westernSystemName: '蛇夫座β' }, raHours: 17, raMinutes: 43, raSeconds: 28.4, decDegrees: 4, decMinutes: 34, decSeconds: 2.3, magnitude: 2.76, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-oph', names: { chineseAsterism: '天市右垣十一', westernDesignation: 'Zeta Oph', westernSystemName: '蛇夫座ζ' }, raHours: 16, raMinutes: 37, raSeconds: 51.4, decDegrees: -10, decMinutes: 33, decSeconds: 51, magnitude: 2.54, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:eta-oph', names: { chineseAsterism: '天市左垣十一', westernDesignation: 'Eta Oph', westernSystemName: '蛇夫座η' }, raHours: 17, raMinutes: 10, raSeconds: 22.7, decDegrees: -15, decMinutes: 43, decSeconds: 30, magnitude: 2.43, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-ser', names: { chineseAsterism: '郑', westernDesignation: 'Gamma Ser', westernSystemName: '巨蛇座γ' }, raHours: 15, raMinutes: 56, raSeconds: 27.2, decDegrees: 15, decMinutes: 39, decSeconds: 41.8, magnitude: 3.85, color: '#ffe4b5', catalog: 'constellation' },

  // 武仙座 (Hercules)
  { id: 'star:bayer:alpha-her', names: { chineseAsterism: '帝座', westernProper: 'Rasalgethi', westernDesignation: 'Alpha Her', westernSystemName: '武仙座α' }, raHours: 17, raMinutes: 14, raSeconds: 38.9, decDegrees: 14, decMinutes: 23, decSeconds: 25, magnitude: 2.78, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:theta-ser', names: { chineseAsterism: '天市左垣七', westernDesignation: 'Theta Ser', westernSystemName: '巨蛇座θ' }, raHours: 18, raMinutes: 56, raSeconds: 13.2, decDegrees: 4, decMinutes: 12, decSeconds: 12.9, magnitude: 4.62, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-her', names: { westernDesignation: 'Beta Her', westernSystemName: '武仙座β' }, raHours: 16, raMinutes: 43, raSeconds: 49.4, decDegrees: 21, decMinutes: 29, decSeconds: 56, magnitude: 2.77, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-her', names: { chineseAsterism: '天市右垣二', westernDesignation: 'Gamma Her', westernSystemName: '武仙座γ' }, raHours: 16, raMinutes: 21, raSeconds: 55.5, decDegrees: 19, decMinutes: 9, decSeconds: 15, magnitude: 3.75, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:delta-her', names: { westernDesignation: 'Delta Her', westernSystemName: '武仙座δ' }, raHours: 17, raMinutes: 19, raSeconds: 51.7, decDegrees: 24, decMinutes: 50, decSeconds: 21, magnitude: 3.61, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-her', names: { chineseAsterism: '天纪二', westernDesignation: 'Zeta Her', westernSystemName: '武仙座ζ' }, raHours: 16, raMinutes: 41, raSeconds: 17.2, decDegrees: 31, decMinutes: 36, decSeconds: 22, magnitude: 2.93, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-her', names: { westernDesignation: 'Epsilon Her', westernSystemName: '武仙座ε' }, raHours: 17, raMinutes: 3, raSeconds: 33.4, decDegrees: 30, decMinutes: 55, decSeconds: 20, magnitude: 3.92, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:pi-her', names: { chineseAsterism: '女床一', westernDesignation: 'Pi Her', westernSystemName: '武仙座π' }, raHours: 17, raMinutes: 15, raSeconds: 19.8, decDegrees: 36, decMinutes: 48, decSeconds: 33, magnitude: 3.16, color: '#ffe4b5', catalog: 'constellation' },

  // 天蝎座 (Scorpius) - additional
  { id: 'star:bayer:eta-sco', names: { chineseAsterism: '尾宿四', westernDesignation: 'Eta Sco', westernSystemName: '天蝎座η' }, raHours: 17, raMinutes: 12, raSeconds: 9.2, decDegrees: -43, decMinutes: 14, decSeconds: 21.1, magnitude: 3.32, color: '#ff7f50', catalog: 'constellation' },
  { id: 'star:bayer:theta-sco', names: { chineseAsterism: '尾宿五', westernDesignation: 'Theta Sco', westernSystemName: '天蝎座θ' }, raHours: 17, raMinutes: 37, raSeconds: 19.1, decDegrees: -42, decMinutes: 59, decSeconds: 52.2, magnitude: 1.86, color: '#ff7f50', catalog: 'constellation' },
  { id: 'star:bayer:iota-sco', names: { chineseAsterism: '尾宿六', westernDesignation: 'Iota Sco', westernSystemName: '天蝎座ι' }, raHours: 17, raMinutes: 47, raSeconds: 35.1, decDegrees: -40, decMinutes: 7, decSeconds: 37.2, magnitude: 2.99, color: '#ff7f50', catalog: 'constellation' },
  { id: 'star:bayer:kappa-sco', names: { chineseAsterism: '尾宿七', westernDesignation: 'Kappa Sco', westernSystemName: '天蝎座κ' }, raHours: 17, raMinutes: 42, raSeconds: 29.3, decDegrees: -39, decMinutes: 1, decSeconds: 47.9, magnitude: 2.39, color: '#ff7f50', catalog: 'constellation' },
  { id: 'star:bayer:upsilon-sco', names: { chineseAsterism: '尾宿九', westernDesignation: 'Upsilon Sco', westernSystemName: '天蝎座υ' }, raHours: 17, raMinutes: 30, raSeconds: 45.8, decDegrees: -37, decMinutes: 17, decSeconds: 44.9, magnitude: 2.7, color: '#ff7f50', catalog: 'constellation' },

  // 半人马座 (Centaurus)
  { id: 'star:bayer:alpha-cen', names: { chineseAsterism: '南门二', westernProper: 'Rigil Kentaurus', westernDesignation: 'Alpha Cen', westernSystemName: '半人马座α' }, raHours: 14, raMinutes: 39, raSeconds: 36.5, decDegrees: -60, decMinutes: 50, decSeconds: 2, magnitude: -0.27, color: '#ffe4b5', catalog: 'constellation' },
  // Verified: 马腹一 = β Centauri (Hadar)
  { id: 'star:bayer:beta-cen', names: { chineseAsterism: '马腹一', westernProper: 'Hadar', westernDesignation: 'Beta Cen', westernSystemName: '半人马座β' }, raHours: 14, raMinutes: 3, raSeconds: 49.4, decDegrees: -60, decMinutes: 22, decSeconds: 57, magnitude: 0.61, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-cen', names: { chineseAsterism: '库楼七', westernDesignation: 'Gamma Cen', westernSystemName: '半人马座γ' }, raHours: 12, raMinutes: 26, raSeconds: 35.0, decDegrees: -48, decMinutes: 57, decSeconds: 35, magnitude: 2.17, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-cen', names: { chineseAsterism: '南门一', westernDesignation: 'Epsilon Cen', westernSystemName: '半人马座ε' }, raHours: 13, raMinutes: 39, raSeconds: 53.3, decDegrees: -53, decMinutes: 38, decSeconds: 4, magnitude: 2.3, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-cen', names: { chineseAsterism: '库楼一', westernDesignation: 'Zeta Cen', westernSystemName: '半人马座ζ' }, raHours: 13, raMinutes: 56, raSeconds: 26.5, decDegrees: -47, decMinutes: 10, decSeconds: 22, magnitude: 2.55, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:theta-cen', names: { westernProper: 'Menkent', westernDesignation: 'Theta Cen', westernSystemName: '半人马座θ' }, raHours: 14, raMinutes: 6, raSeconds: 40.94752, decDegrees: -36, decMinutes: 22, decSeconds: 11.8371, magnitude: 2.06, color: '#ffd699', catalog: 'constellation' },

  // 南十字座 (Crux)
  { id: 'star:bayer:alpha-cru', names: { chineseAsterism: '十字架二', westernProper: 'Acrux', westernDesignation: 'Alpha Cru', westernSystemName: '南十字座α' }, raHours: 12, raMinutes: 26, raSeconds: 35.89522, decDegrees: -63, decMinutes: 5, decSeconds: 56.7343, magnitude: 0.76, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-cru', names: { chineseAsterism: '十字架三', westernProper: 'Mimosa', westernDesignation: 'Beta Cru', westernSystemName: '南十字座β' }, raHours: 12, raMinutes: 47, raSeconds: 43.26877, decDegrees: -59, decMinutes: 41, decSeconds: 19.5792, magnitude: 1.25, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-cru', names: { chineseAsterism: '十字架一', westernProper: 'Gacrux', westernDesignation: 'Gamma Cru', westernSystemName: '南十字座γ' }, raHours: 12, raMinutes: 31, raSeconds: 9.95961, decDegrees: -57, decMinutes: 6, decSeconds: 47.5684, magnitude: 1.64, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:delta-cru', names: { chineseAsterism: '十字架四', westernProper: 'Imai', westernDesignation: 'Delta Cru', westernSystemName: '南十字座δ' }, raHours: 12, raMinutes: 15, raSeconds: 8.71673, decDegrees: -58, decMinutes: 44, decSeconds: 56.1369, magnitude: 2.81, color: '#b4c8ff', catalog: 'constellation' },

  // 豺狼座 (Lupus)
  { id: 'star:bayer:alpha-lup', names: { chineseAsterism: '骑官十', westernDesignation: 'Alpha Lup', westernSystemName: '豺狼座α' }, raHours: 14, raMinutes: 41, raSeconds: 56.9, decDegrees: -47, decMinutes: 23, decSeconds: 14, magnitude: 2.3, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:beta-lup', names: { chineseAsterism: '骑官四', westernDesignation: 'Beta Lup', westernSystemName: '豺狼座β' }, raHours: 14, raMinutes: 58, raSeconds: 32.5, decDegrees: -43, decMinutes: 8, decSeconds: 2, magnitude: 2.68, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:gamma-lup', names: { chineseAsterism: '骑官一', westernDesignation: 'Gamma Lup', westernSystemName: '豺狼座γ' }, raHours: 15, raMinutes: 35, raSeconds: 19.6, decDegrees: -41, decMinutes: 10, decSeconds: 5, magnitude: 2.78, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:delta-lup', names: { chineseAsterism: '骑官二', westernDesignation: 'Delta Lup', westernSystemName: '豺狼座δ' }, raHours: 15, raMinutes: 21, raSeconds: 23.6, decDegrees: -40, decMinutes: 38, decSeconds: 52, magnitude: 3.22, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-lup', names: { westernDesignation: 'Epsilon Lup', westernSystemName: '豺狼座ε' }, raHours: 15, raMinutes: 37, raSeconds: 48.6, decDegrees: -34, decMinutes: 34, decSeconds: 46, magnitude: 3.37, color: '#ff9f7f', catalog: 'constellation' },

  // 天坛座 (Ara)
  { id: 'star:bayer:beta-ara', names: { chineseAsterism: '杵三[箕宿]', westernDesignation: 'Beta Ara', westernSystemName: '天坛座β' }, raHours: 17, raMinutes: 25, raSeconds: 20.1, decDegrees: -55, decMinutes: 31, decSeconds: 48, magnitude: 2.85, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:alpha-ara', names: { chineseAsterism: '杵二[箕宿]', westernDesignation: 'Alpha Ara', westernSystemName: '天坛座α' }, raHours: 17, raMinutes: 31, raSeconds: 47.0, decDegrees: -49, decMinutes: 52, decSeconds: 45, magnitude: 2.95, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:gamma-ara', names: { westernDesignation: 'Gamma Ara', westernSystemName: '天坛座γ' }, raHours: 17, raMinutes: 59, raSeconds: 23.1, decDegrees: -56, decMinutes: 22, decSeconds: 40, magnitude: 3.31, color: '#e8e8e8', catalog: 'constellation' },

  // 长蛇座 (Hydra)
  { id: 'star:bayer:alpha-hya', names: { chineseAsterism: '星宿一', westernProper: 'Alphard', westernDesignation: 'Alpha Hya', westernSystemName: '长蛇座α' }, raHours: 9, raMinutes: 27, raSeconds: 35.2, decDegrees: -8, decMinutes: 39, decSeconds: 30, magnitude: 1.98, color: '#b4c8ff', catalog: 'constellation' },
  // Verified: 平一 = γ Hydrae; 平二 = π Hydrae
  { id: 'star:bayer:gamma-hya', names: { chineseAsterism: '平一', westernDesignation: 'Gamma Hya', westernSystemName: '长蛇座γ' }, raHours: 13, raMinutes: 21, raSeconds: 48.5, decDegrees: -23, decMinutes: 10, decSeconds: 23, magnitude: 2.99, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:pi-hya', names: { chineseAsterism: '平二', westernDesignation: 'Pi Hya', westernSystemName: '长蛇座π' }, raHours: 14, raMinutes: 26, raSeconds: 56.9, decDegrees: -26, decMinutes: 40, decSeconds: 57, magnitude: 3.27, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:rho-hya', names: { westernDesignation: 'Rho Hya', westernSystemName: '长蛇座ρ' }, raHours: 13, raMinutes: 29, raSeconds: 43.8, decDegrees: -23, decMinutes: 34, decSeconds: 38, magnitude: 4.35, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:flamsteed:2-hya', names: { chineseAsterism: '外厨一', westernDesignation: '2 Hya', westernSystemName: '长蛇座2' }, raHours: 8, raMinutes: 26, raSeconds: 27.2, decDegrees: -3, decMinutes: 59, decSeconds: 14.9, magnitude: 5.6, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:flamsteed:14-hya', names: { chineseAsterism: '外厨三', westernDesignation: '14 Hya', westernSystemName: '长蛇座14' }, raHours: 8, raMinutes: 49, raSeconds: 21.7, decDegrees: -3, decMinutes: 26, decSeconds: 34.9, magnitude: 5.3, color: '#b4c8ff', catalog: 'constellation' },

  // 船尾座 (Puppis)
  { id: 'star:bayer:zeta-pup', names: { chineseAsterism: '弧矢增二十二', westernProper: 'Naos', westernDesignation: 'Zeta Pup', westernSystemName: '船尾座ζ' }, raHours: 8, raMinutes: 3, raSeconds: 35.05, decDegrees: -40, decMinutes: 0, decSeconds: 11.3, magnitude: 2.25, color: '#b4c8ff', catalog: 'constellation' },

  // 巨爵座 (Crater)
  { id: 'star:bayer:alpha-crt', names: { westernDesignation: 'Alpha Crt', westernSystemName: '巨爵座α' }, raHours: 10, raMinutes: 59, raSeconds: 46.7, decDegrees: -22, decMinutes: 14, decSeconds: 31, magnitude: 4.08, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:gamma-crt', names: { chineseAsterism: '翼宿二', westernDesignation: 'Gamma Crt', westernSystemName: '巨爵座γ' }, raHours: 11, raMinutes: 24, raSeconds: 54.3, decDegrees: -17, decMinutes: 41, decSeconds: 0, magnitude: 4.51, color: '#e8e8e8', catalog: 'constellation' },

  // 乌鸦座 (Corvus)
  { id: 'star:bayer:alpha-crv', names: { westernProper: 'Alchiba', westernDesignation: 'Alpha Crv', westernSystemName: '乌鸦座α' }, raHours: 12, raMinutes: 8, raSeconds: 24.8, decDegrees: -24, decMinutes: 43, decSeconds: 44, magnitude: 4.02, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-crv', names: { chineseAsterism: '轸宿四', westernDesignation: 'Beta Crv', westernSystemName: '乌鸦座β' }, raHours: 12, raMinutes: 34, raSeconds: 23.1, decDegrees: -23, decMinutes: 23, decSeconds: 30, magnitude: 2.65, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-crv', names: { westernDesignation: 'Gamma Crv', westernSystemName: '乌鸦座γ' }, raHours: 12, raMinutes: 26, raSeconds: 42.7, decDegrees: -17, decMinutes: 32, decSeconds: 31, magnitude: 2.59, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-crv', names: { chineseAsterism: '轸宿三', westernDesignation: 'Delta Crv', westernSystemName: '乌鸦座δ' }, raHours: 12, raMinutes: 29, raSeconds: 51.9, decDegrees: -16, decMinutes: 30, decSeconds: 55, magnitude: 2.94, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-crv', names: { westernDesignation: 'Epsilon Crv', westernSystemName: '乌鸦座ε' }, raHours: 13, raMinutes: 9, raSeconds: 55.0, decDegrees: -22, decMinutes: 37, decSeconds: 7, magnitude: 3.02, color: '#b4c8ff', catalog: 'constellation' },

  // 六分仪座 (Sextans)
  { id: 'star:bayer:alpha-sex', names: { westernDesignation: 'Alpha Sex', westernSystemName: '六分仪座α' }, raHours: 10, raMinutes: 7, raSeconds: 55.4, decDegrees: -0, decMinutes: 22, decSeconds: 19, magnitude: 4.49, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-sex', names: { westernDesignation: 'Beta Sex', westernSystemName: '六分仪座β' }, raHours: 10, raMinutes: 30, raSeconds: 17.5, decDegrees: -0, decMinutes: 24, decSeconds: 58, magnitude: 5.09, color: '#e8e8e8', catalog: 'constellation' },

  // 麒麟座 (Monoceros)
  { id: 'star:bayer:alpha-mon', names: { westernDesignation: 'Alpha Mon', westernSystemName: '麒麟座α' }, raHours: 7, raMinutes: 41, raSeconds: 14.9, decDegrees: -0, decMinutes: 23, decSeconds: 33, magnitude: 3.93, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:gamma-mon', names: { westernDesignation: 'Gamma Mon', westernSystemName: '麒麟座γ' }, raHours: 6, raMinutes: 14, raSeconds: 52.9, decDegrees: -6, decMinutes: 49, decSeconds: 36, magnitude: 3.99, color: '#e8e8e8', catalog: 'constellation' },

  // 船帆座 (Vela)
  { id: 'star:bayer:lambda-vel', names: { westernProper: 'Suhail', westernDesignation: 'Lambda Vel', westernSystemName: '船帆座λ' }, raHours: 9, raMinutes: 7, raSeconds: 59.75787, decDegrees: -43, decMinutes: 25, decSeconds: 57.3273, magnitude: 2.21, color: '#ffb07c', catalog: 'constellation' },
  { id: 'star:bayer:delta-vel', names: { chineseAsterism: '天社三', westernDesignation: 'Delta Vel', westernSystemName: '船帆座δ' }, raHours: 8, raMinutes: 44, raSeconds: 42.2, decDegrees: -54, decMinutes: 42, decSeconds: 31.8, magnitude: 1.93, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-vel', names: { chineseAsterism: '天社一', westernDesignation: 'Gamma Vel', westernSystemName: '船帆座γ' }, raHours: 8, raMinutes: 9, raSeconds: 32.0, decDegrees: -47, decMinutes: 20, decSeconds: 11.7, magnitude: 1.75, color: '#ffe4b5', catalog: 'constellation' },

  // 船底座 (Carina)
  { id: 'star:bayer:beta-car', names: { chineseAsterism: '南船五', westernDesignation: 'Beta Car', westernSystemName: '船底座β' }, raHours: 9, raMinutes: 13, raSeconds: 12.5, decDegrees: -69, decMinutes: 42, decSeconds: 19, magnitude: 1.7, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:iota-car', names: { chineseAsterism: '海石二', westernDesignation: 'Iota Car', westernSystemName: '船底座ι' }, raHours: 9, raMinutes: 17, raSeconds: 5.4, decDegrees: -59, decMinutes: 16, decSeconds: 30.8, magnitude: 2.21, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-car', names: { chineseAsterism: '海石一', westernDesignation: 'Epsilon Car', westernSystemName: '船底座ε' }, raHours: 8, raMinutes: 22, raSeconds: 32.6, decDegrees: -59, decMinutes: 30, decSeconds: 12, magnitude: 1.86, color: '#ffe4b5', catalog: 'constellation' },

  // 波江座 (Eridanus)
  { id: 'star:bayer:alpha-eri', names: { chineseAsterism: '水委一', westernProper: 'Achernar', westernDesignation: 'Alpha Eri', westernSystemName: '波江座α' }, raHours: 1, raMinutes: 37, raSeconds: 42.9, decDegrees: -57, decMinutes: 14, decSeconds: 12, magnitude: 0.46, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:theta-eri', names: { westernDesignation: 'Theta Eri', westernSystemName: '波江座θ' }, raHours: 2, raMinutes: 58, raSeconds: 15.6, decDegrees: -40, decMinutes: 18, decSeconds: 17, magnitude: 3.2, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:omicron-eri', names: { westernDesignation: 'Omicron Eri', westernSystemName: '波江座ο' }, raHours: 4, raMinutes: 11, raSeconds: 19.1, decDegrees: -6, decMinutes: 49, decSeconds: 58, magnitude: 4.04, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-eri', names: { chineseAsterism: '玉井三', westernDesignation: 'Beta Eri', westernSystemName: '波江座β' }, raHours: 5, raMinutes: 7, raSeconds: 50.6, decDegrees: -5, decMinutes: 11, decSeconds: 24, magnitude: 2.78, color: '#b4c8ff', catalog: 'constellation' },

  // 天兔座 (Lepus)
  { id: 'star:bayer:alpha-lep', names: { chineseAsterism: '厕一', westernDesignation: 'Alpha Lep', westernSystemName: '天兔座α' }, raHours: 5, raMinutes: 32, raSeconds: 43.8, decDegrees: -17, decMinutes: 49, decSeconds: 22, magnitude: 2.58, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:beta-lep', names: { chineseAsterism: '厕二', westernDesignation: 'Beta Lep', westernSystemName: '天兔座β' }, raHours: 5, raMinutes: 28, raSeconds: 14.7, decDegrees: -20, decMinutes: 45, decSeconds: 40, magnitude: 2.84, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:gamma-lep', names: { chineseAsterism: '厕三', westernDesignation: 'Gamma Lep', westernSystemName: '天兔座γ' }, raHours: 5, raMinutes: 44, raSeconds: 27.8, decDegrees: -22, decMinutes: 22, decSeconds: 14, magnitude: 3.59, color: '#ff9f7f', catalog: 'constellation' },
  { id: 'star:bayer:delta-lep', names: { westernDesignation: 'Delta Lep', westernSystemName: '天兔座δ' }, raHours: 5, raMinutes: 51, raSeconds: 19.5, decDegrees: -21, decMinutes: 54, decSeconds: 6, magnitude: 3.81, color: '#ff9f7f', catalog: 'constellation' },

  // 天鸽座 (Columba)
  { id: 'star:bayer:alpha-col', names: { chineseAsterism: '丈人一', westernDesignation: 'Alpha Col', westernSystemName: '天鸽座α' }, raHours: 5, raMinutes: 39, raSeconds: 38.9, decDegrees: -34, decMinutes: 4, decSeconds: 31, magnitude: 2.65, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-col', names: { chineseAsterism: '子二', westernDesignation: 'Beta Col', westernSystemName: '天鸽座β' }, raHours: 5, raMinutes: 51, raSeconds: 19.6, decDegrees: -35, decMinutes: 46, decSeconds: 5, magnitude: 3.12, color: '#e8e8e8', catalog: 'constellation' },

  // 麒麟座 (Monoceros) - additional
  { id: 'star:bayer:sigma-ori', names: { chineseAsterism: '参宿增一', westernDesignation: 'Sigma Ori', westernSystemName: '猎户座σ' }, raHours: 5, raMinutes: 38, raSeconds: 44.8, decDegrees: -2, decMinutes: 36, decSeconds: 0.2, magnitude: 3.77, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:flamsteed:31-ori', names: { chineseAsterism: '参宿增二', westernDesignation: '31 Ori', westernSystemName: '猎户座31' }, raHours: 5, raMinutes: 29, raSeconds: 44.0, decDegrees: -1, decMinutes: 5, decSeconds: 32.1, magnitude: 4.71, color: '#e8e8e8', catalog: 'constellation' },

  // 罗盘座 (Pyxis)
  { id: 'star:bayer:alpha-pyx', names: { chineseAsterism: '天狗五', westernDesignation: 'Alpha Pyx', westernSystemName: '罗盘座α' }, raHours: 8, raMinutes: 43, raSeconds: 35.5, decDegrees: -33, decMinutes: 11, decSeconds: 0, magnitude: 3.68, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-pyx', names: { westernDesignation: 'Beta Pyx', westernSystemName: '罗盘座β' }, raHours: 8, raMinutes: 26, raSeconds: 39.3, decDegrees: -35, decMinutes: 15, decSeconds: 22, magnitude: 4.28, color: '#e8e8e8', catalog: 'constellation' },

  // 唧筒座 (Antlia)
  { id: 'star:bayer:alpha-ant', names: { westernDesignation: 'Alpha Ant', westernSystemName: '唧筒座α' }, raHours: 9, raMinutes: 27, raSeconds: 9.5, decDegrees: -30, decMinutes: 38, decSeconds: 14, magnitude: 4.28, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-ant', names: { westernDesignation: 'Beta Ant', westernSystemName: '唧筒座β' }, raHours: 9, raMinutes: 33, raSeconds: 0.4, decDegrees: -28, decMinutes: 9, decSeconds: 25, magnitude: 4.53, color: '#e8e8e8', catalog: 'constellation' },

  // 绘架座 (Pictor)
  { id: 'star:bayer:alpha-pic', names: { westernDesignation: 'Alpha Pic', westernSystemName: '绘架座α' }, raHours: 6, raMinutes: 24, raSeconds: 5.8, decDegrees: -61, decMinutes: 56, decSeconds: 31, magnitude: 3.24, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-pic', names: { westernDesignation: 'Beta Pic', westernSystemName: '绘架座β' }, raHours: 5, raMinutes: 51, raSeconds: 33.3, decDegrees: -51, decMinutes: 59, decSeconds: 48, magnitude: 3.86, color: '#e8e8e8', catalog: 'constellation' },

  // 剑鱼座 (Doradus)
  { id: 'star:bayer:alpha-dor', names: { chineseAsterism: '金鱼二', westernDesignation: 'Alpha Dor', westernSystemName: '剑鱼座α' }, raHours: 4, raMinutes: 33, raSeconds: 57.5, decDegrees: -55, decMinutes: 2, decSeconds: 42, magnitude: 3.27, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-dor', names: { chineseAsterism: '金鱼三', westernDesignation: 'Beta Dor', westernSystemName: '剑鱼座β' }, raHours: 5, raMinutes: 33, raSeconds: 37.2, decDegrees: -62, decMinutes: 29, decSeconds: 23, magnitude: 3.76, color: '#e8e8e8', catalog: 'constellation' },

  // 玉夫座 (Sculptor)
  { id: 'star:bayer:alpha-scl', names: { westernDesignation: 'Alpha Scl', westernSystemName: '玉夫座α' }, raHours: 0, raMinutes: 58, raSeconds: 36.5, decDegrees: -29, decMinutes: 21, decSeconds: 23, magnitude: 4.31, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-scl', names: { westernDesignation: 'Beta Scl', westernSystemName: '玉夫座β' }, raHours: 23, raMinutes: 22, raSeconds: 57.3, decDegrees: -37, decMinutes: 48, decSeconds: 56, magnitude: 4.38, color: '#e8e8e8', catalog: 'constellation' },

  // 凤凰座 (Phoenix)
  { id: 'star:bayer:alpha-phe', names: { chineseAsterism: '火鸟六', westernDesignation: 'Alpha Phe', westernSystemName: '凤凰座α' }, raHours: 0, raMinutes: 26, raSeconds: 17.1, decDegrees: -42, decMinutes: 21, decSeconds: 44, magnitude: 2.39, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-phe', names: { chineseAsterism: '火鸟九', westernDesignation: 'Beta Phe', westernSystemName: '凤凰座β' }, raHours: 1, raMinutes: 6, raSeconds: 5.5, decDegrees: -46, decMinutes: 43, decSeconds: 8, magnitude: 3.32, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-phe', names: { chineseAsterism: '火鸟十', westernDesignation: 'Gamma Phe', westernSystemName: '凤凰座γ' }, raHours: 1, raMinutes: 28, raSeconds: 21.8, decDegrees: -43, decMinutes: 19, decSeconds: 5, magnitude: 3.41, color: '#ffe4b5', catalog: 'constellation' },

  // 印第安座 (Indus)
  { id: 'star:bayer:alpha-ind', names: { chineseAsterism: '波斯二', westernDesignation: 'Alpha Ind', westernSystemName: '印第安座α' }, raHours: 20, raMinutes: 37, raSeconds: 49.9, decDegrees: -47, decMinutes: 17, decSeconds: 52, magnitude: 3.11, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-ind', names: { westernDesignation: 'Beta Ind', westernSystemName: '印第安座β' }, raHours: 21, raMinutes: 1, raSeconds: 35.2, decDegrees: -58, decMinutes: 27, decSeconds: 16, magnitude: 3.67, color: '#ffe4b5', catalog: 'constellation' },

  // 天鹤座 (Grus)
  { id: 'star:bayer:alpha-gru', names: { westernDesignation: 'Alpha Gru', westernSystemName: '天鹤座α' }, raHours: 22, raMinutes: 22, raSeconds: 37.5, decDegrees: -40, decMinutes: 57, decSeconds: 52, magnitude: 1.74, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-gru', names: { chineseAsterism: '鹤二', westernDesignation: 'Beta Gru', westernSystemName: '天鹤座β' }, raHours: 22, raMinutes: 42, raSeconds: 2.8, decDegrees: -46, decMinutes: 53, decSeconds: 5, magnitude: 2.04, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-gru', names: { chineseAsterism: '败臼一', westernDesignation: 'Gamma Gru', westernSystemName: '天鹤座γ' }, raHours: 21, raMinutes: 53, raSeconds: 55.6, decDegrees: -37, decMinutes: 21, decSeconds: 25, magnitude: 3.01, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-gru', names: { westernDesignation: 'Delta Gru', westernSystemName: '天鹤座δ' }, raHours: 22, raMinutes: 29, raSeconds: 49.2, decDegrees: -43, decMinutes: 28, decSeconds: 33, magnitude: 3.97, color: '#b4c8ff', catalog: 'constellation' },

  // 孔雀座 (Pavo)
  { id: 'star:bayer:alpha-pav', names: { chineseAsterism: '孔雀十一', westernDesignation: 'Alpha Pav', westernSystemName: '孔雀座α' }, raHours: 20, raMinutes: 25, raSeconds: 39.2, decDegrees: -56, decMinutes: 44, decSeconds: 6, magnitude: 1.94, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-pav', names: { chineseAsterism: '孔雀七', westernDesignation: 'Beta Pav', westernSystemName: '孔雀座β' }, raHours: 20, raMinutes: 44, raSeconds: 39.8, decDegrees: -66, decMinutes: 10, decSeconds: 57, magnitude: 3.31, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-pav', names: { westernDesignation: 'Gamma Pav', westernSystemName: '孔雀座γ' }, raHours: 21, raMinutes: 26, raSeconds: 26.2, decDegrees: -53, decMinutes: 23, decSeconds: 49, magnitude: 3.26, color: '#b4c8ff', catalog: 'constellation' },

  // 杜鹃座 (Tucana)
  { id: 'star:bayer:alpha-tuc', names: { westernDesignation: 'Alpha Tuc', westernSystemName: '杜鹃座α' }, raHours: 0, raMinutes: 13, raSeconds: 33.2, decDegrees: -60, decMinutes: 49, decSeconds: 14, magnitude: 2.87, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-tuc', names: { westernDesignation: 'Beta Tuc', westernSystemName: '杜鹃座β' }, raHours: 22, raMinutes: 9, raSeconds: 22.6, decDegrees: -63, decMinutes: 1, decSeconds: 43, magnitude: 3.37, color: '#b4c8ff', catalog: 'constellation' },

  // 飞鱼座 (Volans)
  { id: 'star:bayer:alpha-vol', names: { westernDesignation: 'Alpha Vol', westernSystemName: '飞鱼座α' }, raHours: 7, raMinutes: 18, raSeconds: 4.6, decDegrees: -66, decMinutes: 23, decSeconds: 46, magnitude: 3.77, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-vol', names: { westernDesignation: 'Beta Vol', westernSystemName: '飞鱼座β' }, raHours: 6, raMinutes: 52, raSeconds: 49.2, decDegrees: -68, decMinutes: 30, decSeconds: 29, magnitude: 3.77, color: '#e8e8e8', catalog: 'constellation' },

  // 蝘蜓座 (Chamaeleon)
  { id: 'star:bayer:alpha-cha', names: { westernDesignation: 'Alpha Cha', westernSystemName: '蝘蜓座α' }, raHours: 10, raMinutes: 42, raSeconds: 57.3, decDegrees: -76, decMinutes: 56, decSeconds: 54, magnitude: 4.07, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-cha', names: { westernDesignation: 'Beta Cha', westernSystemName: '蝘蜓座β' }, raHours: 12, raMinutes: 18, raSeconds: 22.8, decDegrees: -79, decMinutes: 3, decSeconds: 10, magnitude: 4.26, color: '#e8e8e8', catalog: 'constellation' },

  // 水蛇座 (Hydrus)
  { id: 'star:bayer:beta-hyi', names: { chineseAsterism: '蛇尾一', westernDesignation: 'Beta Hyi', westernSystemName: '水蛇座β' }, raHours: 0, raMinutes: 25, raSeconds: 46.1, decDegrees: -77, decMinutes: 15, decSeconds: 18, magnitude: 2.8, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:alpha-hyi', names: { chineseAsterism: '蛇首一', westernDesignation: 'Alpha Hyi', westernSystemName: '水蛇座α' }, raHours: 1, raMinutes: 58, raSeconds: 26.6, decDegrees: -61, decMinutes: 34, decSeconds: 16, magnitude: 2.86, color: '#b4c8ff', catalog: 'constellation' },

  // 大麦哲伦云 (LMC) - not a star but included for reference
  // 小麦哲伦云 (SMC) - not a star but included for reference

  // 南三角座 (Triangulum Australe)
  { id: 'star:bayer:alpha-tra', names: { chineseAsterism: '三角形三', westernDesignation: 'Alpha TrA', westernSystemName: '南三角座α' }, raHours: 16, raMinutes: 48, raSeconds: 48.4, decDegrees: -69, decMinutes: 1, decSeconds: 39, magnitude: 1.92, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-tra', names: { chineseAsterism: '三角形二', westernDesignation: 'Beta TrA', westernSystemName: '南三角座β' }, raHours: 15, raMinutes: 55, raSeconds: 7.7, decDegrees: -63, decMinutes: 25, decSeconds: 47, magnitude: 2.83, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-tra', names: { westernDesignation: 'Gamma TrA', westernSystemName: '南三角座γ' }, raHours: 15, raMinutes: 33, raSeconds: 14.8, decDegrees: -68, decMinutes: 40, decSeconds: 57, magnitude: 3.03, color: '#b4c8ff', catalog: 'constellation' },

  // 盾牌座 (Scutum)
  { id: 'star:bayer:alpha-sct', names: { chineseAsterism: '天弁一', westernDesignation: 'Alpha Sct', westernSystemName: '盾牌座α' }, raHours: 18, raMinutes: 35, raSeconds: 42.5, decDegrees: -8, decMinutes: 11, decSeconds: 51, magnitude: 3.85, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-sct', names: { westernDesignation: 'Beta Sct', westernSystemName: '盾牌座β' }, raHours: 18, raMinutes: 44, raSeconds: 23.8, decDegrees: -6, decMinutes: 24, decSeconds: 28, magnitude: 4.22, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:zeta-sct', names: { westernDesignation: 'Zeta Sct', westernSystemName: '盾牌座ζ' }, raHours: 18, raMinutes: 16, raSeconds: 57.5, decDegrees: -9, decMinutes: 12, decSeconds: 47, magnitude: 4.68, color: '#ffe4b5', catalog: 'constellation' },

  // 狐狸座 (Vulpecula)
  { id: 'star:bayer:alpha-vul', names: { chineseAsterism: '齐增五', westernProper: 'Anser', westernDesignation: 'Alpha Vul', westernSystemName: '狐狸座α' }, raHours: 19, raMinutes: 29, raSeconds: 3.4, decDegrees: 24, decMinutes: 42, decSeconds: 18, magnitude: 4.44, color: '#e8e8e8', catalog: 'constellation' },

  // 天箭座 (Sagitta)
  { id: 'star:bayer:alpha-sge', names: { chineseAsterism: '左旗一', westernDesignation: 'Alpha Sge', westernSystemName: '天箭座α' }, raHours: 19, raMinutes: 40, raSeconds: 45.7, decDegrees: 18, decMinutes: 0, decSeconds: 17, magnitude: 4.37, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-sge', names: { westernDesignation: 'Beta Sge', westernSystemName: '天箭座β' }, raHours: 19, raMinutes: 52, raSeconds: 10.2, decDegrees: 17, decMinutes: 29, decSeconds: 39, magnitude: 4.37, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:gamma-sge', names: { chineseAsterism: '左旗五', westernDesignation: 'Gamma Sge', westernSystemName: '天箭座γ' }, raHours: 19, raMinutes: 58, raSeconds: 44.6, decDegrees: 19, decMinutes: 29, decSeconds: 27, magnitude: 3.51, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:delta-sge', names: { chineseAsterism: '左旗三', westernDesignation: 'Delta Sge', westernSystemName: '天箭座δ' }, raHours: 19, raMinutes: 47, raSeconds: 42.5, decDegrees: 18, decMinutes: 32, decSeconds: 2, magnitude: 3.82, color: '#e8e8e8', catalog: 'constellation' },

  // 海豚座 (Delphinus)
  { id: 'star:bayer:psi-aql', names: { chineseAsterism: '河鼓增一', westernDesignation: 'Psi Aql', westernSystemName: '天鹰座ψ' }, raHours: 19, raMinutes: 44, raSeconds: 34.2, decDegrees: 13, decMinutes: 18, decSeconds: 10.0, magnitude: 6.25, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:alpha-del', names: { chineseAsterism: '瓠瓜一', westernDesignation: 'Alpha Del', westernSystemName: '海豚座α' }, raHours: 20, raMinutes: 39, raSeconds: 7.7, decDegrees: 15, decMinutes: 52, decSeconds: 56, magnitude: 3.77, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:beta-del', names: { westernDesignation: 'Beta Del', westernSystemName: '海豚座β' }, raHours: 20, raMinutes: 31, raSeconds: 53.6, decDegrees: 14, decMinutes: 35, decSeconds: 48, magnitude: 3.63, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:gamma-del', names: { westernDesignation: 'Gamma Del', westernSystemName: '海豚座γ' }, raHours: 20, raMinutes: 45, raSeconds: 31.8, decDegrees: 15, decMinutes: 54, decSeconds: 44, magnitude: 4.27, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-del', names: { westernDesignation: 'Delta Del', westernSystemName: '海豚座δ' }, raHours: 20, raMinutes: 32, raSeconds: 27.5, decDegrees: 11, decMinutes: 22, decSeconds: 45, magnitude: 4.43, color: '#b4c8ff', catalog: 'constellation' },

  // 蝎虎座 (Lacerta)
  { id: 'star:bayer:beta-lac', names: { westernDesignation: 'Beta Lac', westernSystemName: '蝎虎座β' }, raHours: 22, raMinutes: 41, raSeconds: 59.2, decDegrees: 52, decMinutes: 13, decSeconds: 58, magnitude: 4.58, color: '#e8e8e8', catalog: 'constellation' },

  // 天猫座 (Lynx)
  { id: 'star:bayer:alpha-lyn', names: { westernDesignation: 'Alpha Lyn', westernSystemName: '天猫座α' }, raHours: 9, raMinutes: 21, raSeconds: 3.3, decDegrees: 61, decMinutes: 28, decSeconds: 59, magnitude: 3.13, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:flamsteed:38-lyn', names: { chineseAsterism: '轩辕三', westernDesignation: '38 Lyn', westernSystemName: '天猫座38' }, raHours: 9, raMinutes: 18, raSeconds: 50.4, decDegrees: 36, decMinutes: 48, decSeconds: 14, magnitude: 3.82, color: '#ffe4b5', catalog: 'constellation' },

  // 小狮座 (Leo Minor)
  { id: 'star:bayer:alpha-lmi', names: { westernDesignation: 'Alpha LMi', westernSystemName: '小狮座α' }, raHours: 10, raMinutes: 19, raSeconds: 39.6, decDegrees: 37, decMinutes: 0, decSeconds: 17, magnitude: 3.83, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-lmi', names: { westernDesignation: 'Beta LMi', westernSystemName: '小狮座β' }, raHours: 10, raMinutes: 28, raSeconds: 0.0, decDegrees: 36, decMinutes: 44, decSeconds: 36, magnitude: 4.21, color: '#e8e8e8', catalog: 'constellation' },

  // 猎犬座 (Canes Venatici) - additional
  { id: 'star:flamsteed:23-cvn', names: { westernDesignation: '23 CVn', westernSystemName: '猎犬座23' }, raHours: 12, raMinutes: 37, raSeconds: 16.9, decDegrees: 40, decMinutes: 9, decSeconds: 44, magnitude: 4.66, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:flamsteed:24-cvn', names: { westernDesignation: '24 CVn', westernSystemName: '猎犬座24' }, raHours: 12, raMinutes: 35, raSeconds: 8.0, decDegrees: 48, decMinutes: 56, decSeconds: 45, magnitude: 4.7, color: '#ffe4b5', catalog: 'constellation' },

  // 星座补充 (Additional constellation stars)
  { id: 'star:bayer:alpha-crb', names: { chineseAsterism: '贯索四', westernDesignation: 'Alpha CrB', westernSystemName: '北冕座α' }, raHours: 15, raMinutes: 34, raSeconds: 41.4, decDegrees: 26, decMinutes: 42, decSeconds: 39, magnitude: 2.23, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-crb', names: { chineseAsterism: '贯索三', westernDesignation: 'Beta CrB', westernSystemName: '北冕座β' }, raHours: 15, raMinutes: 27, raSeconds: 50.6, decDegrees: 29, decMinutes: 6, decSeconds: 20, magnitude: 3.72, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:gamma-crb', names: { chineseAsterism: '贯索五', westernDesignation: 'Gamma CrB', westernSystemName: '北冕座γ' }, raHours: 15, raMinutes: 42, raSeconds: 28.7, decDegrees: 26, decMinutes: 17, decSeconds: 48, magnitude: 4.06, color: '#ffe4b5', catalog: 'constellation' },

  { id: 'star:bayer:alpha-cra', names: { westernDesignation: 'Alpha CrA', westernSystemName: '南冕座α' }, raHours: 18, raMinutes: 36, raSeconds: 48.4, decDegrees: -37, decMinutes: 18, decSeconds: 26, magnitude: 4.1, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:beta-cra', names: { westernDesignation: 'Beta CrA', westernSystemName: '南冕座β' }, raHours: 18, raMinutes: 31, raSeconds: 32.2, decDegrees: -39, decMinutes: 20, decSeconds: 7, magnitude: 4.3, color: '#ffe4b5', catalog: 'constellation' },

  { id: 'star:bayer:epsilon-del', names: { westernDesignation: 'Epsilon Del', westernSystemName: '海豚座ε' }, raHours: 20, raMinutes: 31, raSeconds: 14.5, decDegrees: 11, decMinutes: 30, decSeconds: 12, magnitude: 4.03, color: '#b4c8ff', catalog: 'constellation' },

  { id: 'star:bayer:zeta-sge', names: { westernDesignation: 'Zeta Sge', westernSystemName: '天箭座ζ' }, raHours: 19, raMinutes: 44, raSeconds: 30.3, decDegrees: 19, decMinutes: 5, decSeconds: 22, magnitude: 5.04, color: '#e8e8e8', catalog: 'constellation' },

  { id: 'star:bayer:alpha-equ', names: { westernDesignation: 'Alpha Equ', westernSystemName: '小马座α' }, raHours: 21, raMinutes: 13, raSeconds: 53.9, decDegrees: 7, decMinutes: 2, decSeconds: 58, magnitude: 3.92, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-equ', names: { westernDesignation: 'Beta Equ', westernSystemName: '小马座β' }, raHours: 21, raMinutes: 0, raSeconds: 55.9, decDegrees: 6, decMinutes: 48, decSeconds: 57, magnitude: 4.35, color: '#e8e8e8', catalog: 'constellation' },

  { id: 'star:flamsteed:6-lac', names: { westernDesignation: '6 Lac', westernSystemName: '蝎虎座6' }, raHours: 22, raMinutes: 24, raSeconds: 15.9, decDegrees: 43, decMinutes: 7, decSeconds: 38, magnitude: 4.5, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:alpha-lac', names: { chineseAsterism: '螣蛇一', westernDesignation: 'Alpha Lac', westernSystemName: '蝎虎座α' }, raHours: 22, raMinutes: 30, raSeconds: 42.6, decDegrees: 50, decMinutes: 16, decSeconds: 21, magnitude: 3.77, color: '#e8e8e8', catalog: 'constellation' },

  // 天燕座 (Apus)
  { id: 'star:bayer:alpha-aps', names: { chineseAsterism: '异雀八', westernDesignation: 'Alpha Aps', westernSystemName: '天燕座α' }, raHours: 14, raMinutes: 47, raSeconds: 51.7, decDegrees: -79, decMinutes: 2, decSeconds: 41, magnitude: 3.83, color: '#e8e8e8', catalog: 'constellation' },
  { id: 'star:bayer:beta-aps', names: { chineseAsterism: '异雀三', westernDesignation: 'Beta Aps', westernSystemName: '天燕座β' }, raHours: 16, raMinutes: 43, raSeconds: 4.7, decDegrees: -77, decMinutes: 31, decSeconds: 29, magnitude: 4.24, color: '#e8e8e8', catalog: 'constellation' },

  // 蝘蜓座 (Chamaeleon) - additional
  { id: 'star:bayer:gamma-cha', names: { chineseAsterism: '小斗三', westernDesignation: 'Gamma Cha', westernSystemName: '蝘蜓座γ' }, raHours: 10, raMinutes: 35, raSeconds: 19.2, decDegrees: -78, decMinutes: 36, decSeconds: 47, magnitude: 4.14, color: '#e8e8e8', catalog: 'constellation' },

  // 剑鱼座 (Doradus) - additional
  { id: 'star:bayer:gamma-dor', names: { westernDesignation: 'Gamma Dor', westernSystemName: '剑鱼座γ' }, raHours: 4, raMinutes: 17, raSeconds: 55.6, decDegrees: -51, decMinutes: 29, decSeconds: 24, magnitude: 4.26, color: '#e8e8e8', catalog: 'constellation' },

  // 天鹤座 (Grus) - additional
  { id: 'star:bayer:epsilon-gru', names: { westernDesignation: 'Epsilon Gru', westernSystemName: '天鹤座ε' }, raHours: 22, raMinutes: 4, raSeconds: 50.2, decDegrees: -51, decMinutes: 19, decSeconds: 1, magnitude: 3.49, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:zeta-gru', names: { westernDesignation: 'Zeta Gru', westernSystemName: '天鹤座ζ' }, raHours: 21, raMinutes: 9, raSeconds: 42.2, decDegrees: -53, decMinutes: 32, decSeconds: 39, magnitude: 3.95, color: '#b4c8ff', catalog: 'constellation' },

  // 印第安座 (Indus) - additional
  { id: 'star:bayer:gamma-ind', names: { westernDesignation: 'Gamma Ind', westernSystemName: '印第安座γ' }, raHours: 21, raMinutes: 26, raSeconds: 21.6, decDegrees: -54, decMinutes: 37, decSeconds: 59, magnitude: 4.11, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:delta-ind', names: { westernDesignation: 'Delta Ind', westernSystemName: '印第安座δ' }, raHours: 21, raMinutes: 57, raSeconds: 54.3, decDegrees: -55, decMinutes: 0, decSeconds: 39, magnitude: 4.23, color: '#ffe4b5', catalog: 'constellation' },

  // 凤凰座 (Phoenix) - additional
  { id: 'star:bayer:delta-phe', names: { westernDesignation: 'Delta Phe', westernSystemName: '凤凰座δ' }, raHours: 1, raMinutes: 15, raSeconds: 48.0, decDegrees: -49, decMinutes: 4, decSeconds: 0, magnitude: 3.93, color: '#ffe4b5', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-phe', names: { chineseAsterism: '火鸟四', westernDesignation: 'Epsilon Phe', westernSystemName: '凤凰座ε' }, raHours: 0, raMinutes: 9, raSeconds: 25.7, decDegrees: -45, decMinutes: 44, decSeconds: 29, magnitude: 4.42, color: '#ffe4b5', catalog: 'constellation' },

  // 杜鹃座 (Tucana) - additional
  { id: 'star:bayer:gamma-tuc', names: { westernDesignation: 'Gamma Tuc', westernSystemName: '杜鹃座γ' }, raHours: 23, raMinutes: 28, raSeconds: 33.7, decDegrees: -58, decMinutes: 14, decSeconds: 52, magnitude: 3.99, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:delta-tuc', names: { westernDesignation: 'Delta Tuc', westernSystemName: '杜鹃座δ' }, raHours: 22, raMinutes: 25, raSeconds: 47.1, decDegrees: -64, decMinutes: 49, decSeconds: 51, magnitude: 4.48, color: '#b4c8ff', catalog: 'constellation' },

  // 孔雀座 (Pavo) - additional
  { id: 'star:bayer:delta-pav', names: { westernDesignation: 'Delta Pav', westernSystemName: '孔雀座δ' }, raHours: 20, raMinutes: 21, raSeconds: 44.6, decDegrees: -66, decMinutes: 56, decSeconds: 35, magnitude: 3.62, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-pav', names: { westernDesignation: 'Epsilon Pav', westernSystemName: '孔雀座ε' }, raHours: 19, raMinutes: 42, raSeconds: 31.8, decDegrees: -73, decMinutes: 6, decSeconds: 44, magnitude: 3.94, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:kappa-pav', names: { westernDesignation: 'Kappa Pav', westernSystemName: '孔雀座κ' }, raHours: 18, raMinutes: 40, raSeconds: 43.2, decDegrees: -69, decMinutes: 13, decSeconds: 12, magnitude: 4.4, color: '#b4c8ff', catalog: 'constellation' },

  // 水蛇座 (Hydrus) - additional
  { id: 'star:bayer:gamma-hyi', names: { chineseAsterism: '附白一', westernDesignation: 'Gamma Hyi', westernSystemName: '水蛇座γ' }, raHours: 3, raMinutes: 47, raSeconds: 17.5, decDegrees: -74, decMinutes: 14, decSeconds: 16, magnitude: 3.24, color: '#b4c8ff', catalog: 'constellation' },
  { id: 'star:bayer:epsilon-hyi', names: { westernDesignation: 'Epsilon Hyi', westernSystemName: '水蛇座ε' }, raHours: 2, raMinutes: 19, raSeconds: 57.3, decDegrees: -69, decMinutes: 21, decSeconds: 55, magnitude: 4.12, color: '#b4c8ff', catalog: 'constellation' },

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
      { from: 'star:bayer:eta-uma', to: 'star:bayer:zeta-uma' },
      { from: 'star:bayer:zeta-uma', to: 'star:bayer:epsilon-uma' },
      { from: 'star:bayer:epsilon-uma', to: 'star:bayer:delta-uma' },
      { from: 'star:bayer:delta-uma', to: 'star:bayer:gamma-uma' },
      { from: 'star:bayer:gamma-uma', to: 'star:bayer:beta-uma' },
      { from: 'star:bayer:beta-uma', to: 'star:bayer:alpha-uma' },
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
      { from: 'star:bayer:alpha-tau', to: 'star:bayer:epsilon-tau' },
      { from: 'star:bayer:alpha-tau', to: 'star:bayer:delta-tau' },
      { from: 'star:bayer:alpha-tau', to: 'star:bayer:beta-tau' },
    ],
  },
  {
    id: 'cn-gemini',
    names: { chineseAsterism: '井宿', westernConstellation: 'Jing Xiu' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:lambda-gem', to: 'star:bayer:zeta-gem' },
      { from: 'star:bayer:zeta-gem', to: 'star:flamsteed:36-gem' },
      { from: 'star:flamsteed:36-gem', to: 'star:bayer:epsilon-gem' },
      { from: 'star:flamsteed:36-gem', to: 'star:bayer:nu-gem' },
      { from: 'star:bayer:nu-gem', to: 'star:bayer:mu-gem' },
      { from: 'star:bayer:nu-gem', to: 'star:bayer:gamma-gem' },
      { from: 'star:bayer:gamma-gem', to: 'star:bayer:zeta-gem' },
      { from: 'star:bayer:gamma-gem', to: 'star:bayer:xi-gem' },
    ],
  },
  {
    id: 'cn-leo',
    names: { chineseAsterism: '轩辕', westernConstellation: 'Xuanyuan' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-leo', to: 'star:bayer:zeta-leo' },
      { from: 'star:bayer:zeta-leo', to: 'star:bayer:gamma-leo' },
      { from: 'star:bayer:gamma-leo', to: 'star:bayer:mu-leo' },
      { from: 'star:bayer:mu-leo', to: 'star:bayer:lambda-leo' },
    ],
  },
  {
    id: 'cn-virgo',
    names: { chineseAsterism: '角宿', westernConstellation: 'Jiao Xiu' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-vir', to: 'star:bayer:zeta-vir' },
    ],
  },
  {
    id: 'cn-libra',
    names: { chineseAsterism: '氐宿', westernConstellation: 'Di Xiu' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-lib', to: 'star:bayer:iota-lib' },
      { from: 'star:bayer:iota-lib', to: 'star:bayer:gamma-lib' },
      { from: 'star:bayer:gamma-lib', to: 'star:bayer:beta-lib' },
    ],
  },
  {
    id: 'cn-scorpius',
    names: { chineseAsterism: '心房尾宿', westernConstellation: 'Xin and Wei' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-sco', to: 'star:bayer:lambda-sco' },
      { from: 'star:bayer:lambda-sco', to: 'star:bayer:mu-sco' },
      { from: 'star:bayer:mu-sco', to: 'star:bayer:beta-sco' },
      { from: 'star:bayer:beta-sco', to: 'star:bayer:pi-sco' },
      { from: 'star:bayer:zeta-sco', to: 'star:bayer:eta-sco' },
      { from: 'star:bayer:eta-sco', to: 'star:bayer:theta-sco' },
      { from: 'star:bayer:theta-sco', to: 'star:bayer:iota-sco' },
    ],
  },
  {
    id: 'cn-sagittarius',
    names: { chineseAsterism: '斗建', westernConstellation: 'Dou and Jian' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:lambda-sgr', to: 'star:bayer:epsilon-sgr' },
      { from: 'star:bayer:epsilon-sgr', to: 'star:bayer:phi-sgr' },
      { from: 'star:bayer:phi-sgr', to: 'star:bayer:xi-sgr' },
    ],
  },
  {
    id: 'cn-shen',
    names: { chineseAsterism: '参宿', westernConstellation: 'Shen Xiu' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-ori', to: 'star:bayer:zeta-ori' },
      { from: 'star:bayer:zeta-ori', to: 'star:bayer:epsilon-ori' },
      { from: 'star:bayer:epsilon-ori', to: 'star:bayer:delta-ori' },
      { from: 'star:bayer:delta-ori', to: 'star:bayer:gamma-ori' },
      { from: 'star:bayer:zeta-ori', to: 'star:bayer:kappa-ori' },
      { from: 'star:bayer:delta-ori', to: 'star:bayer:beta-ori' },
    ],
  },
  {
    id: 'cn-shenqi',
    names: { chineseAsterism: '参旗', westernConstellation: 'Shenqi' },
    system: 'chinese',
    lines: [
      { from: 'star:flamsteed:4-ori', to: 'star:flamsteed:9-ori' },
      { from: 'star:flamsteed:9-ori', to: 'star:flamsteed:6-ori' },
    ],
  },
  {
    id: 'cn-ursa-major',
    names: { chineseAsterism: '北斗延伸', westernConstellation: 'Northern Dipper' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:eta-uma', to: 'star:bayer:zeta-uma' },
      { from: 'star:bayer:zeta-uma', to: 'star:bayer:epsilon-uma' },
      { from: 'star:bayer:epsilon-uma', to: 'star:bayer:delta-uma' },
      { from: 'star:bayer:delta-uma', to: 'star:bayer:gamma-uma' },
      { from: 'star:bayer:gamma-uma', to: 'star:bayer:beta-uma' },
      { from: 'star:bayer:beta-uma', to: 'star:bayer:alpha-uma' },
    ],
  },
  {
    id: 'cn-cygnus',
    names: { chineseAsterism: '天津', westernConstellation: 'Tianjin' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:zeta-cyg', to: 'star:bayer:nu-cyg' },
      { from: 'star:bayer:nu-cyg', to: 'star:bayer:alpha-cyg' },
      { from: 'star:bayer:alpha-cyg', to: 'star:bayer:delta-cyg' },
      { from: 'star:bayer:delta-cyg', to: 'star:bayer:gamma-cyg' },
      { from: 'star:bayer:gamma-cyg', to: 'star:bayer:epsilon-cyg' },
      { from: 'star:bayer:epsilon-cyg', to: 'star:bayer:zeta-cyg' },
    ],
  },
  {
    id: 'cn-lyra',
    names: { chineseAsterism: '织女', westernConstellation: 'Zhinu' },
    system: 'chinese',
    lines: [
      { from: 'star:flamsteed:13-lyr', to: 'star:bayer:alpha-lyr' },
      { from: 'star:bayer:alpha-lyr', to: 'star:flamsteed:4-lyr' },
    ],
  },
  {
    id: 'cn-aquila',
    names: { chineseAsterism: '河鼓', westernConstellation: 'Hegu' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:beta-aql', to: 'star:bayer:alpha-aql' },
      { from: 'star:bayer:alpha-aql', to: 'star:bayer:gamma-aql' },
    ],
  },
  {
    id: 'cn-scorpius-extended',
    names: { chineseAsterism: '尾宿延长', westernConstellation: 'Wei Extension' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:zeta-sco', to: 'star:bayer:upsilon-sco' },
    ],
  },
  {
    id: 'cn-centaurus',
    names: { chineseAsterism: '南门', westernConstellation: 'Nanmen' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-cen', to: 'star:bayer:beta-cen' },
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
      { from: 'star:bayer:beta-cas', to: 'star:bayer:kappa-cas' },
      { from: 'star:bayer:kappa-cas', to: 'star:bayer:eta-cas' },
      { from: 'star:bayer:eta-cas', to: 'star:bayer:alpha-cas' },
    ],
  },
  {
    id: 'cn-perseus',
    names: { chineseAsterism: '大陵', westernConstellation: 'Daling' },
    system: 'chinese',
    lines: [
      { from: 'star:bayer:alpha-per', to: 'star:bayer:beta-per' },
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
      { from: 'star:bayer:alpha-tau', to: 'star:bayer:beta-tau' },
      { from: 'star:bayer:alpha-tau', to: 'star:bayer:epsilon-tau' },
      { from: 'star:bayer:alpha-tau', to: 'star:bayer:delta-tau' },
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
    id: 'western-cancer',
    names: { westernSystemName: '巨蟹座', westernConstellation: 'Cancer' },
    system: 'western',
    lines: [
      { from: 'star:bayer:lambda-cnc', to: 'star:bayer:delta-cnc' },
      { from: 'star:bayer:delta-cnc', to: 'star:bayer:beta-cnc' },
      { from: 'star:bayer:delta-cnc', to: 'star:bayer:alpha-cnc' },
    ],
  },
  {
    id: 'western-orion',
    names: { westernSystemName: '猎户座', westernConstellation: 'Orion' },
    system: 'western',
    lines: [
      { from: 'star:bayer:lambda-ori', to: 'star:bayer:alpha-ori' },
      { from: 'star:bayer:alpha-ori', to: 'star:bayer:zeta-ori' },
      { from: 'star:bayer:gamma-ori', to: 'star:bayer:lambda-ori' },
      { from: 'star:bayer:gamma-ori', to: 'star:bayer:delta-ori' },
      { from: 'star:bayer:delta-ori', to: 'star:bayer:epsilon-ori' },
      { from: 'star:bayer:zeta-ori', to: 'star:bayer:kappa-ori' },
      { from: 'star:bayer:delta-ori', to: 'star:bayer:beta-ori' },
      { from: 'star:bayer:kappa-ori', to: 'star:bayer:beta-ori' },
    ],
  },
  {
    id: 'western-ursa-major',
    names: { westernSystemName: '大熊座', westernConstellation: 'Ursa Major' },
    system: 'western',
    lines: [
      { from: 'star:bayer:eta-uma', to: 'star:bayer:zeta-uma' },
      { from: 'star:bayer:zeta-uma', to: 'star:bayer:epsilon-uma' },
      { from: 'star:bayer:epsilon-uma', to: 'star:bayer:delta-uma' },
      { from: 'star:bayer:delta-uma', to: 'star:bayer:alpha-uma' },
      { from: 'star:bayer:alpha-uma', to: 'star:bayer:beta-uma' },
      { from: 'star:bayer:beta-uma', to: 'star:bayer:gamma-uma' },
      { from: 'star:bayer:gamma-uma', to: 'star:bayer:delta-uma' },
    ],
  },
  {
    id: 'western-cygnus',
    names: { westernSystemName: '天鹅座', westernConstellation: 'Cygnus' },
    system: 'western',
    lines: [
      { from: 'star:bayer:delta-cyg', to: 'star:bayer:gamma-cyg' },
      { from: 'star:bayer:gamma-cyg', to: 'star:bayer:alpha-cyg' },
      { from: 'star:bayer:gamma-cyg', to: 'star:bayer:epsilon-cyg' },
      { from: 'star:bayer:epsilon-cyg', to: 'star:bayer:beta-cyg' },
    ],
  },
  {
    id: 'western-lyra',
    names: { westernSystemName: '天琴座', westernConstellation: 'Lyra' },
    system: 'western',
    lines: [
      { from: 'star:bayer:alpha-lyr', to: 'star:flamsteed:4-lyr' },
      { from: 'star:bayer:alpha-lyr', to: 'star:bayer:beta-lyr' },
      { from: 'star:bayer:beta-lyr', to: 'star:flamsteed:13-lyr' },
    ],
  },
  {
    id: 'western-aquila',
    names: { westernSystemName: '天鹰座', westernConstellation: 'Aquila' },
    system: 'western',
    lines: [
      { from: 'star:bayer:beta-aql', to: 'star:bayer:alpha-aql' },
      { from: 'star:bayer:alpha-aql', to: 'star:bayer:gamma-aql' },
      { from: 'star:bayer:alpha-aql', to: 'star:bayer:delta-aql' },
      { from: 'star:bayer:delta-aql', to: 'star:bayer:zeta-aql' },
      { from: 'star:bayer:delta-aql', to: 'star:bayer:rho-aql' },
      { from: 'star:bayer:rho-aql', to: 'star:bayer:theta-aql' },
    ],
  },
  {
    id: 'western-cassiopeia',
    names: { westernSystemName: '仙后座', westernConstellation: 'Cassiopeia' },
    system: 'western',
    lines: [
      { from: 'star:bayer:beta-cas', to: 'star:bayer:alpha-cas' },
      { from: 'star:bayer:alpha-cas', to: 'star:bayer:gamma-cas' },
      { from: 'star:bayer:gamma-cas', to: 'star:bayer:delta-cas' },
      { from: 'star:bayer:delta-cas', to: 'star:bayer:epsilon-cas' },
    ],
  },
  {
    id: 'western-libra',
    names: { westernSystemName: '天秤座', westernConstellation: 'Libra' },
    system: 'western',
    lines: [
      { from: 'star:bayer:gamma-lib', to: 'star:bayer:beta-lib' },
      { from: 'star:bayer:beta-lib', to: 'star:bayer:alpha-lib' },
      { from: 'star:bayer:alpha-lib', to: 'star:bayer:sigma-lib' },
      { from: 'star:bayer:sigma-lib', to: 'star:bayer:gamma-lib' },
    ],
  },
  {
    id: 'western-perseus',
    names: { westernSystemName: '英仙座', westernConstellation: 'Perseus' },
    system: 'western',
    lines: [
      { from: 'star:bayer:alpha-per', to: 'star:bayer:beta-per' },
    ],
  },
  {
    id: 'western-centaurus',
    names: { westernSystemName: '半人马座', westernConstellation: 'Centaurus' },
    system: 'western',
    lines: [
      { from: 'star:bayer:alpha-cen', to: 'star:bayer:beta-cen' },
    ],
  },
  {
    id: 'western-hydra',
    names: { westernSystemName: '长蛇座', westernConstellation: 'Hydra' },
    system: 'western',
    lines: [
      { from: 'star:bayer:gamma-hya', to: 'star:bayer:rho-hya' },
      { from: 'star:bayer:rho-hya', to: 'star:bayer:pi-hya' },
    ],
  },
];

export const CONSTELLATIONS_BY_CULTURE: Record<SkyCulture, Constellation[]> = {
  western: WESTERN_CONSTELLATIONS,
  chinese: CHINESE_CONSTELLATIONS,
};
