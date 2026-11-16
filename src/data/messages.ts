/**
 * MOCK DATA for the advisor's Messages: the conversations already under way
 * when the demo starts, and the simulated replies. Every name and message is
 * invented. New messages are kept in the browser (src/lib/messages.ts).
 */

export type Message = {
  id: string;
  from: "advisor" | "contact";
  text: string;
  /** ISO date-time. */
  at: string;
  /** Sent by the bank's systems on the advisor's behalf (e.g. a transfer notice). */
  notice?: boolean;
};

/** Conversations by contact id (a client's customer id, a person id or an advisor id). */
export const seedThreads: Record<string, Message[]> = {
  "c-sample": [
    {
      id: "s-j1",
      from: "contact",
      text: "Could we look at moving some of the cash in savings into the brokerage account before the year ends?",
      at: "2026-10-14T15:12:00",
    },
    {
      id: "s-j2",
      from: "advisor",
      text: "Happy to. I'll put together two or three options before our January review.",
      at: "2026-10-14T16:40:00",
    },
    {
      id: "s-j3",
      from: "contact",
      text: "Thanks. Maya and I also want to finally sort out the beneficiaries on that account.",
      at: "2026-10-20T09:05:00",
    },
    {
      id: "s-j4",
      from: "advisor",
      text: "Good idea. I'll send the transfer-on-death form this week.",
      at: "2026-10-20T10:22:00",
    },
  ],
};

/** What each kind of contact says back in the demo, a moment after a message. */
export const simulatedReplies = {
  client: ["Thanks, that works for me.", "Got it, thank you. I'll take a look tonight."],
  beneficiary: [
    "Thank you for reaching out. I'll read through it this week.",
    "Thank you. It helps to know what happens next.",
  ],
  advisor: ["Thanks for the heads-up. I'll contact my client today.", "Got it. I'll follow up."],
};
