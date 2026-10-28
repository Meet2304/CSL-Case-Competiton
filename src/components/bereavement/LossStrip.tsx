"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { ChevronRight, HeartHandshake, X } from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { bereavementActions } from "@/lib/bereavement";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";
import { useHouseholdLoss } from "./useHouseholdLoss";

/**
 * Soft red condolence strip shown to the household after the bank records a
 * death. Laptop: under the top navigation. Phone: just above the tab bar.
 * Adults follow it to My Assets › Unclaimed assets; children can close it.
 * Either way it goes away for that person once they've acted on it.
 */
export function LossStrip({ variant }: { variant: "web" | "mobile" }) {
  const { state, loss, firstName } = useHouseholdLoss();
  const { person, isMinor } = useViewer();
  if (!loss || state.seenBy?.[person.id] === loss.id) return null;
  const seen = () => bereavementActions.acknowledgeLoss(person.id, loss.id);

  const shell =
    variant === "mobile"
      ? "relative z-20 flex shrink-0 items-center gap-2.5 border-t border-attention-line bg-attention-bg px-4 py-2.5 text-sm text-pnc-ink"
      : "block border-b border-attention-line bg-attention-bg";
  const inner =
    variant === "mobile"
      ? "contents"
      : "mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 text-sm text-pnc-ink sm:px-6";

  // Children only get the condolence: the adults and PNC handle the accounts.
  if (isMinor)
    return (
      <div role="status" className={shell}>
        <span className={inner}>
          <HeartHandshake className="size-5 shrink-0 text-attention" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            We&apos;re so sorry about {firstName}. There&apos;s nothing you need to do here.
          </span>
          <button
            type="button"
            onClick={seen}
            aria-label="Close"
            className="grid size-7 shrink-0 place-items-center rounded-full text-attention hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-pnc-link"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </span>
      </div>
    );

  /** Opens the Unclaimed assets tab, even from My Assets itself (where the URL only changes its hash). */
  function open(e: MouseEvent<HTMLAnchorElement>) {
    seen();
    if (window.location.pathname === routes.assets) {
      e.preventDefault();
      window.history.pushState(null, "", `#${routes.unclaimedAssets.split("#")[1]}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  }

  return (
    <Link
      href={routes.unclaimedAssets}
      onClick={open}
      className={cn(shell, "group hover:bg-attention-bg/70")}
    >
      <span className={inner}>
        <HeartHandshake className="size-5 shrink-0 text-attention" aria-hidden="true" />
        <span className="min-w-0 flex-1 leading-snug">
          <span className="font-semibold text-attention">
            We&apos;re so sorry for the loss of {firstName}.
          </span>{" "}
          {variant === "web" && (
            <>
              When you feel ready, {firstName}&apos;s accounts that pass to you are in one place.
              There&apos;s nothing you need to do today.{" "}
            </>
          )}
          <span className="font-semibold text-attention group-hover:underline">
            See what passes to you
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-attention" aria-hidden="true" />
      </span>
    </Link>
  );
}
