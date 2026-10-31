import { direction } from "@/lib/format";
import type { ChartPoint } from "@/lib/types";

export function LineChart({ points, change, label }: { points: ChartPoint[]; change: number | null; label: string }) {
  if (points.length < 2) return <p className="notice">这段区间没有足够的点。</p>;
  const width = 720;
  const height = 250;
  const padX = 8;
  const padY = 16;
  const values = points.map((point) => point.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = points.map((point, index) => {
    const x = padX + (index / (points.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (point.v - min) / span) * (height - padY * 2);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords.at(-1)?.[0].toFixed(1)},${height - padY} L${coords[0][0].toFixed(1)},${height - padY} Z`;
  const tone = direction(change);
  const stroke = tone === "down" ? "#1d6b45" : tone === "up" ? "#9c2f2f" : "#5e574c";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path d={area} fill={stroke} opacity="0.12" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
