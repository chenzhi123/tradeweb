import { LineChart } from "@/components/LineChart";
import { direction, formatNumber, formatSignedPercent, formatWhen } from "@/lib/format";
import { INDICES, RANGES, SECTOR_FUNDS, loadBoard } from "@/lib/market";
import type { Series } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "大盘研究" };

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; focus?: string }>;
}) {
  const params = await searchParams;
  const board = await loadBoard(params.range);
  const focus = INDICES.find((index) => index.id === params.focus) ?? INDICES[0];
  const featured = board.indices.find((series) => series.symbol === focus.symbol) ?? board.indices[0];
  const maxAbs = Math.max(...board.sectors.map((series) => Math.abs(series.windowPercent ?? 0)), 1);

  return (
    <main className="wrap">
      <p className="kicker">03 / 大盘</p>
      <h1>美股这段时间怎么走。</h1>
      <p className="lede">只看美股。指数告诉你大盘，板块 ETF 告诉你钱往哪一类公司去。点进板块代码，可以再拆那只 ETF 的持仓。</p>

      <div className="range-row" aria-label="时间区间">
        {RANGES.map((range) => (
          <Link
            key={range.id}
            className={range.id === board.range.id ? "choice active" : "choice"}
            href={href(range.id, focus.id)}
            aria-current={range.id === board.range.id ? "true" : undefined}
          >
            {range.label}
          </Link>
        ))}
      </div>

      <div className="index-row">
        {INDICES.map((index) => {
          const series = board.indices.find((item) => item.symbol === index.symbol);
          const tone = direction(series?.windowPercent);
          return (
            <Link key={index.id} className={index.id === focus.id ? "active" : ""} href={href(board.range.id, index.id)}>
              <small>{index.english}</small>
              <strong>{index.label}</strong>
              <div className={tone}>{formatSignedPercent(series?.windowPercent)}</div>
            </Link>
          );
        })}
      </div>

      {featured ? <Featured series={featured} title={focus.label} blurb={focus.blurb} rangeLabel={board.range.label} /> : <p className="notice">指数行情暂时没有取到。</p>}

      <h2>板块冷热</h2>
      <p className="blurb">下面是十一只板块 ETF 在同一段时间里的涨跌。它们大致对应标普 500 的十一个行业，不是指数本身。</p>
      <div className="sector-row">
        {[...board.sectors]
          .sort((a, b) => (b.windowPercent ?? -999) - (a.windowPercent ?? -999))
          .map((series) => {
            const meta = SECTOR_FUNDS.find((fund) => fund.symbol === series.symbol);
            const value = series.windowPercent ?? 0;
            const tone = direction(value);
            return (
              <Link key={series.symbol} href={`/etf?symbol=${series.symbol}`}>
                <div className="sector-line">
                  <strong>{meta?.sector ?? series.symbol}</strong>
                  <span className="ticker">{series.symbol}</span>
                  <div className="track" aria-hidden>
                    <span
                      style={{
                        width: `${Math.max(4, (Math.abs(value) / maxAbs) * 100)}%`,
                        background: tone === "down" ? "var(--down)" : "var(--up)",
                      }}
                    />
                  </div>
                  <b className={tone}>{formatSignedPercent(value)}</b>
                </div>
              </Link>
            );
          })}
      </div>
    </main>
  );
}

function Featured({
  series,
  title,
  blurb,
  rangeLabel,
}: {
  series: Series;
  title: string;
  blurb: string;
  rangeLabel: string;
}) {
  const tone = direction(series.windowPercent);
  return (
    <section className="chart-card">
      <div className="identity">
        <div>
          <h2>{title}</h2>
          <p className="blurb">{blurb}</p>
        </div>
        <div className="price">
          <b>{formatNumber(series.price)}</b>
          <div className={tone}>
            {rangeLabel} {formatSignedPercent(series.windowPercent)}
          </div>
          <div className="meta">当日 {formatSignedPercent(series.changePercent)} · {formatWhen(series.asOf)}</div>
        </div>
      </div>
      <LineChart
        points={series.points}
        change={series.windowPercent}
        label={`${title} ${rangeLabel}走势，区间涨跌 ${formatSignedPercent(series.windowPercent)}`}
      />
    </section>
  );
}

function href(range: string, focus: string) {
  return `/market?range=${range}&focus=${focus}`;
}
