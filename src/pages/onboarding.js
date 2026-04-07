// Onboarding page script
import { injectIcons } from "../shared/icons.js";
import { initTheme, onThemeChange } from "../shared/theme.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Sync theme with other pages (popup/options)
  await initTheme();
  onThemeChange();

  // Inject icons
  injectIcons();

  // Close button handler
  document.getElementById("btn-get-started").addEventListener("click", () => {
    window.close();
  });
});
