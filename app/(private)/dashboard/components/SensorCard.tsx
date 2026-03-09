"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRealtimeData } from "./RealtimeProvider";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, X, Wifi, WifiOff } from "lucide-react";

interface Props {
  sensorId: string;
  type: string;
  label: string;
  unit: string;
  minExpected: number;
  maxExpected: number;
}

const TYPE_COLORS: Record<string, string> = {
  temperature:   "#d4622a",
  humidity:      "#2a7fd4",
  soil_humidity: "#2a9e4a",
  luminosity:    "#c4942a",
  ph:            "#7a2ad4",
  co2:           "#2ab5a0",
  wind:          "#c42a8a",
  rain:          "#2a5ad4",
};

const TYPE_LABELS: Record<string, string> = {
  temperature:   "Temperatura",
  humidity:      "Umidade do Ar",
  soil_humidity: "Umidade do Solo",
  luminosity:    "Luminosidade",
  ph:            "pH do Solo",
  co2:           "CO₂",
  wind:          "Vento",
  rain:          "Precipitação",
};

function Sparkline({ history, color, anomaly, height = 28 }: {
  history: any[]; color: string; anomaly: boolean; height?: number;
}) {
  if (history.length < 2) return null;
  const vals   = history.map(r => r.value);
  const minV   = Math.min(...vals);
  const maxV   = Math.max(...vals);
  const rangeV = maxV - minV || 1;
  const w = 100; const h = height;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - minV) / rangeV) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="100%" height={h} style={{ display: "block" }}>
      <motion.polyline
        points={points}
        fill="none"
        stroke={anomaly ? "#e05252" : color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.85"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.85 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function SensorCard({ sensorId, type, label, unit, minExpected, maxExpected }: Props) {
  const [expanded, setExpanded] = useState(false);
  const data     = useRealtimeData();
  const sensor   = data[sensorId];
  const latest   = sensor?.latest;
  const history  = sensor?.history ?? [];

  const value    = latest?.value ?? null;
  const anomaly  = latest?.is_anomaly ?? false;
  const isOnline = sensor?.isOnline ?? false;
  const todayMax = sensor?.todayMax ?? null;
  const todayMin = sensor?.todayMin ?? null;
  const average  = sensor?.average ?? null;

  const trend = history.length >= 2
    ? history[history.length - 1].value - history[history.length - 2].value
    : 0;

  const range = maxExpected - minExpected;
  const pct   = value !== null
    ? Math.max(0, Math.min(100, ((value - minExpected) / range) * 100))
    : 0;

  const color = TYPE_COLORS[type] ?? "#1a5c2e";
  const time  = latest
    ? new Date(latest.recorded_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--";

  return (
    <>
      {/* Card */}
      <motion.div
        onClick={() => setExpanded(true)}
        whileHover={{ y: -3, boxShadow: "0 8px 28px #0f1f1218" }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{
          backgroundColor: "#ffffff",
          border: `1px solid ${anomaly ? "#f5c6c6" : "#e8ede9"}`,
          borderRadius: 14,
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          position: "relative",
          overflow: "hidden",
          boxShadow: anomaly ? "0 2px 12px #e0525210" : "0 1px 4px #0f1f1208",
          cursor: "pointer",
        }}
      >
        {/* Accent border top */}
        <div style={{
          position: "absolute", top: 0, left: 20, right: 20,
          height: 2, backgroundColor: anomaly ? "#e05252" : color,
          borderRadius: "0 0 4px 4px", opacity: 0.5,
        }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 4 }}>
          <div>
            <div style={{ color: "#9ab4a2", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 2 }}>
              {TYPE_LABELS[type]}
            </div>
            <div style={{ color: "#b0c4b8", fontSize: 11 }}>{label}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {isOnline
                ? <Wifi style={{ width: 11, height: 11, color: "#1a5c2e" }} />
                : <WifiOff style={{ width: 11, height: 11, color: "#c8d8ce" }} />}
              <span style={{ fontSize: 10, color: isOnline ? "#1a5c2e" : "#c8d8ce", fontWeight: 500 }}>
                {isOnline ? "online" : "offline"}
              </span>
            </div>
            <AnimatePresence>
              {anomaly && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    backgroundColor: "#fdf3f3", border: "1px solid #f5c6c6",
                    borderRadius: 999, padding: "2px 7px",
                  }}
                >
                  <AlertTriangle style={{ width: 10, height: 10, color: "#e05252" }} />
                  <span style={{ color: "#e05252", fontSize: 10, fontWeight: 600 }}>Anomalia</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Valor */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <motion.span
            key={value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              fontSize: 34, fontWeight: 700, lineHeight: 1,
              color: anomaly ? "#e05252" : "#0f1f12",
              fontFamily: "var(--font-geist-mono)",
              letterSpacing: "-0.02em",
            }}
          >
            {value !== null ? value.toFixed(1) : "—"}
          </motion.span>
          <span style={{ color: "#9ab4a2", fontSize: 13, marginBottom: 3, fontFamily: "var(--font-geist-mono)" }}>{unit}</span>
          <motion.div
            style={{ marginBottom: 3, marginLeft: "auto" }}
            animate={{ y: trend > 0.05 ? -2 : trend < -0.05 ? 2 : 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {trend > 0.05
              ? <TrendingUp style={{ width: 15, height: 15, color }} />
              : trend < -0.05
              ? <TrendingDown style={{ width: 15, height: 15, color: "#e05252" }} />
              : <Minus style={{ width: 15, height: 15, color: "#c8d8ce" }} />}
          </motion.div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid #f0f4f1" }}>
          {[
            { label: "Média", value: average !== null ? average.toFixed(1) : "—" },
            { label: "Máx", value: todayMax !== null ? todayMax.toFixed(1) : "—" },
            { label: "Mín", value: todayMin !== null ? todayMin.toFixed(1) : "—" },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              flex: 1, textAlign: "center", padding: "6px 4px",
              borderRight: i < 2 ? "1px solid #f0f4f1" : "none",
              backgroundColor: "#fafcfa",
            }}>
              <div style={{ color: "#9ab4a2", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                {stat.label}
              </div>
              <div style={{ color: "#0f1f12", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}>
                {stat.value}<span style={{ color: "#c8d8ce", fontSize: 9 }}>{stat.value !== "—" ? unit : ""}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Barra */}
        <div>
          <div style={{ height: 3, backgroundColor: "#f0f4f1", borderRadius: 999, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                height: "100%",
                backgroundColor: anomaly ? "#e05252" : color,
                borderRadius: 999, opacity: 0.6,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ color: "#c8d8ce", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}>{minExpected}{unit}</span>
            <span style={{ color: "#c8d8ce", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}>{maxExpected}{unit}</span>
          </div>
        </div>

        {/* Sparkline */}
        <Sparkline history={history} color={color} anomaly={anomaly} height={28} />

        {/* Timestamp */}
        <div style={{ color: "#c8d8ce", fontSize: 10, borderTop: "1px solid #f0f4f1", paddingTop: 8, fontFamily: "var(--font-geist-mono)" }}>
          Última leitura: {time}
        </div>
      </motion.div>

      {/* Modal expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setExpanded(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              backgroundColor: "#0f1f1255",
              backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20, padding: 32,
                width: "100%", maxWidth: 560,
                boxShadow: "0 24px 80px #0f1f1224",
                border: "1px solid #e8ede9",
              }}
            >
              {/* Modal header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <div style={{ color: "#9ab4a2", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>
                    {TYPE_LABELS[type]}
                  </div>
                  <h2 style={{ color: "#0f1f12", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-syne)", marginBottom: 4 }}>
                    {label}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isOnline
                      ? <><Wifi style={{ width: 12, height: 12, color: "#1a5c2e" }} /><span style={{ color: "#1a5c2e", fontSize: 11 }}>Online · transmitindo</span></>
                      : <><WifiOff style={{ width: 12, height: 12, color: "#c8d8ce" }} /><span style={{ color: "#c8d8ce", fontSize: 11 }}>Offline</span></>}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "#f0f4f1" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setExpanded(false)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: "1px solid #e8ede9", backgroundColor: "#f7f8f7",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#9ab4a2",
                  }}
                >
                  <X style={{ width: 15, height: 15 }} />
                </motion.button>
              </div>

              {/* Valor grande */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 24,
                  padding: "20px 24px",
                  backgroundColor: anomaly ? "#fdf3f3" : "#fafcfa",
                  border: `1px solid ${anomaly ? "#f5c6c6" : "#f0f4f1"}`,
                  borderRadius: 14,
                }}
              >
                <span style={{
                  fontSize: 56, fontWeight: 700, lineHeight: 1,
                  color: anomaly ? "#e05252" : "#0f1f12",
                  fontFamily: "var(--font-geist-mono)",
                  letterSpacing: "-0.03em",
                }}>
                  {value !== null ? value.toFixed(2) : "—"}
                </span>
                <span style={{ color: "#9ab4a2", fontSize: 18, marginBottom: 6, fontFamily: "var(--font-geist-mono)" }}>{unit}</span>
                {anomaly && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
                      backgroundColor: "#fdf3f3", border: "1px solid #f5c6c6",
                      borderRadius: 999, padding: "4px 10px",
                    }}
                  >
                    <AlertTriangle style={{ width: 13, height: 13, color: "#e05252" }} />
                    <span style={{ color: "#e05252", fontSize: 12, fontWeight: 600 }}>Valor fora da faixa</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
                {[
                  { label: "Média do dia",     value: average  !== null ? `${average.toFixed(2)}${unit}`  : "—" },
                  { label: "Máxima do dia",    value: todayMax !== null ? `${todayMax.toFixed(2)}${unit}` : "—" },
                  { label: "Mínima do dia",    value: todayMin !== null ? `${todayMin.toFixed(2)}${unit}` : "—" },
                  { label: "Faixa esperada",   value: `${minExpected}–${maxExpected}${unit}` },
                  { label: "Leituras",         value: `${history.length}` },
                  { label: "Última leitura",   value: time },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.04 }}
                    style={{
                      backgroundColor: "#fafcfa",
                      border: "1px solid #f0f4f1",
                      borderRadius: 10, padding: "10px 12px",
                    }}
                  >
                    <div style={{ color: "#9ab4a2", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      {stat.label}
                    </div>
                    <div style={{ color: "#0f1f12", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}>
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Gráfico expandido */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <div style={{ color: "#9ab4a2", fontSize: 10, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Histórico de leituras
                </div>
                <div style={{
                  backgroundColor: "#fafcfa", border: "1px solid #f0f4f1",
                  borderRadius: 12, padding: "16px 12px 8px",
                }}>
                  <Sparkline history={history} color={color} anomaly={anomaly} height={80} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ color: "#c8d8ce", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}>
                      {history[0] ? new Date(history[0].recorded_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                    <span style={{ color: "#c8d8ce", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}>Agora</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}