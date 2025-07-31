/// <reference types="node" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => {
  // Carrega variáveis de ambiente do arquivo .env (se existir)
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist', // Pasta onde os arquivos construídos serão colocados
    },
    // Isso garante que `process.env.VITE_GEMINI_API_KEY` seja substituído 
    // pelo valor real durante o build.
    define: {
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
  };
});
