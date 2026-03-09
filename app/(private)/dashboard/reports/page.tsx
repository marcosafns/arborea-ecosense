"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import {
  FileText, Radio, Calendar, TrendingUp, TrendingDown,
  Minus, AlertTriangle, CheckCircle2, Activity,
  ChevronDown, Download, RefreshCw, Thermometer,
  Droplets, Sun, Wind, FlaskConical, CloudRain, Cpu, Leaf,
} from "lucide-react";
import ExportButton from "../components/ExportButton";
import { useToast } from "../components/Toast";


// ─── Tipos ───────────────────────────────────────────────────────────────────

type Period = "7d" | "30d";

interface Station { id: string; name: string; }

interface SensorSummary {
  id: string;
  type: string;
  label: string;
  unit: string;
  avg: number;
  min: number;
  max: number;
  anomalies: number;
  readings: number;
  trend: "up" | "down" | "stable";   // compara 1ª metade vs 2ª metade do período
}

interface AlertSummary {
  id: string;
  type: string;
  message: string;
  created_at: string;
  resolved_at: string | null;
  sensorLabel: string;
}

interface ReportData {
  station: Station;
  period: Period;
  since: string;
  until: string;
  sensors: SensorSummary[];
  alerts: AlertSummary[];
  totalReadings: number;
  totalAnomalies: number;
  uptime: number; // % baseado em leituras esperadas vs recebidas
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, any> = {
  temperature:   Thermometer,
  humidity:      Droplets,
  soil_humidity: Droplets,
  luminosity:    Sun,
  ph:            FlaskConical,
  co2:           Leaf,
  wind:          Wind,
  rain:          CloudRain,
};

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

const PERIOD_LABELS: Record<Period, string> = {
  "7d":  "Últimos 7 dias",
  "30d": "Últimos 30 dias",
};

// ─── Utilitários ─────────────────────────────────────────────────────────────

function fmt(v: number, decimals = 1) {
  return isNaN(v) ? "—" : v.toFixed(decimals);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function calcTrend(readings: { value: number; recorded_at: string }[]): "up" | "down" | "stable" {
  if (readings.length < 4) return "stable";
  const half = Math.floor(readings.length / 2);
  const firstAvg  = readings.slice(0, half).reduce((s, r) => s + r.value, 0) / half;
  const secondAvg = readings.slice(half).reduce((s, r) => s + r.value, 0) / (readings.length - half);
  const diff = secondAvg - firstAvg;
  if (Math.abs(diff) < firstAvg * 0.03) return "stable";
  return diff > 0 ? "up" : "down";
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Shimmer({ w = "100%", h = 16, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg, #f0f4f1 25%, #e4ece6 50%, #f0f4f1 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.6s infinite",
    }} />
  );
}

function ReportSkeleton() {
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 16 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e8ede9" }}>
              <Shimmer h={12} w="60%" />
              <div style={{ marginTop: 12 }}><Shimmer h={28} w="40%" /></div>
              <div style={{ marginTop: 8 }}><Shimmer h={10} w="80%" /></div>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: 24, border: "1px solid #e8ede9" }}>
          <Shimmer h={14} w="30%" />
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[1,2,3,4,5,6,7,8].map(i => <div key={i}><Shimmer h={80} r={10} /></div>)}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Componentes ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: "#ffffff", borderRadius: 14,
        border: "1px solid #e8ede9", padding: "18px 20px",
        borderTop: `3px solid ${accent ?? "#1a5c2e"}`,
        boxShadow: "0 1px 4px #0f1f1206",
      }}
    >
      <div style={{ color: "#9ab4a2", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ color: "#0f1f12", fontSize: 26, fontWeight: 700, fontFamily: "var(--font-syne)", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ color: "#b0c4b8", fontSize: 11, marginTop: 6 }}>{sub}</div>}
    </motion.div>
  );
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up")     return <TrendingUp   style={{ width: 13, height: 13, color: "#e05252" }} />;
  if (trend === "down")   return <TrendingDown style={{ width: 13, height: 13, color: "#2a7fd4" }} />;
  return                         <Minus        style={{ width: 13, height: 13, color: "#9ab4a2" }} />;
}

