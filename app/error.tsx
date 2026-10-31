"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="wrap">
      <p className="kicker">中断</p>
      <h1>这一页没有打开。</h1>
      <p className="lede">行情或持仓源暂时没有回应。可以再试一次。</p>
      <p>
        <button className="text-button" type="button" onClick={() => reset()}>
          再试一次
        </button>
      </p>
    </main>
  );
}
