import { configureTextBuilder, preloadFont } from 'troika-three-text';

let isConfigured = false;
const warmupPromises = new Map<string, Promise<void>>();

export function configureTroikaText() {
  if (isConfigured) {
    return;
  }

  configureTextBuilder({
    unicodeFontsURL: new URL('/unicode-fonts/', window.location.href).href,
  });

  isConfigured = true;
}

export function warmupTroikaFont(font: string, characters?: string | string[]) {
  if (!font) {
    return Promise.resolve();
  }

  const characterKey = Array.isArray(characters) ? characters.join('\n') : characters ?? '';
  const cacheKey = `${font}__${characterKey}`;
  const cachedPromise = warmupPromises.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const warmupPromise = new Promise<void>((resolve) => {
    preloadFont(
      {
        font,
        characters: characters ?? '',
      },
      () => resolve()
    );
  });

  warmupPromises.set(cacheKey, warmupPromise);
  return warmupPromise;
}
