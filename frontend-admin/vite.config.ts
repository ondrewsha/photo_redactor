import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: '/admin/',
    plugins: [react()],
    define: {
      'process.env': {}
    },
    server: {
      port: 5174,
    },
  };
});
