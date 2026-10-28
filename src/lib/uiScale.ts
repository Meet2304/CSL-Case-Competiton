/**
 * A larger interface for presentation screenshots: every size in the app is
 * in rem, so raising the root font size (see `html[data-scale]` in
 * globals.css) scales text, spacing and icons together while breakpoints stay
 * put. It is cycled from the keyboard only (UiScaleShortcut) and never shown
 * or named in the UI.
 */

/** The levels the shortcut cycles through; "" is the normal size. */
export const UI_SCALES = ["", "lg", "xl"] as const;
export type UiScale = (typeof UI_SCALES)[number];

export const UI_SCALE_KEY = "pnc-ui-scale";

/** Inline script that applies a saved level before the page paints, so there's no flash. */
export const uiScaleScript = `try{var s=localStorage.getItem(${JSON.stringify(UI_SCALE_KEY)});if(s)document.documentElement.dataset.scale=s}catch(e){}`;

/** The level after `current`, wrapping back to normal. Anything unrecognised counts as normal. */
export function nextUiScale(current: string | undefined): UiScale {
  const at = Math.max(0, UI_SCALES.indexOf((current ?? "") as UiScale));
  return UI_SCALES[(at + 1) % UI_SCALES.length];
}
