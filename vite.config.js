import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://chat-bot-production-ac8f.up.railway.app/",
        changeOrigin: true,
      },
      "/chat": {
        target: "https://chat-bot-production-ac8f.up.railway.app/",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