function SensorCard({ s }: { s: SensorSummary }) {
  const Icon  = TYPE_ICONS[s.type] ?? Activity;
  const color = TYPE_COLORS[s.type] ?? "#1a5c2e";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        backgroundColor: "#ffffff", borderRadius: 12,
        border: "1px solid #e8ede9", padding: "16px 18px",
        boxShadow: "0 1px 4px #0f1f1206",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            backgroundColor: `${color}18`, border: `1px solid ${color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon style={{ width: 13, height: 13, color }} />
          </div>
          <div>
            <div style={{ color: "#0f1f12", fontSize: 12, fontWeight: 600 }}>{s.label}</div>
            <div style={{ color: "#b0c4b8", fontSize: 10 }}>{s.readings} leituras</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <TrendIcon trend={s.trend} />
          {s.anomalies > 0 && (
            <div style={{
              backgroundColor: "#fdf3f3", border: "1px solid #f5c6c6",
              borderRadius: 999, padding: "1px 7px",
              color: "#e05252", fontSize: 10, fontWeight: 600,
            }}>
              {s.anomalies} anomalia{s.anomalies !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Valores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Média", value: fmt(s.avg), accent: color },
          { label: "Mín",   value: fmt(s.min), accent: "#2a7fd4" },
          { label: "Máx",   value: fmt(s.max), accent: "#e05252" },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{
            backgroundColor: "#f8fbf8", borderRadius: 8, padding: "8px 10px",
            textAlign: "center",
          }}>
            <div style={{ color: accent, fontSize: 15, fontWeight: 700, fontFamily: "var(--font-geist-mono, monospace)" }}>
              {value}
            </div>
            <div style={{ color: "#b0c4b8", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>
              {label} {s.unit}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [stations,     setStations]     = useState<Station[]>([]);
  const [stationId,    setStationId]    = useState<string | null>(null);
  const [period,       setPeriod]       = useState<Period>("7d");
  const [report,       setReport]       = useState<ReportData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [generating,   setGenerating]   = useState(false);
  const [stationOpen,  setStationOpen]  = useState(false);
  const supabase = createClient();
  const { error } = useToast();

  // ── Carrega estações do usuário ──
  const loadStations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("stations")
      .select("id, name")
      .eq("client_id", user.id)
      .order("created_at");
    const list = data ?? [];
    setStations(list);
    if (list.length > 0) setStationId(list[0].id);
    setLoading(false);
  }, []);

  useEffect(() => { loadStations(); }, []);

  // ── Gera relatório ──
  const generate = useCallback(async (sid = stationId, p = period) => {
    if (!sid) return;
    setGenerating(true);

    const ms    = p === "7d" ? 7 * 86400000 : 30 * 86400000;
    const since = new Date(Date.now() - ms).toISOString();
    const until = new Date().toISOString();

    // Sensores da estação
    const { data: sensorsData, error: sErr } = await supabase
      .from("sensors")
      .select("id, type, label, unit")
      .eq("station_id", sid)
      .eq("is_active", true);

    if (sErr || !sensorsData?.length) {
      error("Erro ao carregar sensores", sErr?.message ?? "Nenhum sensor encontrado");
      setGenerating(false);
      return;
    }

    const sensorIds = sensorsData.map(s => s.id);

    // Leituras do período
    const { data: readingsData, error: rErr } = await supabase
      .from("readings")
      .select("sensor_id, value, recorded_at, is_anomaly")
      .in("sensor_id", sensorIds)
      .gte("recorded_at", since)
      .order("recorded_at");

    if (rErr) {
      error("Erro ao carregar leituras", rErr.message);
      setGenerating(false);
      return;
    }

    // Alertas do período
    const { data: alertsData } = await supabase
      .from("alerts")
      .select("id, type, message, created_at, resolved_at, sensors(id, label)")
      .in("sensor_id", sensorIds)
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    // Agrupa leituras por sensor
    const byId: Record<string, { value: number; recorded_at: string; is_anomaly: boolean }[]> = {};
    for (const r of readingsData ?? []) {
      if (!byId[r.sensor_id]) byId[r.sensor_id] = [];
      byId[r.sensor_id].push(r);
    }

    // Calcula resumo por sensor
    const sensors: SensorSummary[] = sensorsData.map(s => {
      const rows = byId[s.id] ?? [];
      const vals = rows.map(r => r.value);
      const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
      const min  = vals.length ? Math.min(...vals) : NaN;
      const max  = vals.length ? Math.max(...vals) : NaN;
      return {
        id:        s.id,
        type:      s.type,
        label:     s.label,
        unit:      s.unit,
        avg, min, max,
        anomalies: rows.filter(r => r.is_anomaly).length,
        readings:  rows.length,
        trend:     calcTrend(rows),
      };
    });

    const totalReadings  = sensors.reduce((s, r) => s + r.readings, 0);
    const totalAnomalies = sensors.reduce((s, r) => s + r.anomalies, 0);

    // Uptime: assumindo 1 leitura/min esperada
    const expectedReadings = (ms / 60000) * sensorsData.length;
    const uptime = Math.min(100, (totalReadings / expectedReadings) * 100);

    const alerts: AlertSummary[] = (alertsData ?? []).map((a: any) => ({
      id:          a.id,
      type:        a.type,
      message:     a.message,
      created_at:  a.created_at,
      resolved_at: a.resolved_at,
      sensorLabel: a.sensors?.label ?? "—",
    }));

    const station = stations.find(s => s.id === sid) ?? { id: sid, name: "Estação" };

    setReport({ station, period: p, since, until, sensors, alerts, totalReadings, totalAnomalies, uptime });
    setGenerating(false);
  }, [stationId, period, stations]);

  // Gera ao mudar estação ou período
  useEffect(() => {
    if (stationId) generate(stationId, period);
  }, [stationId, period]);

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return <ReportSkeleton />;

  if (!stations.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <FileText style={{ width: 24, height: 24, color: "#1a5c2e" }} />
          </div>
          <h3 style={{ color: "#0f1f12", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Nenhuma estação cadastrada</h3>
          <p style={{ color: "#9ab4a2", fontSize: 13 }}>Cadastre uma estação para gerar relatórios.</p>
        </div>
      </div>
    );
  }

  const currentStation = stations.find(s => s.id === stationId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}
      >
        <div>
          <h1 style={{ color: "#0f1f12", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-syne)", marginBottom: 4 }}>
            Relatórios
          </h1>
          <p style={{ color: "#7aaa8a", fontSize: 13 }}>
            Resumo automático por estação
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>

          {/* Seletor de estação */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setStationOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 14px", borderRadius: 10,
                border: "1px solid #e8ede9", backgroundColor: "#ffffff",
                color: "#0f1f12", fontSize: 13, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 1px 4px #0f1f1208",
              }}
            >
              <Radio style={{ width: 13, height: 13, color: "#1a5c2e" }} />
              {currentStation?.name ?? "Selecionar estação"}
              <ChevronDown style={{ width: 12, height: 12, color: "#9ab4a2" }} />
            </button>

            <AnimatePresence>
              {stationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
                    backgroundColor: "#ffffff", border: "1px solid #e8ede9",
                    borderRadius: 12, padding: 6, minWidth: 180,
                    boxShadow: "0 8px 24px #0f1f1214",
                  }}
                >
                  {stations.map(st => (
                    <button
                      key={st.id}
                      onClick={() => { setStationId(st.id); setStationOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        width: "100%", padding: "9px 12px", borderRadius: 8,
                        border: "none", cursor: "pointer", fontFamily: "inherit",
                        backgroundColor: st.id === stationId ? "#f0f7f2" : "transparent",
                        color: st.id === stationId ? "#1a5c2e" : "#0f1f12",
                        fontSize: 13, fontWeight: st.id === stationId ? 600 : 400,
                        textAlign: "left",
                      }}
                    >
                      <Radio style={{ width: 12, height: 12 }} />
                      {st.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Seletor de período */}
          <div style={{ display: "flex", gap: 4, backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 10, padding: 3 }}>
            {(["7d", "30d"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "none",
                  backgroundColor: period === p ? "#1a5c2e" : "transparent",
                  color: period === p ? "#ffffff" : "#9ab4a2",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
              >
                {p === "7d" ? "7 dias" : "30 dias"}
              </button>
            ))}
          </div>

          {/* Atualizar */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => generate()}
            disabled={generating}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10,
              border: "1px solid #e8ede9", backgroundColor: "#ffffff",
              color: "#6b8f78", fontSize: 13, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <motion.div animate={generating ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.8, repeat: generating ? Infinity : 0, ease: "linear" }}>
              <RefreshCw style={{ width: 13, height: 13 }} />
            </motion.div>
            Atualizar
          </motion.button>

          {/* Export */}
          {report && (
            <ExportButton
              stationId={stationId ?? undefined}
              stationName={currentStation?.name}
              sensorIds={report.sensors.map(s => s.id)}
            />
          )}
        </div>
      </motion.div>

      {/* ── Conteúdo ── */}
      <AnimatePresence mode="wait">
        {generating ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ReportSkeleton />
          </motion.div>
        ) : report ? (
          <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Período info */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar style={{ width: 13, height: 13, color: "#9ab4a2" }} />
              <span style={{ color: "#9ab4a2", fontSize: 12 }}>
                {fmtDate(report.since)} → {fmtDate(report.until)} · {PERIOD_LABELS[report.period]}
              </span>
            </div>

            {/* Cards de resumo */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <StatCard
                label="Total de Leituras"
                value={report.totalReadings.toLocaleString("pt-BR")}
                sub={`${report.sensors.length} sensor${report.sensors.length !== 1 ? "es" : ""} ativos`}
                accent="#1a5c2e"
              />
              <StatCard
                label="Anomalias"
                value={report.totalAnomalies}
                sub={report.totalAnomalies === 0 ? "Nenhuma detectada 🎉" : `${((report.totalAnomalies / report.totalReadings) * 100).toFixed(1)}% das leituras`}
                accent={report.totalAnomalies > 0 ? "#e05252" : "#1a5c2e"}
              />
              <StatCard
                label="Alertas"
                value={report.alerts.length}
                sub={`${report.alerts.filter(a => a.resolved_at).length} resolvidos`}
                accent={report.alerts.length > 0 ? "#c4942a" : "#1a5c2e"}
              />
              <StatCard
                label="Uptime estimado"
                value={`${report.uptime.toFixed(0)}%`}
                sub="Baseado em leituras recebidas"
                accent={report.uptime >= 90 ? "#1a5c2e" : report.uptime >= 70 ? "#c4942a" : "#e05252"}
              />
            </div>

            {/* Grid de sensores */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 16, padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <Cpu style={{ width: 15, height: 15, color: "#1a5c2e" }} />
                <h2 style={{ color: "#0f1f12", fontSize: 15, fontWeight: 700, fontFamily: "var(--font-syne)" }}>
                  Resumo por Sensor
                </h2>
                <span style={{ color: "#b0c4b8", fontSize: 12, marginLeft: "auto" }}>
                  média · mín · máx
                </span>
              </div>

              {report.sensors.length === 0 ? (
                <p style={{ color: "#9ab4a2", fontSize: 13, textAlign: "center", padding: "32px 0" }}>
                  Nenhum dado encontrado neste período.
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {report.sensors.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <SensorCard s={s} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Alertas do período */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 16, padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <AlertTriangle style={{ width: 15, height: 15, color: "#c4942a" }} />
                <h2 style={{ color: "#0f1f12", fontSize: 15, fontWeight: 700, fontFamily: "var(--font-syne)" }}>
                  Alertas no Período
                </h2>
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 600,
                  backgroundColor: report.alerts.length > 0 ? "#fdf8f0" : "#f0f7f2",
                  color: report.alerts.length > 0 ? "#c4942a" : "#1a5c2e",
                  border: `1px solid ${report.alerts.length > 0 ? "#f0ddb0" : "#c8e0cf"}`,
                  borderRadius: 999, padding: "2px 10px",
                }}>
                  {report.alerts.length} alerta{report.alerts.length !== 1 ? "s" : ""}
                </span>
              </div>

              {report.alerts.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0" }}>
                  <CheckCircle2 style={{ width: 18, height: 18, color: "#1a5c2e" }} />
                  <span style={{ color: "#7aaa8a", fontSize: 13 }}>Nenhum alerta registrado neste período.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {report.alerts.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px", borderRadius: 10,
                        backgroundColor: a.resolved_at ? "#fafcfa" : "#fdf8f0",
                        border: `1px solid ${a.resolved_at ? "#e8ede9" : "#f0ddb0"}`,
                        borderLeft: `3px solid ${a.resolved_at ? "#c8e0cf" : "#c4942a"}`,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={{ color: "#0f1f12", fontSize: 13, fontWeight: 500 }}>{a.message}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, borderRadius: 999, padding: "1px 8px",
                            backgroundColor: a.resolved_at ? "#f0f7f2" : "#fdf3f3",
                            color: a.resolved_at ? "#1a5c2e" : "#e05252",
                            border: `1px solid ${a.resolved_at ? "#c8e0cf" : "#f5c6c6"}`,
                          }}>
                            {a.resolved_at ? "Resolvido" : "Ativo"}
                          </span>
                        </div>
                        <div style={{ color: "#9ab4a2", fontSize: 11 }}>
                          {a.sensorLabel} · {fmtDate(a.created_at)}
                          {a.resolved_at && ` → ${fmtDate(a.resolved_at)}`}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Fecha dropdown ao clicar fora */}
      {stationOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setStationOpen(false)} />
      )}
    </div>
  );
}