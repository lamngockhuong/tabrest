// Onboarding page script
import { injectIcons } from "../shared/icons.js";
import { initTheme } from "../shared/theme.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize theme
  await initTheme();

  // Inject icons
  injectIcons();

  // Close button handler
  document.getElementById("btn-get-started").addEventListener("click", () => {
    window.close();
  });
});
