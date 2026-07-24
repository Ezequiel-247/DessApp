import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    envPrefix: ["VITE_", "BACKEND_"],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./tests/setup.ts"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov", "html"],
        include: ["src/**/*.{js,ts,jsx,tsx}"],
        exclude: [
          "src/main.jsx",
          "src/vite-env.d.ts",
          "src/mocks/**",
          "src/shared/lib/mockData*",
        ],
      },
    },
  };
});
