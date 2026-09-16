"use client";

import { useState } from "react";

type Bar = {
  label: string;
  value: number;
};

type Props = {
  data: Bar[];
  color?: string;
  valueFormat?: "number" | "compactCurrency";
  height?: number;
};

function formatByType(v: number, type: "number" | "compactCurrency") {
  if (type === "compactCurrency") {
    return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;
  }
  return String(v);
}

export default function BarChart({
  data,
  color = "var(--series-1)",
  valueFormat = "number",
  height = 220,
}: Props) {
  const formatValue = (v: number) => formatByType(v, valueFormat);
  const [hover, setHover] = useState<number | null>(null);

  const width = 640;
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 8;
  const padRight = 8;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const max = Math.max(...data.map((d) => d.value)) * 1.15;
  const slot = plotW / data.length;
  const barW = Math.min(40, slot * 0.5);

  const yFor = (v: number) => padTop + plotH - (v / max) * plotH;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: 5 }).map((_, i) => {
          const y = padTop + (i / 4) * plotH;
          return <line key={i} x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="var(--gridline)" strokeWidth={1} />;
        })}

        {data.map((d, i) => {
          const cx = padLeft + slot * i + slot / 2;
          const barY = yFor(d.value);
          const barH = padTop + plotH - barY;
          return (
            <g key={d.label}>
              <rect
                x={cx - slot / 2}
                y={padTop}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              <rect
                x={cx - barW / 2}
                y={barY}
                width={barW}
                height={Math.max(barH, 1)}
                rx={4}
                fill={hover === i ? color : color}
                opacity={hover === null || hover === i ? 1 : 0.55}
              />
              <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div className="mt-2 inline-flex flex-col gap-1 card px-3 py-2 text-xs">
          <div className="font-medium text-primary">{data[hover].label}</div>
          <div className="text-secondary tabular">{formatValue(data[hover].value)}</div>
        </div>
      )}
    </div>
  );
}
