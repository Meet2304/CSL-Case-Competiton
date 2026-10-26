import type { ReactNode } from "react";
import { BatteryFull, Signal, Wifi } from "lucide-react";

/**
 * On md+ screens the mobile app renders inside an illustrated iPhone so it
 * can be demoed from a laptop. On real phones the frame disappears and the
 * app fills the viewport.
 *
 * `--status-h` is the height of the simulated status bar; mobile headers pad
 * their top by it so content never sits under the clock.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="w-full md:w-auto md:rounded-[3.4rem] md:bg-[#1b1d21] md:p-3 md:shadow-[0_30px_60px_-20px_rgb(0_0_0/0.55),inset_0_0_0_2px_#3a3d43]">
      {/* Height shrinks on short laptop screens so the whole phone stays visible. */}
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-pnc-surface [--status-h:0px] md:h-[min(844px,calc(100dvh-7.5rem))] md:w-[390px] md:rounded-[2.75rem] md:[--status-h:48px]">
        <StatusBar />
        {children}
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-30 hidden h-12 items-center justify-between bg-pnc-blue-700 px-8 text-[15px] font-semibold text-white md:flex">
      <span>9:41</span>
      <span className="absolute left-1/2 top-2.5 h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <Signal className="size-4" strokeWidth={2.5} />
        <Wifi className="size-4" strokeWidth={2.5} />
        <BatteryFull className="size-5" strokeWidth={2} />
      </span>
    </div>
  );
}
