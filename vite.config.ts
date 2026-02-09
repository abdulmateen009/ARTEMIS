import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Fix for "process is not defined" error in browser
      'process.env': {
        API_KEY: env.API_KEY || "",
        NODE_ENV: mode
      }
    },
    build: {
      chunkSizeWarningLimit: 1600, 
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@google/genai')) {
                return 'genai';
              }
              if (id.includes('recharts')) {
                return 'recharts';
              }
              if (id.includes('react')) {
                return 'vendor-react';
              }
              return 'vendor';
            }
          },
        },
      },
    },
  };
});