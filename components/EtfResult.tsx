"use client";

import { direction, formatNumber, formatPercent, formatShares, formatSignedNumber, formatSignedPercent, formatWhen } from "@/lib/format";
import type { EtfReport, HoldingView } from "@/lib/types";
import { useMemo, useState } from "react";

type SortKey = "weight" | "ticker" | "sector";

export function EtfResult({ report }: { report: EtfReport }) {
  const [sector, setSector] = useState("all");
  const [equityOnly, setEquityOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("weight");
  const tone = direction(report.changePercent);
  const showShares = report.holdings.some((holding) => holding.shares != null);
  const showIndustry = report.holdings.some((holding) => holding.industryLabel);
  const maxWeight = Math.max(...report.holdings.map((holding) => holding.weight ?? 0), 1);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = report.holdings.filter((holding) => {
      if (sector !== "all" && (holding.sector ?? "未分类") !== sector) return false;
      if (equityOnly && !holding.equity) return false;
      if (!needle) return true;
      return (
        holding.ticker.toLowerCase().includes(needle) ||
        holding.name.toLowerCase().includes(needle) ||
        (holding.sectorLabel ?? "").includes(query.trim()) ||
        (holding.industryLabel ?? "").includes(query.trim())
      );
    });
    const copy = [...filtered];
    copy.sort((a, b) => compare(a, b, sort));
    return copy;
  }, [equityOnly, query, report.holdings, sector, sort]);

  return (
    <section>
      <div className="identity">
        <div>
          <p className="kicker">{report.symbol}</p>
          <h1>
            {report.name}
            <span className={report.complete ? "pill" : "pill soft"}>{report.complete ? "完整持仓" : "前十大"}</span>
          </h1>
          <p className="meta">
            {report.family ? `${report.family} · ` : ""}
            {report.categoryLabel ?? report.category ?? "ETF"}
            {report.holdingsAsOf ? ` · 持仓截至 ${report.holdingsAsOf}` : ""}
            {report.asOfQuote ? ` · 行情 ${formatWhen(report.asOfQuote)}` : ""}
          </p>
        </div>
        <div className="price">
          <b>
            {formatNumber(report.price)} <small style={{ fontSize: 16 }}>{report.currency}</small>
          </b>
          <div className={tone}>
            {formatSignedNumber(report.change)} {formatSignedPercent(report.changePercent)}
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span>持仓条数</span>
          <strong>{report.holdingCount}</strong>
        </div>
        <div className="stat">
          <span>其中股票</span>
          <strong>{report.equityCount}</strong>
        </div>
        <div className="stat">
          <span>前十大合计</span>
          <strong>{formatPercent(report.top10Weight)}</strong>
        </div>
        <div className="stat">
          <span>费用率</span>
          <strong>{formatPercent(report.expenseRatio)}</strong>
        </div>
        <div className="stat">
          <span>行业来源</span>
          <strong>{report.sectorSource === "holdings" ? "逐家汇总" : "基金配置"}</strong>
        </div>
      </div>

      <h2>行业板块</h2>
      <div className="stack" aria-hidden>
        {report.sectors.map((slice) => (
          <span key={slice.sector} style={{ flex: Math.max(slice.weight, 0.2), background: slice.color }} />
        ))}
      </div>
      <div className="legend">
        <button type="button" onClick={() => setSector("all")} aria-pressed={sector === "all"}>
          全部
        </button>
        {report.sectors.map((slice) => (
          <button key={slice.sector} type="button" onClick={() => setSector(slice.sector)} aria-pressed={sector === slice.sector}>
            <i className="swatch" style={{ background: slice.color }} />
            {slice.label} {formatPercent(slice.weight)}
          </button>
        ))}
      </div>
      <p className="notice">{report.note}</p>

      <div className="filters">
        <button type="button" className="chip" aria-pressed={equityOnly} onClick={() => setEquityOnly((value) => !value)}>
          只看股票
        </button>
        <button type="button" className="chip" aria-pressed={sort === "weight"} onClick={() => setSort("weight")}>
          按权重
        </button>
        <button type="button" className="chip" aria-pressed={sort === "sector"} onClick={() => setSort("sector")}>
          按板块
        </button>
        <button type="button" className="chip" aria-pressed={sort === "ticker"} onClick={() => setSort("ticker")}>
          按代码
        </button>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="在持仓里找公司或代码"
          aria-label="筛选持仓"
        />
      </div>
      <p className="countline">当前显示 {rows.length} 家</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>公司</th>
              <th>代码</th>
              <th className="num">权重</th>
              <th>板块</th>
              {showIndustry ? <th>细分行业</th> : null}
              {showShares ? <th className="num">持股数量</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((holding, index) => (
              <tr key={`${holding.ticker}-${holding.name}-${index}`}>
                <td className="name-cell">
                  {holding.name}
                  {!holding.equity ? <small>非股票</small> : null}
                </td>
                <td className="ticker">{holding.ticker || "—"}</td>
                <td className="num weight">
                  <span className="bar" style={{ width: `${((holding.weight ?? 0) / maxWeight) * 100}%` }} />
                  <em>{formatPercent(holding.weight)}</em>
                </td>
                <td>{holding.sectorLabel ?? "未分类"}</td>
                {showIndustry ? <td>{holding.industryLabel ?? "—"}</td> : null}
                {showShares ? <td className="num">{formatShares(holding.shares)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="notice">这个筛选条件下没有公司。</p> : null}
    </section>
  );
}

function compare(a: HoldingView, b: HoldingView, sort: SortKey): number {
  if (sort === "ticker") return a.ticker.localeCompare(b.ticker);
  if (sort === "sector") {
    const sector = (a.sectorLabel ?? "").localeCompare(b.sectorLabel ?? "", "zh");
    if (sector !== 0) return sector;
  }
  return (b.weight ?? -1) - (a.weight ?? -1);
}
