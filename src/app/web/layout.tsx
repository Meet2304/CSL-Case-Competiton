export default function WebLayout({ children }: LayoutProps<"/web">) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
