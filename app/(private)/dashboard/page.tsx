"use client";

// app/(private)/dashboard/page.tsx

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "motion/react";
import RealtimeProvider from "./components/RealtimeProvider";
import SensorCard from "./components/SensorCard";
import ExportButton from "./components/ExportButton";
import DashboardSkeleton from "./components/DashboardSkeleton";
import EmptyState, { EMPTY_STATES } from "./components/EmptyState";
import { useToast } from "./components/Toast";
import { Radio, Cpu, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function DashboardPage() {
  const [stations,     setStations]     = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const supabase = createClient();
  const { error } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data, error: stErr } = await supabase
        .from("stations")
        .select("*, sensors(*)")
        .eq("client_id", user.id)
        .eq("status", "active");

      if (stErr) { error("Erro ao carregar estações", stErr.message); setLoading(false); return; }

      const { count, error: alErr } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .is("resolved_at", null);

      if (alErr) error("Erro ao carregar alertas", alErr.message);

      setStations(data ?? []);
      setActiveAlerts(count ?? 0);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const allSensors = stations.flatMap((s: any) => s.sensors ?? []);

  const METRICS = [
    {
      label:  "Estações ativas",
      value:  stations.length,
      sub:    "monitorando agora",
      color:  "#1a5c2e",
      bg:     "#f0f7f2",
      border: "#c8e0cf",
      Icon:   Radio,
    },
    {
      label:  "Sensores online",
      value:  allSensors.length,
      sub:    "em operação",
      color:  "#2a7fd4",
      bg:     "#f0f5fd",
      border: "#c8d8f5",
      Icon:   Cpu,
    },
    {
      label:  "Alertas ativos",
      value:  activeAlerts,
      sub:    activeAlerts > 0 ? "requer atenção" : "sem anomalias",
      color:  activeAlerts > 0 ? "#e05252" : "#1a5c2e",
      bg:     activeAlerts > 0 ? "#fdf3f3" : "#f0f7f2",
      border: activeAlerts > 0 ? "#f5c6c6" : "#c8e0cf",
      Icon:   activeAlerts > 0 ? AlertTriangle : CheckCircle,
    },
    {
      label:  "Última leitura",
      value:  "agora",
      sub:    "dados em tempo real",
      color:  "#c4942a",
      bg:     "#fdf8f0",
      border: "#f0ddb0",
      Icon:   Clock,
    },
  ];

  return (
    <RealtimeProvider sensorIds={allSensors.map((s: any) => s.id)}>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
        >
          <div>
            <h1 style={{ color: "#0f1f12", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-syne)", marginBottom: 4 }}>
              Visão Geral
            </h1>
            <p style={{ color: "#7aaa8a", fontSize: 13 }}>
              Monitoramento em tempo real · {allSensors.length} sensores ativos
            </p>
          </div>
          <ExportButton
            stationName="Todas as Estações"
            sensorIds={allSensors.map((s: any) => s.id)}
          />
        </motion.div>

        {/* Métricas — 2 colunas mobile, 4 colunas desktop */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}
          className="metrics-grid"
        >
          {METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              whileHover={{ y: -2, boxShadow: "0 6px 20px #0f1f1212" }}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e8ede9",
                borderRadius: 14, padding: "16px 18px",
                boxShadow: "0 1px 4px #0f1f1206",
                position: "relative", overflow: "hidden",
                transition: "box-shadow 0.2s",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: 3, backgroundColor: metric.color,
                opacity: 0.35, borderRadius: "14px 14px 0 0",
              }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 4 }}>
                <div>
                  <div style={{ color: "#9ab4a2", fontSize: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {metric.label}
                  </div>
                  <div style={{ color: "#0f1f12", fontSize: 26, fontWeight: 700, fontFamily: "var(--font-geist-mono)", lineHeight: 1, marginBottom: 4 }}>
                    {metric.value}
                  </div>
                  <div style={{ color: "#b0c4b8", fontSize: 11 }}>{metric.sub}</div>
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: metric.bg, border: `1px solid ${metric.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <metric.Icon style={{ width: 16, height: 16, color: metric.color }} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Estações ou estado vazio */}
        {stations.length === 0 ? (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 16 }}>
            <EmptyState {...EMPTY_STATES.dashboard} />
          </div>
        ) : (
          stations.map((station: any, si: number) => (
            <motion.div
              key={station.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: si * 0.1 }}
            >
              {/* Station header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#1a5c2e", boxShadow: "0 0 5px #1a5c2e66", flexShrink: 0 }}
                />
                <h2 style={{ color: "#0f1f12", fontSize: 14, fontWeight: 600 }}>{station.name}</h2>
                <span style={{ fontSize: 11, color: "#7aaa8a", backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf", borderRadius: 999, padding: "2px 8px" }}>
                  {station.sensors?.length} sensores
                </span>
              </div>

              {/* Cards grid — auto-fill mobile-friendly */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))",
                gap: 14,
              }}>
                {station.sensors?.map((sensor: any, i: number) => (
                  <motion.div
                    key={sensor.id}
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: si * 0.1 + i * 0.06 }}
                  >
                    <SensorCard
                      sensorId={sensor.id}
                      type={sensor.type}
                      label={sensor.label}
                      unit={sensor.unit}
                      minExpected={sensor.min_expected ?? 0}
                      maxExpected={sensor.max_expected ?? 100}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Métricas: 4 colunas em desktop */}
      <style>{`
        @media (min-width: 640px) {
          .metrics-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </RealtimeProvider>
  );
}