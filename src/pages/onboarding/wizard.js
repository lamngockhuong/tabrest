import { t } from "../../shared/i18n.js";
import { getSettings } from "../../shared/storage.js";
import { decideAction } from "./decide-action.js";
import { createState } from "./state.js";
import { STEPS } from "./steps.js";

const TRANSITION_MS = 200;
const TRANSITION_BUFFER_MS = 50;

export { decideAction };

export function mountWizard(rootEl, deps = {}) {
  if (!rootEl) return null;

  const closeWindow = deps.closeWindow ?? (() => window.close());
  const loadSettings = deps.loadSettings ?? getSettings;

  const state = createState(STEPS.length);
  const stage = rootEl.querySelector(".wizard-stage");
  const progressFill = rootEl.querySelector(".wizard-progress-fill");
  const progressBar = rootEl.querySelector(".wizard-progress");
  const announcer = rootEl.querySelector("#wizard-announcer");
  const sections = Array.from(rootEl.querySelectorAll(".wizard-step"));
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  let valueGetter = null;

  function activeSection() {
    return sections[state.stepIndex] ?? null;
  }

  async function renderStepBody() {
    const sec = activeSection();
    const step = STEPS[state.stepIndex];
    if (!sec || !step) return;
    const slot = sec.querySelector("[data-step-body]");
    if (!slot) {
      valueGetter = null;
      return;
    }
    const settings = await loadSettings();
    valueGetter = step.render(slot, settings) ?? null;
  }

  function focusActiveHeading() {
    const heading = activeSection()?.querySelector("h2");
    if (!heading) return;
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: false });
  }

  function applyVisibility() {
    sections.forEach((sec, i) => {
      const isActive = i === state.stepIndex;
      sec.classList.toggle("is-active", isActive);
      if (isActive) sec.removeAttribute("inert");
      else sec.setAttribute("inert", "");
    });
    rootEl.dataset.currentStep = STEPS[state.stepIndex]?.id ?? "";
    if (progressFill) {
      progressFill.style.width = `${((state.stepIndex + 1) / state.total) * 100}%`;
    }
    if (progressBar) {
      progressBar.setAttribute("aria-valuenow", String(state.stepIndex + 1));
    }
    if (announcer) {
      announcer.textContent = t("obProgressLabel", [
        String(state.stepIndex + 1),
        String(state.total),
      ]);
    }
  }

  async function swapTo(direction) {
    if (reducedMotion || !stage) {
      applyVisibility();
      await renderStepBody();
      focusActiveHeading();
      return;
    }
    const leavingClass = direction === "forward" ? "is-leaving-forward" : "is-leaving-back";
    stage.classList.add(leavingClass);
    await new Promise((r) => setTimeout(r, TRANSITION_MS + TRANSITION_BUFFER_MS));
    stage.classList.remove(leavingClass);
    applyVisibility();
    await renderStepBody();
    focusActiveHeading();
  }

  async function handleAction(action) {
    const decision = decideAction({ action, state });
    if (decision.effect === "close") {
      closeWindow();
      return;
    }
    if (decision.effect === "advance") {
      const outgoing = STEPS[state.stepIndex];
      if (decision.persist && valueGetter && outgoing?.persist) {
        try {
          await outgoing.persist(valueGetter());
        } catch (err) {
          console.error("[wizard] persist failed:", err);
        }
      }
      state.advance();
      await swapTo("forward");
      return;
    }
    if (decision.effect === "retreat") {
      state.retreat();
      await swapTo("back");
    }
  }

  rootEl.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target || !rootEl.contains(target)) return;
    e.preventDefault();
    handleAction(target.dataset.action);
  });

  applyVisibility();
  renderStepBody();

  return { state, handleAction };
}
