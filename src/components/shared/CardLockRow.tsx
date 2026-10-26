"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/Toggle";

/** "Lock card" control. State is local only — nothing is sent anywhere. */
export function CardLockRow({ cardName }: { cardName: string }) {
  const [locked, setLocked] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <span className="block">Lock card</span>
        <span className="block text-xs text-pnc-muted">
          {locked ? "Card is locked — new purchases will be declined." : "Card is active."}
        </span>
      </span>
      <Toggle checked={locked} onChange={setLocked} label={`Lock ${cardName}`} />
    </div>
  );
}
