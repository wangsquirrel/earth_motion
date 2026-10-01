import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPublicBuildInfo } from '../scripts/buildInfo';

await test('public build identity exposes only a validated source SHA and allowlisted metadata', () => {
  const sha = 'a'.repeat(40);
  assert.deepEqual(getPublicBuildInfo({ VERCEL_GIT_COMMIT_SHA: sha, VERCEL_ENV: 'production', PRIVATE_TOKEN: 'never-export' }), {
    sourceCommit: sha, featureSet: 'chinese-sky-culture-v3-six-mansion-anchors', environment: 'production',
  });
  assert.equal(getPublicBuildInfo({}, sha).sourceCommit, sha);
  assert.equal(getPublicBuildInfo({ VITE_VERCEL_GIT_COMMIT_SHA: sha }).sourceCommit, sha);
  assert.equal(getPublicBuildInfo({ VERCEL_GIT_COMMIT_SHA: 'invalid' }).sourceCommit, null);
  assert.equal(getPublicBuildInfo({ VERCEL_ENV: 'private-value' }).environment, 'local');
});
