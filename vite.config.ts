import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // CRITICAL: This allows the app to access process.env.API_KEY in the browser
      // It replaces the string 'process.env.API_KEY' with the actual value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      // Fixes the "Adjust chunk size limit" warning
      chunkSizeWarningLimit: 1600, 
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Separate large 3rd party libraries into their own chunks for better caching
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