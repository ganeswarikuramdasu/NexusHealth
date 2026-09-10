/**
 * busyButton.ts
 * -------------
 * Cross-cutting fix: every clickable button in the app must visibly respond
 * the instant it is clicked, so users never re-click an action that is
 * already running.
 *
 * Mechanics (no component changes needed):
 *  - A native capture-phase click listener marks the clicked button as
 *    "pending" synchronously (native `disabled`), which also blocks a second
 *    click / keyboard activation at the DOM level.
 *  - window.fetch is patched to count in-flight requests. When a real network
 *    call starts after the click, the button is promoted to a visible busy
 *    state (spinner + dimmed) via the `data-nh-busy` attribute.
 *  - The button is released once its own requests return to the baseline
 *    count (or a hard safety timeout elapses, or the node leaves the DOM).
 */

const INSTALL_KEY = "__nhBusyButtonInstalled";

interface BusyInfo {
  startedAt: number;
  baseline: number;
  upgraded: boolean;
}

let inflight = 0;
const busyEls = new Map<HTMLElement, BusyInfo>();
let sweeper: number | null = null;

const NO_FETCH_GRACE_MS = 400;
const MIN_VISIBLE_MS = 150;
const HARD_CAP_MS = 15000;

function isNativeControl(el: HTMLElement): el is HTMLButtonElement | HTMLInputElement {
  return el.tagName === "BUTTON" || el.tagName === "INPUT";
}

function markBusy(el: HTMLElement) {
  if (busyEls.has(el)) return;
  if (isNativeControl(el) && el.disabled) return;
  if (el.getAttribute("aria-disabled") === "true") return;

  el.setAttribute("data-nh-pressed", "1");
  if (isNativeControl(el)) el.disabled = true;
  busyEls.set(el, { startedAt: Date.now(), baseline: inflight, upgraded: false });
  ensureSweeper();
}

function release(el: HTMLElement) {
  busyEls.delete(el);
  el.removeAttribute("data-nh-pressed");
  el.removeAttribute("data-nh-busy");
  if (isNativeControl(el)) el.disabled = false;
}

function sweep() {
  const now = Date.now();
  busyEls.forEach((info, el) => {
    const fetchActive = inflight > info.baseline;

    if (fetchActive && !info.upgraded) {
      info.upgraded = true;
      el.setAttribute("data-nh-busy", "1");
    }

    const done =
      !el.isConnected ||
      now - info.startedAt > HARD_CAP_MS ||
      (!fetchActive && now - info.startedAt >= (info.upgraded ? MIN_VISIBLE_MS : NO_FETCH_GRACE_MS));

    if (done) release(el);
  });

  if (busyEls.size === 0) stopSweeper();
}

function ensureSweeper() {
  if (sweeper == null) {
    sweeper = window.setInterval(sweep, 200);
  }
}

function stopSweeper() {
  if (sweeper != null) {
    window.clearInterval(sweeper);
    sweeper = null;
  }
}

function onClickCapture(ev: Event) {
  const mouse = ev as MouseEvent;
  if (mouse.button !== 0) return;
  if (ev.defaultPrevented) return;
  const target = ev.target as Element | null;
  if (!target) return;
  const btn = target.closest('button, [role="button"], input[type="submit"], input[type="button"]') as HTMLElement | null;
  if (!btn) return;
  markBusy(btn);
}

function patchFetch() {
  const originalFetch = window.fetch.bind(window);
  const patchedFetch: typeof fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    inflight++;
    try {
      return originalFetch(input, init).finally(() => {
        inflight--;
        if (busyEls.size > 0) sweep();
      });
    } catch (err) {
      inflight--;
      if (busyEls.size > 0) sweep();
      throw err;
    }
  };
  window.fetch = patchedFetch;
}

export function installBusyButtons() {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[INSTALL_KEY]) return;
  w[INSTALL_KEY] = true;

  patchFetch();
  document.addEventListener("click", onClickCapture, true);
}