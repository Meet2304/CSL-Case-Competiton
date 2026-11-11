/**
 * Finds and operates elements inside the app's own pages, for the product
 * film. The app runs in a same-origin frame, so its document can be read and
 * its controls clicked exactly as a person would; nothing in the app knows
 * the film exists.
 */
import type { Rect, Target } from "@/lib/film";

const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
};

/** What a person would read on the element: its label and its text. */
const label = (el: Element) =>
  `${el.getAttribute("aria-label") ?? ""} ${el.textContent ?? ""}`.replace(/\s+/g, " ").trim();

export function find(doc: Document, target: Target): HTMLElement | null {
  let pool = [...doc.querySelectorAll<HTMLElement>(target.css ?? "body *")].filter(visible);
  const text = target.text;
  if (text !== undefined) {
    const matches = (el: Element) => (target.exact ? label(el) === text : label(el).includes(text));
    pool = pool.filter(matches);
    // Without a selector, take the smallest element that carries the words.
    if (!target.css) pool = pool.filter((el) => ![...el.children].some(matches));
  }
  // While a dialog is open, the words on it win over the same words on the page behind.
  const dialog = doc.querySelector("dialog[open]");
  if (dialog) {
    const inside = pool.filter((el) => dialog.contains(el));
    if (inside.length) pool = inside;
  }
  const el = pool[0];
  if (!el) return null;
  return target.closest ? el.closest<HTMLElement>(target.closest) : el;
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Waits for the element to appear; resolves with null when it never does. */
export async function waitFor(
  doc: () => Document | null | undefined,
  target: Target,
  timeout = 8000,
): Promise<HTMLElement | null> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const d = doc();
    const el = d?.body ? find(d, target) : null;
    if (el || Date.now() > deadline) return el;
    await sleep(120);
  }
}

/** The element's box in the page's own viewport. */
export function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
}

const MARGIN = 24;

/** Whether the element can be seen without scrolling (its top, when it is taller than the page). */
export function inView(el: HTMLElement): boolean {
  const view = el.ownerDocument.defaultView;
  if (!view) return true;
  const r = el.getBoundingClientRect();
  return r.height + MARGIN * 2 <= view.innerHeight
    ? r.top >= MARGIN && r.bottom <= view.innerHeight - MARGIN
    : r.top >= 0 && r.top <= MARGIN * 2;
}

/** Scrolls the page, at once, so the element is on screen. */
export function bringIntoView(el: HTMLElement) {
  const view = el.ownerDocument.defaultView;
  if (!view || inView(el)) return;
  const fits = el.getBoundingClientRect().height + MARGIN * 2 <= view.innerHeight;
  el.scrollIntoView({ block: fits ? "center" : "start", inline: "nearest", behavior: "instant" });
  // Leave a little room above a tall element, so its first line is not against the edge.
  if (!fits) view.scrollBy({ top: -MARGIN * 1.5, behavior: "instant" });
  // scrollIntoView also scrolls whatever holds the frame, which would shift the picture.
  const frame = view.frameElement;
  for (let box = frame?.parentElement; box; box = box.parentElement) box.scrollTo(0, 0);
  frame?.ownerDocument.defaultView?.scrollTo(0, 0);
}

/** Sets a field's text the way typing does, so the app's own change handlers run. */
export function setValue(el: HTMLElement, value: string) {
  const view = el.ownerDocument.defaultView;
  if (!view) return;
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new view.Event("input", { bubbles: true }));
}

/** Styles added to the app's pages while they are filmed. */
export const FILM_STYLE =
  // No scroll bar on the filmed page, and no development overlays.
  "html{scrollbar-width:none}html::-webkit-scrollbar{display:none}nextjs-portal{display:none!important}";
