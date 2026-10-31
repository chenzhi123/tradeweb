import { nameScore, parseIsharesCsv, parseSsgaXlsx, type ParsedFundFile, type RawHolding } from "@/lib/parse";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function fetchBytes(url: string): Promise<{ ok: boolean; type: string; bytes: Uint8Array }> {
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  return {
    ok: response.ok,
    type: response.headers.get("content-type") ?? "",
    bytes: new Uint8Array(await response.arrayBuffer()),
  };
}

function textOf(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

async function fetchSsga(symbol: string): Promise<ParsedFundFile | null> {
  const url = `https://www.ssga.com/us/en/intermediary/etfs/library-content/products/fund-data/etfs/us/holdings-daily-us-en-${symbol.toLowerCase()}.xlsx`;
  const file = await fetchBytes(url);
  const isSheet = file.type.includes("spreadsheet") || file.bytes[0] === 0x50;
  if (!file.ok || !isSheet || file.bytes.length < 1000) return null;
  const parsed = parseSsgaXlsx(file.bytes);
  if (!parsed.fundTicker || parsed.fundTicker !== symbol.toUpperCase()) return null;
  if (parsed.holdings.length < 3) return null;
  return parsed;
}

type VanguardEntity = {
  longName?: string;
  shortName?: string;
  ticker?: string;
  sharesHeld?: string | number;
  percentWeight?: string | number;
};

async function fetchVanguardBook(
  symbol: string,
  kind: "stock" | "bond",
): Promise<{ holdings: RawHolding[]; asOf: string | null }> {
  const url = `https://investor.vanguard.com/vmf/api/${encodeURIComponent(symbol)}/portfolio-holding/${kind}.json?start=1&count=4000`;
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return { holdings: [], asOf: null };
  const body = (await response.json()) as {
    asOfDate?: string;
    fund?: { entity?: VanguardEntity[] };
  };
  const entities = body.fund?.entity ?? [];
  const holdings = entities.flatMap((entity) => {
    const weight = Number(String(entity.percentWeight ?? "").replace(/,/g, ""));
    const shares = Number(String(entity.sharesHeld ?? "").replace(/,/g, ""));
    const ticker = (entity.ticker ?? "").trim().toUpperCase();
    const name = (entity.longName || entity.shortName || ticker).trim();
    if (!name || !Number.isFinite(weight)) return [];
    return [
      {
        name,
        ticker,
        weight,
        sector: null,
        shares: Number.isFinite(shares) ? shares : null,
        equity: kind === "stock" && /^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker),
      },
    ];
  });
  const asOf = typeof body.asOfDate === "string" ? body.asOfDate.slice(0, 10) : null;
  return { holdings, asOf };
}

async function fetchVanguard(symbol: string, fundName: string): Promise<ParsedFundFile | null> {
  if (!/vanguard/i.test(fundName)) return null;
  const [stocks, bonds] = await Promise.all([
    fetchVanguardBook(symbol, "stock"),
    fetchVanguardBook(symbol, "bond"),
  ]);
  const holdings = [...stocks.holdings, ...bonds.holdings];
  if (holdings.length < 3) return null;
  return {
    fundName: null,
    fundTicker: symbol.toUpperCase(),
    asOf: stocks.asOf ?? bonds.asOf,
    holdings,
  };
}

async function fetchIshares(symbol: string, fundName: string): Promise<ParsedFundFile | null> {
  if (!/ishares|blackrock/i.test(fundName)) return null;
  const url = `https://www.ishares.com/us/autoComplete.search?type=autocomplete&term=${encodeURIComponent(symbol)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) return null;
  const items = (await response.json()) as Array<{ label?: string; id?: string; category?: string }>;
  let best: { id: string; score: number } | null = null;
  for (const item of items) {
    if (item.category !== "productAutocomplete" || !item.label || !item.id) continue;
    const id = item.id.match(/\/products\/(\d+)/)?.[1];
    if (!id) continue;
    const score = nameScore(item.label, fundName);
    if (!best || score > best.score) best = { id, score };
  }
  if (!best || best.score < 0.72) return null;
  const file = await fetchBytes(`https://www.ishares.com/us/products/${best.id}/holdings/latest-holdings.csv`);
  const text = textOf(file.bytes);
  if (!file.ok || !text.includes("Ticker,")) return null;
  const parsed = parseIsharesCsv(text);
  if (nameScore(parsed.fundName ?? "", fundName) < 0.72) return null;
  if (parsed.holdings.length < 3) return null;
  return parsed;
}

export async function fetchIssuerHoldings(
  symbol: string,
  fundName: string,
  family = "",
): Promise<ParsedFundFile | null> {
  const identity = `${fundName} ${family}`;
  const attempts = await Promise.allSettled([
    fetchSsga(symbol),
    fetchVanguard(symbol, identity),
    fetchIshares(symbol, identity),
  ]);
  const found = attempts.flatMap((attempt) =>
    attempt.status === "fulfilled" && attempt.value && attempt.value.holdings.length ? [attempt.value] : [],
  );
  if (!found.length) return null;
  found.sort((a, b) => b.holdings.length - a.holdings.length);
  return found[0];
}
