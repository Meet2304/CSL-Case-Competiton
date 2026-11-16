/**
 * MOCK DATA for the Add an asset page (`routes.addAsset`). Every institution,
 * account, ticker price and estimate is invented, and nothing a customer adds
 * is saved: each flow is a demo that ends on a confirmation.
 *
 * Three classifications: accounts already inside PNC, accounts at other
 * institutions, and assets the customer enters themselves.
 */

/** How a kind of asset is added; each kind has its own short demo flow. */
export type AddFlow = "pnc" | "connect" | "ticker" | "estimate" | "manual" | "import" | "portfolio";

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

export type AddGroup = { id: string; label: string; intro: string; options: AddOption[] };

export const addAssetGroups: AddGroup[] = [
  {
    id: "pnc",
    label: "PNC accounts",
    intro: "Accounts you hold with PNC, found for you",
    options: [
      {
        id: "pnc-deposit",
        label: "Checking, savings and CDs",
        description: "PNC deposit accounts in your name, added in one step.",
        flow: "pnc",
        keywords: "pnc checking savings money market cd certificate deposit",
      },
      {
        id: "pnc-investments",
        label: "PNC investments",
        description: "Brokerage and managed portfolios with PNC Investments.",
        flow: "pnc",
        keywords: "pnc brokerage managed portfolio investments",
      },
      {
        id: "pnc-retirement",
        label: "PNC retirement",
        description: "IRAs and rollovers held at PNC.",
        flow: "pnc",
        keywords: "pnc ira roth rollover retirement",
      },
      {
        id: "pnc-trust",
        label: "Trust and custody",
        description: "Trust, custody and estate accounts at PNC Private Bank.",
        flow: "pnc",
        keywords: "pnc private bank trust custody estate fiduciary",
      },
    ],
  },
  {
    id: "external",
    label: "External accounts",
    intro: "Accounts at other banks and institutions",
    options: [
      {
        id: "banks",
        label: "Banks and brokerages",
        description: "Link a checking, savings or brokerage account elsewhere.",
        flow: "connect",
        keywords: "checking savings brokerage investment other bank external",
      },
      {
        id: "joint-external",
        label: "Joint account elsewhere",
        description: "An account you share with someone at another bank.",
        flow: "connect",
        keywords: "joint shared spouse partner other bank external",
      },
      {
        id: "workplace",
        label: "Retirement plan at work",
        description: "A 401(k), 403(b) or pension with your employer's provider.",
        flow: "connect",
        keywords: "401k 403b pension employer workplace plan",
      },
      {
        id: "crypto-wallets",
        label: "Crypto wallets and exchanges",
        description: "Connect a wallet address or an exchange account.",
        flow: "connect",
        keywords: "bitcoin ethereum coinbase wallet exchange",
      },
      {
        id: "insurance",
        label: "Insurance and annuities",
        description: "Life policies and annuities held with an insurer.",
        flow: "connect",
        keywords: "life insurance policy annuity insurer",
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
    id: "manual",
    label: "Added by you",
    intro: "Property, valuables and anything else you enter yourself",
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
        id: "jewelry",
        label: "Jewelry and watches",
        description: "Rings, necklaces and watches, valued from a description.",
        flow: "estimate",
        keywords: "jewelry jewellery ring necklace watch diamond",
        ask: {
          title: "What is it?",
          fields: [
            {
              id: "description",
              label: "Describe it",
              placeholder: "e.g. A gold watch, a diamond ring",
            },
          ],
        },
      },
      {
        id: "art",
        label: "Art and collectibles",
        description: "Paintings, prints, wine and other collections.",
        flow: "estimate",
        keywords: "art painting print collectible collection wine",
        ask: {
          title: "What is it?",
          fields: [
            {
              id: "description",
              label: "Describe it",
              placeholder: "e.g. A signed print, a wine collection",
            },
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
        keywords: "ai appraiser estimate other",
        ask: {
          title: "Describe it",
          fields: [
            {
              id: "description",
              label: "What it is",
              placeholder: "e.g. A rare instrument, a domain name",
            },
          ],
        },
      },
      {
        id: "stocks",
        label: "Stocks and funds",
        description: "Track holdings by ticker. Prices update every day.",
        flow: "ticker",
        keywords: "shares etf mutual fund equity ticker",
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
        label: "Crypto by ticker",
        description: "Track coins by ticker, like BTC or ETH.",
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
      {
        id: "qty-price",
        label: "Quantity and price",
        description: "Private shares or stakes: units you own and a price you update.",
        flow: "manual",
        keywords: "units private shares angel vc venture",
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
        description: "Anything else: enter a value and update it when it changes.",
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
      {
        id: "portfolio",
        label: "Trusts and LLCs",
        description: "Group assets held by a trust, LLC or partnership.",
        flow: "portfolio",
        keywords: "trust llc partnership entity nested portfolio",
        ask: {
          title: "Who holds the assets?",
          fields: [{ id: "name", label: "Name", placeholder: "e.g. Sample Family Trust" }],
        },
      },
    ],
  },
];

/** PNC accounts in the customer's name that aren't on Assets and Debts yet. */
export const samplePncAccounts: Record<string, { name: string; last4: string; balance: number }[]> =
  {
    "pnc-deposit": [
      { name: "Premiere Money Market", last4: "0061", balance: 152_400 },
      { name: "12-Month CD", last4: "0062", balance: 100_000 },
    ],
    "pnc-investments": [{ name: "Managed Portfolio", last4: "0063", balance: 418_750 }],
    "pnc-retirement": [{ name: "Traditional IRA", last4: "0064", balance: 96_300 }],
    "pnc-trust": [{ name: "Family Trust Custody", last4: "0065", balance: 612_000 }],
  };

/** Institutions the connect flow can find. */
export const sampleInstitutions = [
  "Sample National Bank",
  "Demo Brokerage",
  "Example Credit Union",
  "Placeholder Crypto Exchange",
  "Mock Retirement Services",
  "Sample Life Insurance Co.",
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
  "real-estate": { value: 1_412_000, low: 1_339_000, high: 1_486_000 },
  vehicles: { value: 68_800, low: 63_500, high: 72_900 },
  jewelry: { value: 18_400, low: 14_900, high: 22_600 },
  art: { value: 42_000, low: 31_000, high: 55_000 },
  metals: { value: 24_600, low: 24_100, high: 25_100 },
  appraise: { value: 3_200, low: 2_400, high: 4_100 },
};

/** What the import flow finds in a file. */
export const sampleImport = [
  { name: "Private fund", value: 250_000 },
  { name: "Angel investment", value: 75_000 },
  { name: "Art collection", value: 46_500 },
];
