"use client";

import { useState } from "react";
import {
  CalendarCog,
  ChartPie,
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  ReceiptText,
  SquarePen,
  Trophy,
} from "lucide-react";
import { IconChip } from "@/components/ui/IconChip";
import { Money } from "@/components/ui/Money";
import type { WalletSubAccount } from "@/data/types";
import { cn } from "@/lib/format";

const tools = [
  { label: "Spending & Budgets", icon: ChartPie },
  { label: "Low Cash Mode", icon: ReceiptText },
  { label: "Savings Goals", icon: Trophy },
  { label: "Savings Rules", icon: CalendarCog },
];

/** Collapsible Virtual Wallet bundle (Spend / Reserve / Growth + tools). */
export function WalletCard({ title, accounts }: { title: string; accounts: WalletSubAccount[] }) {
  const [open, setOpen] = useState(true);
  const [lowCashOpen, setLowCashOpen] = useState(false);
  const [spend, ...savings] = accounts;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-card">
      <header className="flex items-center justify-between gap-2 bg-pnc-chip px-4 py-3">
        <h2 className="text-md">{title}</h2>
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Collapse wallet" : "Expand wallet"}
            className="grid size-6 place-items-center rounded-full bg-pnc-ink text-white"
          >
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </span>
      </header>

      {open && (
        <>
          <SubAccountRow account={spend} />

          <div className="mx-4 border-b border-pnc-line">
            <button
              type="button"
              onClick={() => setLowCashOpen(!lowCashOpen)}
              aria-expanded={lowCashOpen}
              className="flex w-full items-center gap-4 py-4 text-left"
            >
              <ReceiptText className="size-6 text-pnc-blue-700" strokeWidth={1.75} />
              <span className="flex-1 text-[1.0625rem] font-medium">Low Cash Mode</span>
              <ChevronDown
                className={cn("size-5 text-pnc-link transition", lowCashOpen && "rotate-180")}
              />
            </button>
            {lowCashOpen && (
              <p className="pb-4 text-sm text-pnc-muted">
                Low Cash Mode gives you extra time to bring your Spend balance positive before
                overdraft fees apply.
              </p>
            )}
          </div>

          {savings.map((a) => (
            <SubAccountRow key={a.id} account={a} />
          ))}

          <ul className="grid grid-cols-4 gap-1 px-2 pt-4 text-center">
            {tools.map((t) => (
              <li key={t.label}>
                <a href="#" className="flex flex-col items-center gap-1.5 text-xs leading-tight">
                  <IconChip icon={t.icon} />
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#"
            className="flex items-center justify-center gap-1.5 py-3 text-sm text-pnc-link"
          >
            <SquarePen className="size-4" /> Customize Tools
          </a>
        </>
      )}
    </section>
  );
}

function SubAccountRow({ account }: { account: WalletSubAccount }) {
  const negative = account.balance < 0;
  return (
    <div className="mx-4 flex items-start gap-2 border-b border-pnc-line py-4">
      <a href="#" className="flex-1 pt-1 text-[1.0625rem] text-pnc-link">
        {account.label} x{account.last4}
      </a>
      <div className="text-right">
        <Money
          value={account.balance}
          className={cn("block text-2xl font-bold", negative && "text-pnc-negative")}
        />
        {account.note && <span className="mt-1 block text-xs text-pnc-muted">{account.note}</span>}
        {negative ? (
          <span className="mt-1 block text-xs text-pnc-muted">
            Available Balance <Money value={account.availableBalance} className="ml-1 text-sm" />
          </span>
        ) : (
          <span className="block text-xs text-pnc-muted">Available Balance</span>
        )}
      </div>
      <button
        type="button"
        aria-label={`Options for ${account.label}`}
        className="pt-1.5 text-pnc-ink"
      >
        <EllipsisVertical className="size-5" />
      </button>
    </div>
  );
}
