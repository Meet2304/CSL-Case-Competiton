import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, EllipsisVertical, LogOut, type LucideIcon } from "lucide-react";
import { SignOffButton } from "@/components/shared/SignOffButton";
import { IconChip } from "@/components/ui/IconChip";
import { cn } from "@/lib/format";

/** White rounded container used for every grouped list in the app. */
export function MobileCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("overflow-hidden rounded-2xl bg-white shadow-card", className)}>{children}</section>;
}

/** Card heading with a small icon chip, e.g. "Card Actions". */
export function MobileCardTitle({ icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 border-b border-pnc-line px-4 py-3.5 text-lg font-medium">
      <IconChip icon={icon} size="sm" className="bg-pnc-blue-50" />
      {children}
    </h2>
  );
}

/** Text row with a blue chevron (Card Details style). */
export function MobileLinkRow({ label, href = "#", trailing }: { label: ReactNode; href?: string; trailing?: ReactNode }) {
  return (
    <li className="mx-4 border-b border-pnc-line last:border-b-0">
      {trailing ? (
        <div className="py-4">{trailing}</div>
      ) : (
        <Link href={href} className="flex items-center justify-between py-4 text-[15px]">
          {label}
          <ChevronRight className="size-5 text-pnc-link" />
        </Link>
      )}
    </li>
  );
}

/** Icon-chip row with a kebab menu (Pay & Transfer style). */
export function MobileIconRow({ icon, label, tint, href = "#" }: { icon: LucideIcon; label: string; tint?: string; href?: string }) {
  return (
    <li className="group flex items-center gap-4 pl-4 pr-2">
      <IconChip icon={icon} tint={tint} />
      <Link href={href} className="flex flex-1 items-center border-b border-pnc-line py-5 text-[17px] group-last:border-b-0">
        {label}
      </Link>
      <button type="button" aria-label={`More options for ${label}`} className="p-2 text-pnc-ink">
        <EllipsisVertical className="size-5" />
      </button>
    </li>
  );
}

/** "Sign Off" row in the same style as MobileIconRow. */
export function MobileSignOffRow() {
  return (
    <li className="group flex items-center gap-4 pl-4 pr-2">
      <IconChip icon={LogOut} />
      <SignOffButton className="flex flex-1 items-center border-b border-pnc-line py-5 text-left text-[17px] group-last:border-b-0">
        Sign Off
      </SignOffButton>
    </li>
  );
}
