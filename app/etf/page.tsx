import { EtfResult } from "@/components/EtfResult";
import { EtfSearch } from "@/components/EtfSearch";
import { getEtfReport } from "@/lib/etf";
import type { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ETF 学习" };

export default async function EtfPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>;
}) {
  const { symbol } = await searchParams;
  const clean = symbol?.trim().toUpperCase() ?? "";
  return (
    <main className="wrap">
      <p className="kicker">01 / ETF</p>
      <h1>拆开一只 ETF。</h1>
      <p className="lede">输入代码，看这只基金里每一家公司的权重和行业。发行方有完整清单的，会全部列出来。</p>
      <EtfSearch initial={clean} />
      {clean ? (
        <Suspense key={clean} fallback={<p className="notice">正在向发行方和行情源要持仓，大篮子会稍等一会儿。</p>}>
          <EtfBody symbol={clean} />
        </Suspense>
      ) : (
        <p className="notice">从上面选一只，或者自己输入。SPY、IVV、VOO 都能看到完整持仓；拿不到发行方清单的，会先给你前十大，并写明不是全部。</p>
      )}
    </main>
  );
}

async function EtfBody({ symbol }: { symbol: string }) {
  const report = await getEtfReport(symbol);
  if (!report.ok) return <p className="notice">{report.message}</p>;
  return <EtfResult report={report} />;
}
