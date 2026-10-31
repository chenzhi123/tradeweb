"use client";

import type { Suggestion } from "@/lib/types";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const EXAMPLES = ["SPY", "QQQ", "IVV", "VOO", "VTI", "IWM", "XLK", "SOXX"];

export function EtfSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [items, setItems] = useState<Suggestion[]>([]);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 1) {
      setItems([]);
      return;
    }
    const timer = window.setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(query)}`)
        .then((response) => (response.ok ? response.json() : []))
        .then((data: Suggestion[]) => setItems(Array.isArray(data) ? data : []))
        .catch(() => setItems([]));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [value]);

  function go(symbol: string) {
    const next = symbol.trim().toUpperCase();
    if (!next) return;
    setItems([]);
    router.push(`/etf?symbol=${encodeURIComponent(next)}`);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    go(value);
  }

  return (
    <form className="search-form" onSubmit={onSubmit} role="search">
      <div className="search-row">
        <input
          name="symbol"
          aria-label="ETF 代码"
          placeholder="输入 ETF 代码，例如 SPY"
          value={value}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => setValue(event.target.value.toUpperCase())}
        />
        <button type="submit">拆开</button>
      </div>
      {items.length > 0 && value.trim() && value.trim().toUpperCase() !== initial ? (
        <div className="suggest" role="listbox">
          {items.map((item) => (
            <a key={item.symbol} href={`/etf?symbol=${encodeURIComponent(item.symbol)}`} onClick={() => setItems([])}>
              <span>
                <b className="ticker">{item.symbol}</b> {item.name}
              </span>
              <small>{item.exchange}</small>
            </a>
          ))}
        </div>
      ) : null}
      <div className="chips" aria-label="常用 ETF">
        {EXAMPLES.map((symbol) => (
          <a key={symbol} className="chip" href={`/etf?symbol=${symbol}`} aria-pressed={initial === symbol}>
            {symbol}
          </a>
        ))}
      </div>
    </form>
  );
}
