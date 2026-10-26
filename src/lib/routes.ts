/**
 * Public URLs. The same URL serves the web dashboard on laptops/tablets and
 * the mobile app on phones — `src/proxy.ts` rewrites each request into
 * `app/web/...` or `app/mobile/...`. Always link to these paths, never to
 * `/web/...` or `/mobile/...` directly.
 */
export const routes = {
  signOn: "/",
  accounts: "/accounts",
  payTransfer: "/pay-transfer",
  rewards: "/rewards",
  cards: "/cards",
  card: (id: string) => `/cards/${id}`,
  deposit: "/deposit",
  more: "/more",
  help: "/help",
  /** Customer family dashboard (members, roles, asset access, succession). */
  family: "/family",
  /** Advisor (bank representative) home dashboard. */
  advisor: "/advisor",
} as const;

export type View = "web" | "mobile";

/**
 * Strips the internal `/web` or `/mobile` prefix. During static prerender the
 * server sees the internal path while the browser sees the public one, so UI
 * that depends on the path must compare normalised values.
 */
export function toPublicPath(pathname: string): string {
  const stripped = pathname.replace(/^\/(web|mobile)(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}
