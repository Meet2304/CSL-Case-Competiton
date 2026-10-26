import { PhoneFrame } from "@/components/mobile/PhoneFrame";

// Phones are routed here by src/proxy.ts. The phone frame only appears if a
// wide screen is pinned to the mobile view (?view=mobile) for demos.
export default function MobileLayout({ children }: LayoutProps<"/mobile">) {
  return (
    <div className="flex min-h-screen flex-col md:bg-[#2b3035]">
      <div className="flex flex-1 flex-col items-center justify-center md:py-5">
        <PhoneFrame>{children}</PhoneFrame>
      </div>
    </div>
  );
}
