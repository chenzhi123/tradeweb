import type { Series } from "@/lib/types";
import { getSeries, mapPool } from "@/lib/yahoo";

export const RANGES = [
  { id: "5d", label: "5 日", range: "5d", interval: "30m" },
  { id: "1mo", label: "1 个月", range: "1mo", interval: "1d" },
  { id: "3mo", label: "3 个月", range: "3mo", interval: "1d" },
  { id: "1y", label: "1 年", range: "1y", interval: "1d" },
  { id: "5y", label: "5 年", range: "5y", interval: "1wk" },
] as const;

export type RangeId = (typeof RANGES)[number]["id"];

export const INDICES = [
  {
    id: "spx",
    symbol: "^GSPC",
    label: "标普 500",
    english: "S&P 500",
    blurb: "美国大盘最常用的尺子。大约 500 家大型公司，按市值加权，涨的时候权重大的公司贡献更多。",
  },
  {
    id: "ixic",
    symbol: "^IXIC",
    label: "纳斯达克综合",
    english: "Nasdaq Composite",
    blurb: "纳斯达克交易所几乎所有股票的综合指数。科技公司多，所以波动通常比标普更大。",
  },
  {
    id: "dji",
    symbol: "^DJI",
    label: "道琼斯工业",
    english: "Dow Jones",
    blurb: "30 家蓝筹，按股价加权，不是按市值。一只高价股的 1 美元，和低价股的 1 美元权重一样。",
  },
  {
    id: "rut",
    symbol: "^RUT",
    label: "罗素 2000",
    english: "Russell 2000",
    blurb: "美国小型股的常用指数。它走得和大盘不一样时，往往说明风险偏好在变。",
  },
  {
    id: "vix",
    symbol: "^VIX",
    label: "VIX",
    english: "波动率指数",
    blurb: "标普 500 期权隐含出来的波动率，不是股价。数字升高，通常表示市场在为更大的起伏定价。",
  },
] as const;

export const SECTOR_FUNDS = [
  { symbol: "XLK", sector: "信息技术" },
  { symbol: "XLV", sector: "医疗保健" },
  { symbol: "XLF", sector: "金融" },
  { symbol: "XLY", sector: "可选消费" },
  { symbol: "XLC", sector: "通信服务" },
  { symbol: "XLI", sector: "工业" },
  { symbol: "XLP", sector: "日常消费" },
  { symbol: "XLE", sector: "能源" },
  { symbol: "XLU", sector: "公用事业" },
  { symbol: "XLRE", sector: "房地产" },
  { symbol: "XLB", sector: "原材料" },
] as const;

export function rangeById(id: string | undefined) {
  return RANGES.find((item) => item.id === id) ?? RANGES[3];
}

export async function loadBoard(rangeId: string | undefined): Promise<{
  range: (typeof RANGES)[number];
  indices: Series[];
  sectors: Series[];
}> {
  const range = rangeById(rangeId);
  const [indices, sectors] = await Promise.all([
    mapPool(INDICES.map((item) => item.symbol), 6, (symbol) => getSeries(symbol, range.range, range.interval)),
    mapPool(SECTOR_FUNDS.map((item) => item.symbol), 6, (symbol) => getSeries(symbol, range.range, range.interval)),
  ]);
  return {
    range,
    indices: indices.filter((series): series is Series => series != null),
    sectors: sectors.filter((series): series is Series => series != null),
  };
}
