import { loadFont } from "@remotion/google-fonts/Montserrat";

/** Colours from the app's tokens (src/app/globals.css in the prototype). */
export const C = {
  navy: "#0b2340",
  blue950: "#062a5c",
  blue900: "#083b80",
  blue800: "#0a4a9c",
  blue700: "#0b59b8",
  blue600: "#0f6bd0",
  link: "#0f62c2",
  blue50: "#e9f1fb",
  orange: "#ef6a00",
  orange600: "#d65f00",
  ink: "#1d2733",
  muted: "#5b6573",
  line: "#e3e6ea",
  surface: "#f3f4f6",
  law: "#5b3a9e",
  lawBg: "#f2eefa",
  lawLine: "#ddd3f1",
  positive: "#1f7a3a",
  positiveBg: "#e7f4ec",
  white: "#ffffff",
} as const;

/** Montserrat is the app's display face. */
export const { fontFamily: FONT } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

/** The calm in-out curve used for camera moves and swaps. */
export const EASE_IN_OUT = [0.45, 0, 0.2, 1] as const;
/** A soft settle for things arriving. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
