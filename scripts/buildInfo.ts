/** Public, allowlisted deployment identity; never expose arbitrary environment values. */
export function getPublicBuildInfo(env: Record<string, string | undefined>, gitSha?: string) {
  const candidate = env.VERCEL_GIT_COMMIT_SHA || env.VITE_VERCEL_GIT_COMMIT_SHA || gitSha;
  return {
    sourceCommit: candidate && /^[a-f0-9]{40}$/i.test(candidate) ? candidate : null,
    featureSet: 'chinese-sky-culture-v1',
    environment: ['production', 'preview', 'development'].includes(env.VERCEL_ENV ?? '')
      ? env.VERCEL_ENV : 'local',
  };
}
