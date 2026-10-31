import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "学习台" };

export default function HomePage() {
  return (
    <main className="wrap">
      <p className="kicker">TRADINGWEB</p>
      <h1>先看清篮子里有什么。</h1>
      <p className="lede">
        这里是 TradingWeb 的学习台。三件事分开做：把一只 ETF 拆成公司，把美股十一个板块的龙头摆出来，再看大盘这段时间怎么走。
      </p>
      <ol className="toc">
        <li>
          <Link href="/etf">
            <span className="num">01</span>
            <span>
              <strong>ETF 学习</strong>
              <em>输入代码。看每一家公司占多少权重、属于哪个行业板块，能拿到的清单会列全。</em>
            </span>
            <span className="go">进入</span>
          </Link>
        </li>
        <li>
          <Link href="/stocks">
            <span className="num">02</span>
            <span>
              <strong>个股研究</strong>
              <em>美股十一个板块，各放两三家龙头。研究框架你之后给我，再按同一套问题写开。</em>
            </span>
            <span className="go">进入</span>
          </Link>
        </li>
        <li>
          <Link href="/market">
            <span className="num">03</span>
            <span>
              <strong>大盘研究</strong>
              <em>只看美股。标普、纳指、道指、罗素和 VIX，再加上十一个板块 ETF 的区间涨跌。</em>
            </span>
            <span className="go">进入</span>
          </Link>
        </li>
      </ol>
    </main>
  );
}
