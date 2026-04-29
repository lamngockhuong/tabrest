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
        // Onboarding wizard: DOM-only renderers and mount glue. Pure logic
        // (decide-action, state, persist, steps) is covered separately.
        "src/pages/onboarding/wizard.js",
        "src/pages/onboarding/step-renderers.js",
        "src/pages/onboarding/render-done.js",
        "src/pages/onboarding/dom-helpers.js",
        "src/pages/onboarding/confetti.js",
      ],
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      // Floors sit ~5pp below current numbers so refactors have headroom but
      // a regression of >5pp fails CI. Raise as coverage grows.
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 80,
        branches: 75,
      },
    },
    setupFiles: ["tests/setup.js"],
  },
});
