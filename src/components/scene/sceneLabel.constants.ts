import type { SkyCulture } from '../../utils/stars';

export const SCENE_LABEL_FONT_URL = '/fonts/noto-sans-sc-sc-400.woff';
export const BODY_LABEL_ANCHOR_X = 'left' as const;
export const BODY_LABEL_ANCHOR_Y = 'middle' as const;
export const BODY_LABEL_OUTLINE_COLOR = '#06111f';

export type BodyLabelSpec = {
  offset: [number, number, number];
  fontSize: number;
  fillOpacity: number;
  outlineWidth: number;
};

export const BODY_LABEL_SPECS: Record<'sun' | 'moon' | 'planet', BodyLabelSpec> = {
  sun: {
    offset: [0.18, 0.13, 0],
    fontSize: 0.16,
    fillOpacity: 0.9,
    outlineWidth: 0.006,
  },
  moon: {
    offset: [0.13, 0.09, 0],
    fontSize: 0.16,
    fillOpacity: 0.86,
    outlineWidth: 0.006,
  },
  planet: {
    offset: [0.11, 0.08, 0],
    fontSize: 0.16,
    fillOpacity: 0.82,
    outlineWidth: 0.006,
  },
};

export const EARTH_STAR_LABEL_OFFSET: [number, number, number] = [0.22, 0.12, 0];

export function getLocalizedBodyLabel(name: string, culture: SkyCulture) {
  if (culture === 'western') {
    return name;
  }

  const map: Record<string, string> = {
    Sun: '太阳',
    Moon: '月亮',
    Mercury: '水星',
    Venus: '金星',
    Mars: '火星',
    Jupiter: '木星',
    Saturn: '土星',
    Uranus: '天王星',
    Neptune: '海王星',
    Pluto: '冥王星',
  };

  return map[name] ?? name;
}
