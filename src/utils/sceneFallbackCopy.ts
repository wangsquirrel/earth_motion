import type { AppLanguage } from './i18n';

const copy = {
  'zh-CN': {
    title: '3D 星空暂不可用',
    description: '场景需要 WebGL 2。当前图形环境可能不支持，或场景初始化失败。控制面板与星空文化导览仍可使用。',
    help: '可换用支持 WebGL 2 的浏览器，或在图形能力恢复后重试。',
    retry: '重试 3D 场景',
  },
  en: {
    title: '3D sky unavailable',
    description: 'The scene needs WebGL 2. Graphics may be unavailable, or scene initialization failed. Controls and the sky-culture guide remain available.',
    help: 'Try a browser with WebGL 2 support, or retry when graphics are available.',
    retry: 'Retry 3D scene',
  },
} as const;

export function getSceneFallbackCopy(language: AppLanguage) {
  return copy[language];
}
