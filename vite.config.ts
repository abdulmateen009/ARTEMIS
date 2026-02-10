import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Safely inject the API key as a string replacement
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "")
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