import sectorRows from "@/data/us-sector-map.json";
import { canonicalSector } from "@/lib/palette";

type SectorRow = { ticker: string; sector: string; industry?: string };

const byTicker = new Map<string, { sector: string; industry: string | null }>();

for (const row of sectorRows as SectorRow[]) {
  const sector = canonicalSector(row.sector);
  if (!sector) continue;
  const entry = { sector, industry: row.industry ?? null };
  const ticker = row.ticker.toUpperCase();
  byTicker.set(ticker, entry);
  if (ticker.includes(".")) byTicker.set(ticker.replaceAll(".", "-"), entry);
}

export function lookupSecurity(ticker: string): { sector: string | null; industry: string | null } {
  const key = ticker.trim().toUpperCase();
  if (!key) return { sector: null, industry: null };
  const hit = byTicker.get(key) ?? byTicker.get(key.replaceAll(".", "-"));
  if (!hit) return { sector: null, industry: null };
  return hit;
}
