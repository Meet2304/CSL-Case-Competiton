// Advisor (bank representative) screens. Only reachable with the "advisor" role.
// One home screen, so there's no tab bar; client pages link back to it.
export default function AdvisorMobileLayout({ children }: LayoutProps<"/mobile/advisor">) {
  return <main className="no-scrollbar flex-1 overflow-y-auto pb-6">{children}</main>;
}
