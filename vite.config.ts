import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { execFileSync } from 'node:child_process';
import { getPublicBuildInfo } from './scripts/buildInfo';

function sourceCommit() {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return undefined; }
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('@react-three') || id.includes('/three')) {
            return 'three-vendor';
          }
          if (id.includes('astronomy-engine')) {
            return 'astronomy-vendor';
          }
          if (id.includes('/react') || id.includes('zustand')) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    {
      name: 'public-build-identity',
      apply: 'build',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'build-info.json',
          source: `${JSON.stringify(getPublicBuildInfo(process.env, sourceCommit()), null, 2)}\n` });
      },
    },
    react(),
    tsconfigPaths()
  ],
})
