import { cached } from "@/lib/cache";
import { fetchIssuerHoldings } from "@/lib/holdings";
import { categoryLabel, canonicalSector, industryLabel, sectorColor, sectorLabel, YAHOO_SECTOR } from "@/lib/palette";
import type { RawHolding } from "@/lib/parse";
import { lookupSecurity } from "@/lib/sectors";
import type { EtfResponse, HoldingView, SectorSlice } from "@/lib/types";
import { getYahooFund } from "@/lib/yahoo";

const SYMBOL = /^[A-Za-z][A-Za-z0-9.-]{0,9}$/;

function enrich(row: RawHolding): HoldingView {
  const known = row.ticker ? lookupSecurity(row.ticker) : { sector: null, industry: null };
  const sector = canonicalSector(row.sector) ?? known.sector;
  const industry = known.industry;
  return {
    ticker: row.ticker,
    name: row.name,
    weight: row.weight,
    shares: row.shares,
    sector,
    sectorLabel: sectorLabel(sector),
    industry,
    industryLabel: industryLabel(industry),
    equity: row.equity && sector !== "Cash and/or Derivatives",
  };
}

function slicesFromHoldings(holdings: HoldingView[]): SectorSlice[] {
  const totals = new Map<string, number>();
  for (const holding of holdings) {
    if (holding.weight == null) continue;
    const key = holding.sector ?? "未分类";
    totals.set(key, (totals.get(key) ?? 0) + holding.weight);
  }
  return [...totals.entries()]
    .map(([sector, weight]) => ({
      sector,
      label: sector === "未分类" ? "未分类" : (sectorLabel(sector) ?? sector),
      weight,
      color: sector === "未分类" ? "#8a8478" : sectorColor(sector),
    }))
    .sort((a, b) => b.weight - a.weight);
}

function slicesFromFund(weights: { key: string; weight: number }[]): SectorSlice[] {
  return weights
    .flatMap((entry) => {
      const sector = YAHOO_SECTOR[entry.key] ?? canonicalSector(entry.key);
      if (!sector || entry.weight <= 0) return [];
      return [
        {
          sector,
          label: sectorLabel(sector) ?? sector,
          weight: entry.weight,
          color: sectorColor(sector),
        },
      ];
    })
    .sort((a, b) => b.weight - a.weight);
}

function top10Weight(holdings: HoldingView[]): number | null {
  const weights = holdings
    .map((holding) => holding.weight)
    .filter((weight): weight is number => weight != null)
    .sort((a, b) => b - a)
    .slice(0, 10);
  if (!weights.length) return null;
  return weights.reduce((sum, weight) => sum + weight, 0);
}

async function loadEtf(symbol: string): Promise<EtfResponse> {
  const fund = await getYahooFund(symbol);
  if (!fund) {
    return { ok: false, error: "not_found", symbol, message: `没有找到 ${symbol}。确认一下代码，比如 SPY、QQQ、IVV。` };
  }
  if (fund.quoteType && fund.quoteType !== "ETF") {
    return {
      ok: false,
      error: "not_etf",
      symbol,
      message: `${symbol} 是${fund.quoteType === "EQUITY" ? "个股" : "别的品种"}，不是 ETF。个股先去「个股研究」看各板块龙头。`,
    };
  }

  let rows: RawHolding[] = [];
  let source: "issuer" | "top10" = "top10";
  let sourceLabel = "公开行情前十大";
  let holdingsAsOf: string | null = null;
  let complete = false;

  try {
    const issuer = await fetchIssuerHoldings(symbol, fund.name, fund.family ?? "");
    if (issuer && issuer.holdings.length > fund.topHoldings.length) {
      rows = issuer.holdings;
      source = "issuer";
      sourceLabel = issuer.fundName || fund.name;
      holdingsAsOf = issuer.asOf;
      complete = true;
    }
  } catch {
    rows = [];
  }

  if (!rows.length) {
    rows = fund.topHoldings.map((holding) => ({
      name: holding.name,
      ticker: holding.symbol,
      weight: holding.weight,
      sector: null,
      shares: null,
      equity: true,
    }));
  }

  const holdings = rows
    .map(enrich)
    .sort((a, b) => (b.weight ?? -1) - (a.weight ?? -1));
  const classified = holdings.filter((holding) => holding.sector).reduce((sum, holding) => sum + (holding.weight ?? 0), 0);
  const totalWeight = holdings.reduce((sum, holding) => sum + (holding.weight ?? 0), 0);
  const useHoldings = complete && totalWeight > 0 && classified / totalWeight >= 0.7;
  const sectors = useHoldings ? slicesFromHoldings(holdings) : slicesFromFund(fund.sectorWeights);

  const note = complete
    ? `持仓来自「${sourceLabel}」公布的清单，一共 ${holdings.length} 条。每家公司的行业，优先用清单里的板块；清单没写的，用美股成分对照表补上。`
    : "这只 ETF 的发行方完整清单暂时取不到。下面是公开行情给出的前十大持仓，不是全部公司。上面的板块条来自整只基金的行业配置，仍然覆盖全部资产。";

  return {
    ok: true,
    symbol,
    name: fund.name,
    quoteType: fund.quoteType ?? "ETF",
    currency: fund.currency ?? "USD",
    price: fund.price,
    change: fund.change,
    changePercent: fund.changePercent,
    asOfQuote: fund.asOfQuote,
    category: fund.category,
    categoryLabel: categoryLabel(fund.category),
    family: fund.family,
    expenseRatio: fund.expenseRatio,
    holdingsAsOf,
    source,
    sourceLabel,
    complete,
    note,
    holdings,
    sectors,
    sectorSource: useHoldings ? "holdings" : "fund",
    holdingCount: holdings.length,
    equityCount: holdings.filter((holding) => holding.equity).length,
    top10Weight: top10Weight(holdings),
  };
}

export function getEtfReport(rawSymbol: string): Promise<EtfResponse> {
  const symbol = rawSymbol.trim().toUpperCase();
  if (!SYMBOL.test(symbol)) {
    return Promise.resolve({
      ok: false,
      error: "invalid",
      symbol: rawSymbol.trim().toUpperCase(),
      message: "代码只需要字母、数字和短横线，比如 SPY 或 BRK-B。",
    });
  }
  return cached(`etf:${symbol}`, 20 * 60 * 1000, () => loadEtf(symbol), (report) => report.ok);
}
