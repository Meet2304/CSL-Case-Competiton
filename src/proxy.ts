import { NextResponse, userAgent, type NextRequest } from "next/server";
import { toPublicPath, type View } from "@/lib/routes";

/**
 * Device-based view selection. Phones get the mobile app (`app/mobile`);
 * everything else (laptops, desktops, tablets) gets online banking
 * (`app/web`). The URL in the browser stays the same either way.
 *
 * Demo override (no UI for it): append `?view=mobile` or `?view=web` to any
 * URL to pin a view in a cookie, `?view=auto` to go back to detection.
 */

const VIEW_COOKIE = "pnc-view";

// Pages that only exist in one view are sent to the closest equivalent.
const fallbacks: Record<View, (path: string) => string | undefined> = {
  web: (path) => {
    if (path === "/deposit" || path === "/more") return "/accounts";
    if (path.startsWith("/cards/")) return "/cards";
  },
  mobile: (path) => {
    if (path === "/help" || path === "/cards") return "/more";
  },
};

function detectView(request: NextRequest): View {
  const pinned = request.cookies.get(VIEW_COOKIE)?.value;
  if (pinned === "web" || pinned === "mobile") return pinned;
  return userAgent(request).device.type === "mobile" ? "mobile" : "web";
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const publicPath = toPublicPath(url.pathname);

  // Handle the ?view= override, then drop the param from the URL.
  const override = url.searchParams.get("view");
  if (override === "web" || override === "mobile" || override === "auto") {
    url.searchParams.delete("view");
    url.pathname = publicPath;
    const res = NextResponse.redirect(url);
    if (override === "auto") res.cookies.delete(VIEW_COOKIE);
    else res.cookies.set(VIEW_COOKIE, override, { path: "/", sameSite: "lax" });
    return res;
  }

  // Internal paths are not public: /web/cards -> /cards.
  if (publicPath !== url.pathname) {
    url.pathname = publicPath;
    return NextResponse.redirect(url);
  }

  const view = detectView(request);
  const fallback = fallbacks[view](publicPath);
  if (fallback) {
    url.pathname = fallback;
    return NextResponse.redirect(url);
  }

  url.pathname = `/${view}${publicPath === "/" ? "" : publicPath}`;
  const res = NextResponse.rewrite(url);
  res.headers.set("Vary", "User-Agent, Cookie");
  return res;
}

export const config = {
  // Skip Next internals and files with an extension (favicon, images, ...).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
