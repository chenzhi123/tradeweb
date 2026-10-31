import { cached } from "@/lib/cache";
import { parseNumber } from "@/lib/parse";
import type { ChartPoint, Quote, Series, Suggestion } from "@/lib/types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

type YahooNumber = { raw?: number; fmt?: string };

type Session = { cookie: string; crumb: string };

let sessionTask: Promise<Session> | null = null;
let sessionAt = 0;

function cookieHeader(response: Response): string {
  const withList = response.headers as Headers & { getSetCookie?: () => string[] };
  const list = withList.getSetCookie?.() ?? [];
  if (list.length) return list.map((cookie) => cookie.split(";")[0]).join("; ");
  const single = response.headers.get("set-cookie");
  return single ? single.split(";")[0] : "";
}

async function yahooSession(force = false): Promise<Session> {
  if (!force && sessionTask && Date.now() - sessionAt < 20 * 60 * 1000) return sessionTask;
  sessionAt = Date.now();
  sessionTask = (async () => {
    const boot = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": UA },
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
    const cookie = cookieHeader(boot);
    const crumbResponse = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": UA, Cookie: cookie },
      signal: AbortSignal.timeout(10000),
    });
    const crumb = (await crumbResponse.text()).trim();
    if (!crumb || crumb.includes(" ")) throw new Error("雅虎行情凭证没有拿到");
    return { cookie, crumb };
  })().catch((error) => {
    sessionTask = null;
    sessionAt = 0;
    throw error;
  });
  return sessionTask;
}

async function yahooGet(url: string, auth = false): Promise<Response> {
  const headers: Record<string, string> = { "User-Agent": UA, Accept: "application/json,text/plain,*/*" };
  let target = url;
  if (auth) {
    const session = await yahooSession();
    headers.Cookie = session.cookie;
    const join = url.includes("?") ? "&" : "?";
    target = `${url}${join}crumb=${encodeURIComponent(session.crumb)}`;
  }
  const response = await fetch(target, { headers, signal: AbortSignal.timeout(12000) });
  if (auth && (response.status === 401 || response.status === 403)) {
    const session = await yahooSession(true);
    headers.Cookie = session.cookie;
    const fresh = url.includes("crumb=")
      ? url
      : `${url}${url.includes("?") ? "&" : "?"}crumb=${encodeURIComponent(session.crumb)}`;
    return fetch(fresh, { headers, signal: AbortSignal.timeout(12000) });
  }
  return response;
}

function percentField(field: YahooNumber | undefined): number | null {
  if (!field) return null;
  if (field.fmt?.includes("%")) return parseNumber(field.fmt);
  if (field.raw == null) return null;
  return Math.abs(field.raw) <= 1 ? field.raw * 100 : field.raw;
}

export type YahooFund = {
  symbol: string;
  name: string;
  quoteType: string | null;
  currency: string | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  asOfQuote: number | null;
  family: string | null;
  category: string | null;
  expenseRatio: number | null;
  sectorWeights: { key: string; weight: number }[];
  topHoldings: { symbol: string; name: string; weight: number }[];
};

export async function getYahooFund(symbol: string): Promise<YahooFund | null> {
  return cached(`yahoo-fund:${symbol}`, 10 * 60 * 1000, () => loadYahooFund(symbol), (fund) => fund != null);
}

