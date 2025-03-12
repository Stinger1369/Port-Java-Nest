import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import removeConsole from 'vite-plugin-remove-console';
// import mkcert from 'vite-plugin-mkcert'; // Commenté pour désactiver HTTPS

export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      react(),
      removeConsole({
        include: ['**/*.ts', '**/*.tsx'],
        exclude: [],
      }),
      // mkcert(), // Commenté pour désactiver HTTPS
    ],
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
    },
    logLevel: mode === 'development' ? 'info' : 'error',
    server: {
      port: 5173,
      // https: true, // Désactivé pour revenir à HTTP
    },
    preview: {
      port: 5173,
      // https: true, // Désactivé pour revenir à HTTP
    },
  };
});