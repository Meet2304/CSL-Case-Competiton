import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CircleHelp, ShoppingCart, UserCog } from "lucide-react";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { routes } from "@/lib/routes";

const iconButton =
  "grid size-9 place-items-center rounded-full bg-pnc-blue-950/70 text-white hover:bg-pnc-blue-950";

/**
 * Blue faceted app header. `children` is the first white card, which
 * overlaps the bottom edge of the blue area like the native app.
 */
export function MobileHeader({
  title,
  backHref,
  right,
  children,
}: {
  title?: ReactNode;
  /** Shows a back arrow instead of the profile/settings button. */
  backHref?: string;
  /** Extra content on the title row (e.g. the Reminders pill). */
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className={`relative isolate px-4 pt-[calc(var(--status-h)+0.75rem)] text-white ${children ? "pb-14" : "pb-5"}`}>
        <FacetBackdrop className="-z-10" />
        <div className="flex items-center justify-between">
          {backHref ? (
            <Link href={backHref} aria-label="Back" className="grid size-9 place-items-center text-white">
              <ArrowLeft className="size-6" />
            </Link>
          ) : (
            <Link href={routes.more} aria-label="Profile and settings" className={iconButton}>
              <UserCog className="size-4.5" />
            </Link>
          )}
          <div className="flex gap-3">
            <button type="button" aria-label="Product catalog" className={iconButton}>
              <ShoppingCart className="size-4.5" />
            </button>
            <button type="button" aria-label="Help" className={iconButton}>
              <CircleHelp className="size-5" />
            </button>
          </div>
        </div>
        {(title || right) && (
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">{typeof title === "string" ? <h1 className="text-[28px] font-bold leading-tight">{title}</h1> : title}</div>
            {right}
          </div>
        )}
      </div>
      {children && <div className="relative -mt-11 px-3">{children}</div>}
    </div>
  );
}
