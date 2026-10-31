import { strFromU8, unzipSync } from "fflate";

export type RawHolding = {
  name: string;
  ticker: string;
  weight: number | null;
  sector: string | null;
  shares: number | null;
  equity: boolean;
};

export type ParsedFundFile = {
  fundName: string | null;
  fundTicker: string | null;
  asOf: string | null;
  holdings: RawHolding[];
};

const STOP = new Set([
  "etf",
  "trust",
  "fund",
  "inc",
  "the",
  "and",
  "of",
  "class",
  "series",
  "shares",
  "portfolio",
]);

export function parseNumber(value: string | undefined | null): number | null {
  if (value == null) return null;
  const cleaned = value.trim().replace(/,/g, "").replace(/%/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "—") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function normalizeWeights(holdings: RawHolding[]): void {
  const nums = holdings
    .map((row) => row.weight)
    .filter((n): n is number => n != null);
  if (!nums.length) return;
  const sum = nums.reduce((total, n) => total + n, 0);
  const max = Math.max(...nums);
  if (max <= 1 && sum <= 1.5) {
    for (const row of holdings) {
      if (row.weight != null) row.weight *= 100;
    }
  }
}

export function nameScore(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return (2 * overlap) / (left.size + right.size);
}

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 1 && !STOP.has(word)),
  );
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function headerIndex(cells: string[], names: string[]): number {
  const normalized = cells.map((cell) => cell.trim().toLowerCase());
  for (const name of names) {
    const index = normalized.indexOf(name.toLowerCase());
    if (index >= 0) return index;
  }
  return -1;
}

function looksLikeEquity(ticker: string, assetClass: string): boolean {
  const kind = assetClass.toLowerCase();
  if (kind.includes("equity") || kind === "stock") return true;
  if (
    kind.includes("cash") ||
    kind.includes("bond") ||
    kind.includes("future") ||
    kind.includes("money market") ||
    kind.includes("derivative")
  ) {
    return false;
  }
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker);
}

export function parseHoldingsTable(
  rows: string[][],
  hints?: { fundName?: string | null; fundTicker?: string | null; asOf?: string | null },
): ParsedFundFile {
  const headerAt = rows.findIndex((row) => {
    const names = row.map((cell) => cell.trim().toLowerCase());
    return names.includes("ticker") || names.includes("symbol");
  });
  if (headerAt < 0) {
    return {
      fundName: hints?.fundName ?? null,
      fundTicker: hints?.fundTicker ?? null,
      asOf: hints?.asOf ?? null,
      holdings: [],
    };
  }

  const header = rows[headerAt];
  const tickerCol = headerIndex(header, ["ticker", "symbol"]);
  const nameCol = headerIndex(header, ["name", "holding name", "issuer name"]);
  const weightCol = headerIndex(header, [
    "market weight",
    "weight (%)",
    "weight",
    "% weight",
    "allocation",
    "% of net assets",
  ]);
  const sectorCol = headerIndex(header, ["sector", "gics sector"]);
  const sharesCol = headerIndex(header, ["quantity", "shares held", "shares", "qty"]);
  const typeCol = headerIndex(header, ["asset class", "type"]);

  const holdings: RawHolding[] = [];
  for (const row of rows.slice(headerAt + 1)) {
    const name = (row[nameCol] ?? "").trim();
    const ticker = (row[tickerCol] ?? "").trim().toUpperCase();
    if (!name && !ticker) continue;
    if (name.toLowerCase().startsWith("fund name")) continue;
    const sectorRaw = sectorCol >= 0 ? row[sectorCol]?.trim() ?? "" : "";
    const sector = !sectorRaw || sectorRaw === "-" ? null : sectorRaw;
    const assetClass = typeCol >= 0 ? row[typeCol]?.trim() ?? "" : "";
    holdings.push({
      name: name || ticker,
      ticker,
      weight: weightCol >= 0 ? parseNumber(row[weightCol]) : null,
      sector,
      shares: sharesCol >= 0 ? parseNumber(row[sharesCol]) : null,
      equity: looksLikeEquity(ticker, assetClass || sector || ""),
    });
  }

  normalizeWeights(holdings);
  return {
    fundName: hints?.fundName ?? null,
    fundTicker: hints?.fundTicker ?? null,
    asOf: hints?.asOf ?? null,
    holdings: holdings.filter((row) => row.weight != null || row.ticker),
  };
}

export function parseIsharesCsv(text: string): ParsedFundFile {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  const first = rows.find((row) => row.some((cell) => cell.trim()))?.[0]?.trim() ?? null;
  let asOf: string | null = null;
  for (const row of rows.slice(0, 12)) {
    const label = row[0]?.toLowerCase() ?? "";
    if (label.includes("holding") && label.includes("as of")) {
      asOf = row[1]?.replace(/^"|"$/g, "").trim() || null;
    }
  }
  return parseHoldingsTable(rows, { fundName: first, asOf });
}

function decodeXml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function columnIndex(ref: string): number {
  const letters = ref.match(/[A-Z]+/)?.[0] ?? "A";
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}

export function parseXlsxRows(data: Uint8Array): string[][] {
  const files = unzipSync(data);
  const sheetName = Object.keys(files).find(
    (name) => name.startsWith("xl/worksheets/sheet") && name.endsWith(".xml"),
  );
  if (!sheetName) return [];

  const strings: string[] = [];
  const shared = files["xl/sharedStrings.xml"];
  if (shared) {
    const xml = strFromU8(shared);
    for (const block of xml.match(/<si\b[\s\S]*?<\/si>/g) ?? []) {
      const parts = [...block.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) =>
        decodeXml(match[1]),
      );
      strings.push(parts.join(""));
    }
  }

  const xml = strFromU8(files[sheetName]);
  const rows: string[][] = [];
  for (const rowXml of xml.match(/<row\b[\s\S]*?<\/row>/g) ?? []) {
    const cells = [...rowXml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)];
    if (!cells.length) {
      rows.push([]);
      continue;
    }
    const values: string[] = [];
    for (const cell of cells) {
      const attrs = cell[1] ?? "";
      const body = cell[2] ?? "";
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1] ?? "";
      const index = ref ? columnIndex(ref) : values.length;
      const type = attrs.match(/\bt="([^"]+)"/)?.[1];
      const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
      let text = "";
      if (type === "s") text = strings[Number(raw)] ?? "";
      else if (type === "inlineStr") {
        text = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1])).join("");
      } else text = decodeXml(raw);
      values[index] = text;
    }
    rows.push(values.map((value) => value ?? ""));
  }
  return rows;
}

export function parseSsgaXlsx(data: Uint8Array): ParsedFundFile {
  const rows = parseXlsxRows(data);
  let fundName: string | null = null;
  let fundTicker: string | null = null;
  let asOf: string | null = null;
  for (const row of rows.slice(0, 8)) {
    const label = (row[0] ?? "").trim().toLowerCase();
    const value = (row[1] ?? "").trim();
    if (label.startsWith("fund name")) fundName = value || null;
    if (label.startsWith("ticker")) fundTicker = value.replace(/\s+/g, "").toUpperCase() || null;
    if (label.startsWith("holding")) asOf = value.replace(/^as of\s*/i, "") || null;
  }
  return parseHoldingsTable(rows, { fundName, fundTicker, asOf });
}
