import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

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
    react(),
    tsconfigPaths()
  ],
})
