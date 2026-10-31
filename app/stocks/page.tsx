import { SECTOR_LEADERS, researchFramework } from "@/lib/leaders";
import { direction, formatNumber, formatSignedPercent } from "@/lib/format";
import type { Quote } from "@/lib/types";
import { getQuote, mapPool } from "@/lib/yahoo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "个股研究" };

export default async function StocksPage() {
  const tickers = SECTOR_LEADERS.flatMap((sector) => sector.leaders.map((leader) => leader.ticker));
  const quotes = await mapPool(tickers, 6, (ticker) => getQuote(ticker).catch(() => null));
  const byTicker = new Map<string, Quote>();
  quotes.forEach((quote, index) => {
    if (quote) byTicker.set(tickers[index], quote);
  });

  return (
    <main className="wrap">
      <p className="kicker">02 / 个股</p>
      <h1>十一个板块，各放两三家龙头。</h1>
      <p className="lede">
        按 GICS 的板块顺序排。每家只写它为什么先被放进来，不提前做研究结论。框架你给我之后，下面每一张卡片会按同一套问题展开。
      </p>

      <section className="framework">
        <h2>{researchFramework.title}</h2>
        <p className="lede">
          现在这一栏是空的。生意、财务、位置、估值、风险，这些题目等你的框架来定。名单先固定在这里，免得之后换框架时还要重找龙头。
        </p>
      </section>

      {SECTOR_LEADERS.map((sector) => (
        <section key={sector.id} className="sector-block" id={sector.id}>
          <div className="sector-head">
            <h2>
              <i style={{ background: sector.color }} /> {sector.label}
            </h2>
          </div>
          <p className="meta">{sector.summary}</p>
          <div className="cards">
            {sector.leaders.map((leader) => {
              const quote = byTicker.get(leader.ticker);
              const tone = direction(quote?.changePercent);
              return (
                <article key={leader.ticker} className="card">
                  <div className="ticker">
                    {leader.ticker} · {leader.industry}
                  </div>
                  <h3>
                    {leader.name}
                    <span className="meta"> {leader.nameEn}</span>
                  </h3>
                  <div className="quote-row">
                    <strong>{quote?.price != null ? `${formatNumber(quote.price)} ${quote.currency ?? ""}` : "行情暂缺"}</strong>
                    <span className={tone}>当日 {formatSignedPercent(quote?.changePercent)}</span>
                  </div>
                  <p className="why">{leader.why}</p>
                  <div className="slot">框架就位后，这里按你的结构写 {leader.name}。</div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
