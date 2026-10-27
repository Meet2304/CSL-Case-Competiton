import {
  ArrowLeftRight,
  BadgeDollarSign,
  Banknote,
  Car,
  CreditCard,
  Droplet,
  Flame,
  Globe,
  GraduationCap,
  HandCoins,
  House,
  Landmark,
  Lightbulb,
  MapPin,
  PiggyBank,
  ReceiptText,
  ShieldPlus,
  Smartphone,
  Tv,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { BillCategory } from "@/data/types";

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

/** Everyday payments on the family dashboard, in the order the grid shows them. */
export const billCategories: { id: BillCategory; label: string; icon: LucideIcon }[] = [
  { id: "electricity", label: "Electricity", icon: Lightbulb },
  { id: "mobile-prepaid", label: "Mobile prepaid", icon: Smartphone },
  { id: "phone", label: "Phone bill", icon: ReceiptText },
  { id: "investments", label: "Investments", icon: PiggyBank },
  { id: "tolls", label: "Tolls", icon: Car },
  { id: "insurance", label: "Insurance", icon: ShieldPlus },
  { id: "rent", label: "Rent", icon: House },
  { id: "credit-card", label: "Credit card", icon: CreditCard },
  { id: "gas", label: "Gas", icon: Flame },
  { id: "water", label: "Water", icon: Droplet },
  { id: "cable", label: "Cable & TV", icon: Tv },
  { id: "tuition", label: "Tuition", icon: GraduationCap },
  { id: "foreign-currency", label: "Foreign currency", icon: BadgeDollarSign },
];
