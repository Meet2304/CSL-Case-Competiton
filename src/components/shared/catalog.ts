import {
  ArrowLeftRight,
  Banknote,
  Globe,
  HandCoins,
  Landmark,
  MapPin,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Feature lists shared by the web and mobile views so both stay in sync.

export type CatalogItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Override icon tint for partner brands (e.g. Zelle purple). */
  tint?: string;
};

/** Grouped exactly like the mobile Pay & Transfer screen. */
export const payTransferGroups: { id: string; items: CatalogItem[] }[] = [
  {
    id: "transfers",
    items: [
      {
        id: "pnc-transfers",
        label: "PNC Transfers",
        description: "Move money between your PNC accounts.",
        icon: ArrowLeftRight,
      },
      {
        id: "external-transfers",
        label: "External Transfers",
        description: "Transfer to or from accounts at other banks.",
        icon: Landmark,
      },
    ],
  },
  {
    id: "zelle",
    items: [
      {
        id: "zelle",
        label: "Send Money With Zelle®",
        description: "Send and request money with people you know.",
        icon: Zap,
        tint: "#6d1ed4",
      },
    ],
  },
  {
    id: "bill-pay",
    items: [
      {
        id: "payments-advances",
        label: "PNC Payments & Advances",
        description: "Pay PNC loans and credit cards.",
        icon: HandCoins,
      },
      {
        id: "bill-pay",
        label: "Bill Pay",
        description: "Pay companies and people from one place.",
        icon: Banknote,
      },
    ],
  },
  {
    id: "wires",
    items: [
      {
        id: "domestic-wires",
        label: "Domestic Wires",
        description: "Send a wire within the U.S.",
        icon: MapPin,
      },
      {
        id: "international-wires",
        label: "International Wires",
        description: "Send a wire to another country.",
        icon: Globe,
      },
    ],
  },
];
