/**
 * Public URLs. The same URL serves the web dashboard on laptops/tablets and
 * the mobile app on phones — `src/proxy.ts` rewrites each request into
 * `app/web/...` or `app/mobile/...`. Always link to these paths, never to
 * `/web/...` or `/mobile/...` directly.
 */
export const routes = {
  signOn: "/",
  /** Guided tour of the concept: open to everyone, one layout for every device. */
  tour: "/tour",
  /** Product film: a movie-style walk through the working app. Open to everyone. */
  film: "/film",
  /** Customer home: portfolio summary and analysis, notifications, families and team. */
  home: "/home",
  /** Assets and Debts: everything the customer owns, manages, or family shares with them, and their will. */
  assets: "/assets",
  payTransfer: "/pay-transfer",
  rewards: "/rewards",
  cards: "/cards",
  card: (id: string) => `/cards/${id}`,
  deposit: "/deposit",
  more: "/more",
  help: "/help",
  /** Customer family dashboard (members, roles, asset access, succession). */
  family: "/family",
  /** One family's assets, and (for admins) the way to manage it. */
  familyDetail: (id: string) => `/family#${id}`,
  /** Your will, under Assets and Debts: write it, see it on file (adults only). */
  will: "/assets/will",
  /** Add an asset to Assets and Debts: connect an account, track a ticker, value property, or enter one. */
  addAsset: "/assets/add",
  /** Manage one account on Assets and Debts, e.g. to name its beneficiary. */
  manageAsset: (accountId: string) => `/assets#manage-${accountId}`,
  /** After a death in the household: the deceased's accounts that can pass to the viewer. */
  unclaimedAssets: "/assets#unclaimed",
  /** One claim on Assets and Debts › Unclaimed assets, by survivor-plan item id. */
  claimAsset: (itemId: string) => `/assets#claim-${encodeURIComponent(itemId)}`,
  /** Advisor (bank representative) home dashboard. */
  advisor: "/advisor",
  /** Advisor: one client's summary, family, loss guide and assistant. */
  advisorClient: (id: string) => `/advisor/clients/${id}`,
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
