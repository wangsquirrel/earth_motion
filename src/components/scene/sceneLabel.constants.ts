import { getLocalizedBodyLabel as getBodyLabel } from '../../utils/i18n';
import type { AppLanguage } from '../../utils/i18n';

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

export function getLocalizedBodyLabel(name: string, language: AppLanguage) {
  return getBodyLabel(name, language);
}
