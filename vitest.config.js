import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      exclude: [
        "src/**/popup.js",
        "src/**/options.js",
        "src/**/onboarding.js",
        "src/**/service-worker.js",
      ],
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
    },
    setupFiles: ["tests/setup.js"],
  },
});
