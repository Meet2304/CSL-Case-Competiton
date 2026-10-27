"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, HeartHandshake } from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { routes, toPublicPath } from "@/lib/routes";
import { useHouseholdLoss } from "./useHouseholdLoss";

/**
 * Soft red information strip shown to the household after the bank records a
 * death. Laptop: under the top navigation. Phone: just above the tab bar.
 * Worded to comfort first and point to next steps without pressure.
 */
export function LossStrip({ variant }: { variant: "web" | "mobile" }) {
  const { loss, firstName } = useHouseholdLoss();
  const { isMinor } = useViewer();
  const onNextSteps = toPublicPath(usePathname()) === routes.nextSteps;
  if (!loss) return null;

  // Children only get the condolence: the adults and PNC handle the accounts.
  if (isMinor) {
    return (
      <p
        role="status"
        className={
          variant === "mobile"
            ? "relative z-20 flex shrink-0 items-center gap-2.5 border-t border-attention-line bg-attention-bg px-4 py-2.5 text-sm text-pnc-ink"
            : "border-b border-attention-line bg-attention-bg"
        }
      >
        <span
          className={
            variant === "mobile"
              ? "contents"
              : "mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 text-sm text-pnc-ink sm:px-6"
          }
        >
          <HeartHandshake className="size-5 shrink-0 text-attention" aria-hidden="true" />
          <span>
            We&apos;re so sorry about {firstName}. There&apos;s nothing you need to do here.
          </span>
        </span>
      </p>
    );
  }

  if (variant === "mobile") {
    // The Next steps page opens with its own condolence; don't repeat it above the tab bar.
    if (onNextSteps) return null;
    return (
      <Link
        href={routes.nextSteps}
        role="status"
        className="relative z-20 flex shrink-0 items-center gap-2.5 border-t border-attention-line bg-attention-bg px-4 py-2.5 text-sm text-pnc-ink"
      >
        <HeartHandshake className="size-5 shrink-0 text-attention" aria-hidden="true" />
        <span className="min-w-0 flex-1 leading-snug">
          We&apos;re so sorry for the loss of {firstName}.{" "}
          <span className="font-semibold text-attention">
            See next steps when you&apos;re ready
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-attention" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <div role="status" className="border-b border-attention-line bg-attention-bg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <HeartHandshake className="size-5 shrink-0 text-attention" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm text-pnc-ink">
          <span className="font-semibold text-attention">
            We&apos;re so sorry for the loss of {firstName}.
          </span>{" "}
          When you feel ready, we&apos;ve gathered the few steps needed to look after {firstName}
          &apos;s accounts in one place. There&apos;s nothing you need to do today.
        </p>
        {!onNextSteps && (
          <Link
            href={routes.nextSteps}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-attention hover:underline"
          >
            See next steps <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