async function loadYahooFund(symbol: string): Promise<YahooFund | null> {
  const url =
    "https://query2.finance.yahoo.com/v10/finance/quoteSummary/" +
    encodeURIComponent(symbol) +
    "?modules=price,topHoldings,fundProfile";
  const response = await yahooGet(url, true);
  if (!response.ok) return null;
  const body = (await response.json()) as {
    quoteSummary?: {
      result?: Array<{
        price?: {
          shortName?: string;
          longName?: string;
          quoteType?: string;
          currency?: string;
          regularMarketPrice?: YahooNumber;
          regularMarketChange?: YahooNumber;
          regularMarketChangePercent?: YahooNumber;
          regularMarketTime?: number;
        };
        fundProfile?: {
          family?: string;
          categoryName?: string;
          feesExpensesInvestment?: { annualReportExpenseRatio?: YahooNumber };
        };
        topHoldings?: {
          sectorWeightings?: Array<Record<string, YahooNumber>>;
          holdings?: Array<{ symbol?: string; holdingName?: string; holdingPercent?: YahooNumber }>;
        };
      }> | null;
    };
  };
  const result = body.quoteSummary?.result?.[0];
  if (!result?.price) return null;
  const price = result.price;
  const sectors =
    result.topHoldings?.sectorWeightings?.flatMap((entry) => {
      const [key, value] = Object.entries(entry)[0] ?? [];
      const weight = percentField(value);
      if (!key || weight == null) return [];
      return [{ key, weight }];
    }) ?? [];
  const topHoldings =
    result.topHoldings?.holdings?.flatMap((holding) => {
      const weight = percentField(holding.holdingPercent);
      if (!holding.holdingName || weight == null) return [];
      return [{ symbol: (holding.symbol ?? "").toUpperCase(), name: holding.holdingName, weight }];
    }) ?? [];

  return {
    symbol,
    name: price.longName || price.shortName || symbol,
    quoteType: price.quoteType ?? null,
    currency: price.currency ?? null,
    price: price.regularMarketPrice?.raw ?? null,
    change: price.regularMarketChange?.raw ?? null,
    changePercent: percentField(price.regularMarketChangePercent),
    asOfQuote: price.regularMarketTime ?? null,
    family: result.fundProfile?.family ?? null,
    category: result.fundProfile?.categoryName ?? null,
    expenseRatio: percentField(result.fundProfile?.feesExpensesInvestment?.annualReportExpenseRatio),
    sectorWeights: sectors,
    topHoldings,
  };
}

export async function searchEtfs(query: string): Promise<Suggestion[]> {
  const q = query.trim();
  if (!q) return [];
  return cached(`suggest:${q.toLowerCase()}`, 5 * 60 * 1000, async () => {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
    const response = await yahooGet(url);
    if (!response.ok) return [];
    const body = (await response.json()) as {
      quotes?: Array<{ symbol?: string; shortname?: string; longname?: string; quoteType?: string; exchDisp?: string }>;
    };
    return (body.quotes ?? [])
      .filter((quote) => quote.quoteType === "ETF" && quote.symbol)
      .slice(0, 6)
      .map((quote) => ({
        symbol: quote.symbol!.toUpperCase(),
        name: quote.longname || quote.shortname || quote.symbol!,
        exchange: quote.exchDisp || "",
      }));
  });
}

type ChartPayload = {
  chart?: {
    result?: Array<{
      meta?: {
        shortName?: string;
        longName?: string;
        currency?: string;
        regularMarketPrice?: number;
        regularMarketChangePercent?: number;
        chartPreviousClose?: number;
        regularMarketTime?: number;
        instrumentType?: string;
      };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }> | null;
  };
};

async function loadChart(symbol: string, range: string, interval: string): Promise<Series | null> {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(symbol) +
    `?range=${range}&interval=${interval}&includePrePost=false`;
  const response = await yahooGet(url);
  if (!response.ok) return null;
  const body = (await response.json()) as ChartPayload;
  const result = body.chart?.result?.[0];
  if (!result?.meta) return null;
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const points: ChartPoint[] = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const value = closes[i];
    if (value == null || !Number.isFinite(value)) continue;
    points.push({ t: timestamps[i], v: value });
  }
  const meta = result.meta;
  const price = meta.regularMarketPrice ?? points.at(-1)?.v ?? null;
  const dailyPercent = typeof meta.regularMarketChangePercent === "number" ? meta.regularMarketChangePercent : null;
  const change =
    price != null && dailyPercent != null ? price - price / (1 + dailyPercent / 100) : null;
  const anchor = meta.chartPreviousClose ?? points[0]?.v ?? null;
  const windowPercent = price != null && anchor ? ((price - anchor) / anchor) * 100 : null;
  return {
    symbol,
    name: result.meta.longName || result.meta.shortName || symbol,
    price,
    change,
    changePercent: dailyPercent,
    windowPercent,
    asOf: result.meta.regularMarketTime ?? null,
    currency: result.meta.currency ?? null,
    points,
  };
}

export function getSeries(symbol: string, range: string, interval: string): Promise<Series | null> {
  return cached(
    `chart:${symbol}:${range}:${interval}`,
    3 * 60 * 1000,
    () => loadChart(symbol, range, interval),
    (series) => series != null,
  );
}

export async function getQuote(symbol: string): Promise<Quote> {
  const series = await getSeries(symbol, "5d", "1d");
  return {
    symbol,
    name: series?.name ?? null,
    price: series?.price ?? null,
    change: series?.change ?? null,
    changePercent: series?.changePercent ?? null,
    currency: series?.currency ?? null,
  };
}

export async function mapPool<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}
