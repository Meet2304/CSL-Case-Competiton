/**
 * MOCK DATA for the Add an asset page (`routes.addAsset`). Every institution,
 * ticker price and estimate is invented, and nothing a customer adds is
 * saved: each flow is a demo that ends on a confirmation.
 */

/** How a kind of asset is added; each kind has its own short demo flow. */
export type AddFlow = "connect" | "ticker" | "estimate" | "manual" | "import" | "portfolio";

export type AddOption = {
  id: string;
  label: string;
  description: string;
  flow: AddFlow;
  /** Extra words the search box matches. */
  keywords?: string;
  /** The question the flow's first screen asks, and its fields. */
  ask?: { title: string; fields: { id: string; label: string; placeholder?: string }[] };
};

export type AddGroup = { id: string; label: string; intro?: string; options: AddOption[] };

export const addAssetGroups: AddGroup[] = [
  {
    id: "connect",
    label: "Connect an account",
    options: [
      {
        id: "banks",
        label: "Banks and brokerages",
        description: "Link any online account. Balances update on their own.",
        flow: "connect",
        keywords: "checking savings brokerage 401k ira investment",
      },
      {
        id: "crypto-wallets",
        label: "Crypto wallets and exchanges",
        description: "Connect a wallet address or an exchange account.",
        flow: "connect",
        keywords: "bitcoin ethereum coinbase wallet exchange",
      },
      {
        id: "web-sync",
        label: "Sync from a website",
        description: "For a bank or exchange that can't connect directly.",
        flow: "connect",
        keywords: "web sync no connection",
      },
    ],
  },
  {
    id: "ticker",
    label: "Track by ticker",
    options: [
      {
        id: "stocks",
        label: "Stocks and funds",
        description: "Add holdings by ticker. Prices update every day.",
        flow: "ticker",
        keywords: "shares etf mutual fund equity",
        ask: {
          title: "Which holding?",
          fields: [
            { id: "ticker", label: "Ticker", placeholder: "e.g. SMPL" },
            { id: "quantity", label: "Shares", placeholder: "e.g. 25" },
          ],
        },
      },
      {
        id: "crypto-tickers",
        label: "Crypto",
        description: "Add coins by ticker, like BTC or ETH.",
        flow: "ticker",
        keywords: "bitcoin ethereum coin token",
        ask: {
          title: "Which coin?",
          fields: [
            { id: "ticker", label: "Ticker", placeholder: "e.g. BTC" },
            { id: "quantity", label: "Amount", placeholder: "e.g. 0.5" },
          ],
        },
      },
    ],
  },
  {
    id: "property",
    label: "Property and valuables",
    options: [
      {
        id: "real-estate",
        label: "Real estate",
        description: "A home, rental or land, valued from its address.",
        flow: "estimate",
        keywords: "house home property land rental",
        ask: {
          title: "Where is it?",
          fields: [{ id: "address", label: "Address", placeholder: "e.g. 100 Sample Street" }],
        },
      },
      {
        id: "vehicles",
        label: "Vehicles",
        description: "A car, boat or motorcycle, valued from its make and model.",
        flow: "estimate",
        keywords: "car boat motorcycle truck",
        ask: {
          title: "What is it?",
          fields: [
            { id: "model", label: "Make and model", placeholder: "e.g. Sample Sedan" },
            { id: "year", label: "Year", placeholder: "e.g. 2022" },
          ],
        },
      },
      {
        id: "metals",
        label: "Precious metals",
        description: "Gold, silver and other bullion, priced by weight.",
        flow: "estimate",
        keywords: "gold silver platinum bullion coins",
        ask: {
          title: "What do you hold?",
          fields: [
            { id: "metal", label: "Metal", placeholder: "e.g. Gold" },
            { id: "ounces", label: "Ounces", placeholder: "e.g. 10" },
          ],
        },
      },
      {
        id: "appraise",
        label: "Estimate with Findoe",
        description: "No market price? Findoe estimates its value and keeps it current.",
        flow: "estimate",
        keywords: "ai appraiser art jewelry collectible watch",
        ask: {
          title: "Describe it",
          fields: [
            {
              id: "description",
              label: "What it is",
              placeholder: "e.g. A signed print, a watch, a collection",
            },
          ],
        },
      },
    ],
  },
  {
    id: "manual",
    label: "Enter it yourself",
    intro: "For private investments, angel or venture stakes, and accounts that won't connect.",
    options: [
      {
        id: "qty-price",
        label: "Quantity and price",
        description: "Track the units you own and a price you update.",
        flow: "manual",
        keywords: "units private shares angel vc",
        ask: {
          title: "What are you tracking?",
          fields: [
            { id: "name", label: "Name", placeholder: "e.g. Sample Startup shares" },
            { id: "quantity", label: "Units", placeholder: "e.g. 1,000" },
            { id: "price", label: "Price per unit", placeholder: "e.g. 12.50" },
          ],
        },
      },
      {
        id: "value",
        label: "Asset value",
        description: "Enter a value and update it when it changes.",
        flow: "manual",
        keywords: "manual value private fund other",
        ask: {
          title: "What is it worth?",
          fields: [
            { id: "name", label: "Name", placeholder: "e.g. Private fund" },
            { id: "value", label: "Value", placeholder: "e.g. 25,000 or EUR 100" },
          ],
        },
      },
      {
        id: "import",
        label: "Import a file",
        description: "Add many assets at once from a spreadsheet.",
        flow: "import",
        keywords: "csv excel spreadsheet bulk upload",
      },
    ],
  },
  {
    id: "structures",
    label: "Ownership structures",
    options: [
      {
        id: "portfolio",
        label: "Link a portfolio",
        description: "Group assets held by a trust, LLC or partnership.",
        flow: "portfolio",
        keywords: "trust llc partnership entity nested",
        ask: {
          title: "Who holds the assets?",
          fields: [{ id: "name", label: "Name", placeholder: "e.g. Sample Family Trust" }],
        },
      },
    ],
  },
];

/** Institutions the connect flow can find. */
export const sampleInstitutions = [
  "Sample National Bank",
  "Demo Brokerage",
  "Example Credit Union",
  "Placeholder Crypto Exchange",
  "Mock Retirement Services",
];

/** What a connected institution turns up. */
export const sampleConnectedAccounts = [
  { name: "Everyday Checking", last4: "0051", balance: 8_420.15 },
  { name: "Brokerage Account", last4: "0052", balance: 42_310.6 },
];

/** Prices for the ticker flow; any other ticker uses `defaultPrice`. */
export const samplePrices: Record<string, number> = {
  SMPL: 182.4,
  DEMO: 54.1,
  BTC: 61_250,
  ETH: 3_140,
};
export const defaultPrice = 100;

/** Estimates by option id: a value and the range around it. */
export const sampleEstimates: Record<string, { value: number; low: number; high: number }> = {
  "real-estate": { value: 412_000, low: 389_000, high: 436_000 },
  vehicles: { value: 23_800, low: 21_500, high: 25_900 },
  metals: { value: 24_600, low: 24_100, high: 25_100 },
  appraise: { value: 3_200, low: 2_400, high: 4_100 },
};

/** What the import flow finds in a file. */
export const sampleImport = [
  { name: "Private fund", value: 25_000 },
  { name: "Angel investment", value: 10_000 },
  { name: "Art collection", value: 6_500 },
];
