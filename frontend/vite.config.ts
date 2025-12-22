import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const promptTarget = env.VITE_PROMPT_SERVICE_URL || "http://localhost:8001";
  const genTarget = env.VITE_GEN_SERVICE_URL || "http://localhost:8002";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api/prompt": {
          target: promptTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/prompt/, ""),
        },
        "/api/gen": {
          target: genTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gen/, ""),
        },
      },
    },
  };
});
