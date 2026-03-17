"use client";

import { motion } from "framer-motion";

interface ScoreEntry {
  label: string;
  value: number;
}

interface RadarChartProps {
  scores: ScoreEntry[];
  size?: number;
  color?: string;
}

const AXIS_COLORS: Record<string, string> = {
  Mood:  "#8b5cf6",
  Theme: "#3b82f6",
  Style: "#10b981",
  Desc:  "#f59e0b",
};

const RINGS = [0.25, 0.5, 0.75, 1.0];
const FULL_RADIUS = 0.38;

export function RadarChart({ scores, size = 200, color = "#8b5cf6" }: RadarChartProps) {
  const cx = 0.5;
  const cy = 0.5;
  const n = scores.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const point = (i: number, r: number) => {
    const angle = startAngle + i * angleStep;
    return {
      x: cx + FULL_RADIUS * r * Math.cos(angle),
      y: cy + FULL_RADIUS * r * Math.sin(angle),
    };
  };

  const ringPath = (r: number) =>
    scores
      .map((_, i) => {
        const p = point(i, r);
        return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
      })
      .join(" ") + " Z";

  const dataPoints = scores.map((s, i) => point(i, Math.min(1, Math.max(0, s.value))));

  const dataPath = dataPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ") + " Z";

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg
        viewBox="0 0 1 1"
        width={size}
        height={size}
        className="overflow-visible"
        aria-label="Radar chart showing match scores"
      >
        {/* Ring grid */}
        {RINGS.map((r, ri) => (
          <path
            key={r}
            d={ringPath(r)}
            fill="none"
            stroke={ri === RINGS.length - 1 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}
            strokeWidth="0.003"
          />
        ))}

        {/* Axis lines */}
        {scores.map((_, i) => {
          const p = point(i, 1);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.002"
            />
          );
        })}

        {/* Data fill */}
        <motion.path
          d={dataPath}
          fill={color}
          fillOpacity={0.18}
          stroke="none"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ transformOrigin: `${cx * 100}% ${cy * 100}%` }}
        />

        {/* Data outline */}
        <motion.path
          d={dataPath}
          fill="none"
          stroke={color}
          strokeWidth="0.007"
          strokeLinejoin="round"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: 1, pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {/* Axis dots */}
        {scores.map((s, i) => {
          const p = dataPoints[i];
          const axisColor = AXIS_COLORS[s.label] ?? color;
          return (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="0.018"
              fill={axisColor}
              stroke="#0F0F0F"
              strokeWidth="0.006"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.07, type: "spring", stiffness: 200 }}
              style={{ transformOrigin: `${p.x * 100}% ${p.y * 100}%` }}
            />
          );
        })}

        {/* Labels */}
        {scores.map((s, i) => {
          const labelR = 1.18;
          const p = point(i, labelR);
          const angle = startAngle + i * angleStep;
          const cosA = Math.cos(angle);
          const isNearTop = Math.abs(angle + Math.PI / 2) < 0.15;
          const isNearBottom = Math.abs(angle - Math.PI / 2) < 0.15;
          let anchor: "middle" | "start" | "end" = "middle";
          if (!isNearTop && !isNearBottom) {
            anchor = cosA > 0.05 ? "start" : cosA < -0.05 ? "end" : "middle";
          }
          const pct = Math.round(Math.min(100, Math.max(0, s.value * 100)));
          const axisColor = AXIS_COLORS[s.label] ?? "#a1a1aa";

          return (
            <g key={i}>
              <text
                x={p.x}
                y={p.y - 0.026}
                textAnchor={anchor}
                dominantBaseline="auto"
                fill={axisColor}
                fontSize="0.052"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {s.label}
              </text>
              <text
                x={p.x}
                y={p.y + 0.006}
                textAnchor={anchor}
                dominantBaseline="hanging"
                fill="rgba(255,255,255,0.55)"
                fontSize="0.046"
                fontFamily="system-ui, sans-serif"
              >
                {pct}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
