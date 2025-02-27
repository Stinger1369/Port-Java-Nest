import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import removeConsole from 'vite-plugin-remove-console'; // Assure-toi que c'est bien "removeConsole"

export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      react(),
      removeConsole({
        include: ['**/*.ts', '**/*.tsx'], // Inclure les fichiers TypeScript et TSX
        exclude: [], // Exclure certains fichiers si nécessaire
      }),
    ],
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development', // Générer des sourcemaps en dev, pas en prod
    },
    logLevel: mode === 'development' ? 'info' : 'error', // Logs en dev, erreurs seulement en prod
    server: {
      port: 5173, // Port par défaut pour `dev` et `preview`
    },
    preview: {
      port: 5173, // Port pour `preview` (correspond à `start`)
    },
  };
});