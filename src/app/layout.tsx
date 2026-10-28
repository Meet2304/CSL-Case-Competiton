import type { Metadata, Viewport } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { UiScaleShortcut } from "@/components/shared/UiScaleShortcut";
import { uiScaleScript } from "@/lib/uiScale";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PNC Concept Prototype",
    template: "%s · PNC Concept Prototype",
  },
  description:
    "CSL Case Competition prototype that mirrors the PNC online and mobile banking experience. All data shown is mock data.",
};

export const viewport: Viewport = {
  themeColor: "#0a4a9c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The scale script may set data-scale on <html> before React hydrates.
    <html
      lang="en"
      className={`${openSans.variable} ${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: uiScaleScript }} />
        <UiScaleShortcut />
        {children}
      </body>
    </html>
  );
}
