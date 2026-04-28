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
        // Content scripts: IIFE-loaded against live DOM/window, exercised via
        // browser integration testing rather than node-environment unit tests.
        "src/content/**",
      ],
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
    },
    setupFiles: ["tests/setup.js"],
  },
});
