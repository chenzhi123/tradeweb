export type HoldingView = {
  ticker: string;
  name: string;
  weight: number | null;
  shares: number | null;
  sector: string | null;
  sectorLabel: string | null;
  industry: string | null;
  industryLabel: string | null;
  equity: boolean;
};

export type SectorSlice = {
  sector: string;
  label: string;
  weight: number;
  color: string;
};

export type EtfReport = {
  ok: true;
  symbol: string;
  name: string;
  quoteType: string;
  currency: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  asOfQuote: number | null;
  category: string | null;
  categoryLabel: string | null;
  family: string | null;
  expenseRatio: number | null;
  holdingsAsOf: string | null;
  source: "issuer" | "top10";
  sourceLabel: string;
  complete: boolean;
  note: string;
  holdings: HoldingView[];
  sectors: SectorSlice[];
  sectorSource: "holdings" | "fund";
  holdingCount: number;
  equityCount: number;
  top10Weight: number | null;
};

export type EtfError = {
  ok: false;
  error: "invalid" | "not_found" | "not_etf" | "unavailable";
  symbol: string;
  message: string;
};

export type EtfResponse = EtfReport | EtfError;

export type Suggestion = {
  symbol: string;
  name: string;
  exchange: string;
};

export type ChartPoint = { t: number; v: number };

export type Series = {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  windowPercent: number | null;
  asOf: number | null;
  currency: string | null;
  points: ChartPoint[];
};

export type Quote = {
  symbol: string;
  name: string | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
};
