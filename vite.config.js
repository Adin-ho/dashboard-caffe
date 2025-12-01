import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default ({ mode }) => {
  // load env file
  const env = loadEnv(mode, process.cwd(), "");

  const API_TARGET = env.VITE_API_URL || "https://api-kedai-genz.vercel.app";

  return defineConfig({
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: API_TARGET,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  });
};
