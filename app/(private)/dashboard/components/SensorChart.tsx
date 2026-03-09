"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

interface Reading {
  value: number;
  recorded_at: string;
}

interface Props {
  label: string;
  type: string;
  unit: string;
  color: string;
  readings: Reading[];
  minExpected: number;
  maxExpected: number;
}

type Range = "1h" | "6h" | "24h" | "7d";

const RANGES: { id: Range; label: string }[] = [
  { id: "1h",  label: "1h"  },
  { id: "6h",  label: "6h"  },
  { id: "24h", label: "24h" },
  { id: "7d",  label: "7d"  },
];

function filterByRange(readings: Reading[], range: Range): Reading[] {
  const now  = Date.now();
  const ms: Record<Range, number> = {
    "1h":  1  * 60 * 60 * 1000,
    "6h":  6  * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d":  7  * 24 * 60 * 60 * 1000,
  };
  return readings.filter(r => now - new Date(r.recorded_at).getTime() <= ms[range]);
}

function formatTime(dateStr: string, range: Range) {
  const d = new Date(dateStr);
  if (range === "7d") return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const CustomTooltip = ({ active, payload, label, unit, color }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: "#ffffff",
      border: "1px solid #e8ede9",
      borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 4px 16px #0f1f1214",
    }}>
      <div style={{ color: "#9ab4a2", fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: "var(--font-geist-mono)" }}>
        {payload[0].value?.toFixed(2)}<span style={{ fontSize: 12, color: "#b0c4b8" }}>{unit}</span>
      </div>
    </div>
  );
};

export default function SensorChart({ label, type, unit, color, readings, minExpected, maxExpected }: Props) {
  const [range, setRange] = useState<Range>("24h");

  const filtered = filterByRange(readings, range);
  const chartData = filtered.map(r => ({
    time:  formatTime(r.recorded_at, range),
    value: parseFloat(r.value.toFixed(2)),
    raw:   r.recorded_at,
  }));

  const values  = filtered.map(r => r.value);
  const avg     = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const max     = values.length ? Math.max(...values) : 0;
  const min     = values.length ? Math.min(...values) : 0;
  const last    = values[values.length - 1] ?? null;
  const anomalies = filtered.filter(r => r.value < minExpected || r.value > maxExpected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e8ede9",
        borderRadius: 16, padding: "22px 24px",
        boxShadow: "0 1px 4px #0f1f1208",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color }} />
            <span style={{ color: "#0f1f12", fontSize: 14, fontWeight: 600 }}>{label}</span>
          </div>
          <div style={{ color: "#9ab4a2", fontSize: 12 }}>
            {filtered.length} leituras no período
            {anomalies > 0 && (
              <span style={{ color: "#e05252", marginLeft: 8 }}>· {anomalies} anomalia{anomalies !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        {/* Range selector */}
        <div style={{
          display: "flex", gap: 2,
          backgroundColor: "#f0f4f1",
          borderRadius: 8, padding: 3,
        }}>
          {RANGES.map(r => (
            <motion.button
              key={r.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRange(r.id)}
              style={{
                padding: "5px 12px", borderRadius: 6,
                border: "none",
                backgroundColor: range === r.id ? "#ffffff" : "transparent",
                color: range === r.id ? "#0f1f12" : "#9ab4a2",
                fontSize: 11, fontWeight: range === r.id ? 600 : 400,
                cursor: "pointer",
                boxShadow: range === r.id ? "0 1px 3px #0f1f1210" : "none",
                transition: "all 0.15s",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              {r.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 0, marginBottom: 20,
        border: "1px solid #f0f4f1", borderRadius: 10, overflow: "hidden",
      }}>
        {[
          { label: "Atual",  value: last  !== null ? last.toFixed(2)  : "—" },
          { label: "Média",  value: avg   ? avg.toFixed(2)   : "—" },
          { label: "Máximo", value: max   ? max.toFixed(2)   : "—" },
          { label: "Mínimo", value: min   ? min.toFixed(2)   : "—" },
        ].map((stat, i) => (
          <div key={stat.label} style={{
            padding: "10px 14px",
            borderRight: i < 3 ? "1px solid #f0f4f1" : "none",
            backgroundColor: "#fafcfa",
          }}>
            <div style={{ color: "#9ab4a2", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
              {stat.label}
            </div>
            <div style={{ color: "#0f1f12", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-geist-mono)" }}>
              {stat.value}
              {stat.value !== "—" && <span style={{ color: "#c8d8ce", fontSize: 10 }}>{unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <AnimatePresence mode="wait">
        {chartData.length < 2 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              height: 160, display: "flex", alignItems: "center", justifyContent: "center",
              border: "1.5px dashed #e8ede9", borderRadius: 10,
              color: "#c8d8ce", fontSize: 13,
            }}
          >
            Sem dados suficientes para este período
          </motion.div>
        ) : (
          <motion.div
            key={range}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f1" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "#c8d8ce", fontFamily: "var(--font-geist-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#c8d8ce", fontFamily: "var(--font-geist-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}${unit}`}
                  width={50}
                />
                <Tooltip content={<CustomTooltip unit={unit} color={color} />} />
                <ReferenceLine y={minExpected} stroke={color} strokeDasharray="3 3" strokeOpacity={0.3} />
                <ReferenceLine y={maxExpected} stroke={color} strokeDasharray="3 3" strokeOpacity={0.3} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${type})`}
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 1.5, backgroundColor: color, opacity: 0.3, borderTop: "1px dashed" }} />
                <span style={{ color: "#c8d8ce", fontSize: 10 }}>Faixa esperada: {minExpected}–{maxExpected}{unit}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}