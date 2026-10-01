import { getCultureEntry } from '../data/chineseSkyCulture';
import type { RenderableStar } from './starField';

/** Resolve only explicitly reviewed stable identities, never guess from translated labels. */
export function selectCultureReferenceStars(stars: RenderableStar[], selectedId: string | null) {
  const ids = new Set(getCultureEntry(selectedId)?.stars.map((star) => star.id));
  return stars.filter((star) => ids.delete(star.id));
}
