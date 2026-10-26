import { NextResponse, userAgent, type NextRequest } from "next/server";
import { routes, toPublicPath, type View } from "@/lib/routes";
import { homeFor, isAdvisorPath, parseRole, SESSION_COOKIE } from "@/lib/session";

/**
 * Two decisions are made here for every page request:
 *
 * 1. Role (from the demo session cookie): signed-out visitors only see
 *    sign-on, customers only see customer pages, advisors only see
 *    `/advisor`.
 * 2. Device: phones get the mobile app (`app/mobile`); everything else
 *    (laptops, desktops, tablets) gets online banking (`app/web`). The URL in
 *    the browser stays the same either way.
 *
 * Demo override (no UI for it): append `?view=mobile` or `?view=web` to any
 * URL to pin a view in a cookie, `?view=auto` to go back to detection.
 */

const VIEW_COOKIE = "pnc-view";

// Customer pages that only exist in one view are sent to the closest equivalent.
const fallbacks: Record<View, (path: string) => string | undefined> = {
  web: (path) => {
    if (path === routes.deposit || path === routes.more) return routes.accounts;
    if (path.startsWith(`${routes.cards}/`)) return routes.cards;
  },
  mobile: (path) => {
    if (path === routes.help || path === routes.cards) return routes.more;
  },
};

function detectView(request: NextRequest): View {
  const pinned = request.cookies.get(VIEW_COOKIE)?.value;
  if (pinned === "web" || pinned === "mobile") return pinned;
  return userAgent(request).device.type === "mobile" ? "mobile" : "web";
}

/** Where a request should be redirected for the signed-in role, if anywhere. */
function roleRedirect(request: NextRequest, path: string): string | undefined {
  const role = parseRole(request.cookies.get(SESSION_COOKIE)?.value);
  if (path === routes.signOn) return role ? homeFor(role) : undefined;
  if (!role) return routes.signOn;
  if (role === "advisor" && !isAdvisorPath(path)) return routes.advisor;
  if (role === "customer" && isAdvisorPath(path)) return routes.accounts;
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

  // Server Action POSTs (sign-in) must reach the page they were posted from.
  const isAction = request.method === "POST";
  const view = detectView(request);
  const redirectTo = isAction
    ? undefined
    : (roleRedirect(request, publicPath) ?? fallbacks[view](publicPath));
  if (redirectTo) {
    url.pathname = redirectTo;
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
