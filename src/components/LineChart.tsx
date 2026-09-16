"use client";

import { useState } from "react";

type Series = {
  name: string;
  color: string;
  values: number[];
};

type Props = {
  labels: string[];
  series: Series[];
  valueFormat?: "number" | "compactCurrency";
  height?: number;
};

function formatByType(v: number, type: "number" | "compactCurrency") {
  if (type === "compactCurrency") {
    return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;
  }
  return String(v);
}

export default function LineChart({ labels, series, valueFormat = "number", height = 220 }: Props) {
  const formatValue = (v: number) => formatByType(v, valueFormat);
  const [hover, setHover] = useState<number | null>(null);

  const width = 640;
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 8;
  const padRight = 8;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(...allValues) * 1.1;
  const min = 0;

  const xFor = (i: number) => padLeft + (i / (labels.length - 1)) * plotW;
  const yFor = (v: number) => padTop + plotH - ((v - min) / (max - min)) * plotH;

  const gridLines = 4;

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-2">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            {s.name}
          </div>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = padTop + (i / gridLines) * plotH;
          return (
            <line
              key={i}
              x1={padLeft}
              x2={width - padRight}
              y1={y}
              y2={y}
              stroke="var(--gridline)"
              strokeWidth={1}
            />
          );
        })}

        {labels.map((_, i) => (
          <rect
            key={i}
            x={xFor(i) - plotW / (labels.length - 1) / 2}
            y={padTop}
            width={plotW / (labels.length - 1)}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {series.map((s) => {
          const d = s.values
            .map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(v)}`)
            .join(" ");
          return (
            <path
              key={s.name}
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {hover !== null &&
          series.map((s) => (
            <circle
              key={s.name}
              cx={xFor(hover)}
              cy={yFor(s.values[hover])}
              r={4.5}
              fill={s.color}
              stroke="var(--surface-1)"
              strokeWidth={2}
            />
          ))}

        {hover !== null && (
          <line
            x1={xFor(hover)}
            x2={xFor(hover)}
            y1={padTop}
            y2={padTop + plotH}
            stroke="var(--baseline)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {labels.map((l, i) => (
          <text
            key={l}
            x={xFor(i)}
            y={height - 8}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text-muted)"
          >
            {l}
          </text>
        ))}
      </svg>

      {hover !== null && (
        <div className="mt-2 inline-flex flex-col gap-1 card px-3 py-2 text-xs">
          <div className="font-medium text-primary">{labels[hover]}</div>
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-secondary tabular">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.color }} />
              {s.name}: <span className="text-primary">{formatValue(s.values[hover])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
