import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import removeConsole from 'vite-plugin-remove-console';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      react(),
      removeConsole({
        include: ['**/*.ts', '**/*.tsx'],
        exclude: [],
      }),
      mkcert(), // Ajout du plugin mkcert
    ],
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
    },
    logLevel: mode === 'development' ? 'info' : 'error',
    server: {
      port: 5173,
      https: true, // Activer HTTPS avec mkcert
    },
    preview: {
      port: 5173,
      https: true, // Activer HTTPS pour preview
    },
  };
});