// Onboarding page entry: boots theme, i18n, icons, then mounts the wizard.

import { localizeHtml } from "../shared/i18n.js";
import { injectIcons } from "../shared/icons.js";
import { initTheme, onThemeChange } from "../shared/theme.js";
import { mountWizard } from "./onboarding/wizard.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initTheme();
  onThemeChange();
  localizeHtml();
  injectIcons();
  mountWizard(document.querySelector(".wizard-root"));
});
