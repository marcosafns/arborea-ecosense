"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import RealtimeProvider from "../../components/RealtimeProvider";
import SensorCard from "../../components/SensorCard";
import ExportButton from "../../components/ExportButton";
import StationDetailSkeleton from "../../components/StationDetailSkeleton";
import { useToast } from "../../components/Toast";
import {
  ArrowLeft, Radio, Wifi, WifiOff, MapPin,
  Cpu, Calendar, Activity, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const StationMap = dynamic(() => import("../../components/StationMap"), { ssr: false });

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

export default function StationDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const supabase = createClient();
  const { error } = useToast();

  const [station,  setStation]  = useState<any>(null);
  const [stats,    setStats]    = useState({ totalReadings: 0, activeAlerts: 0 });
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: err } = await supabase
      .from("stations")
      .select("*, sensors(*)")
      .eq("id", id)
      .eq("client_id", user.id)
      .single();

    if (err || !data) {
      if (err) error("Erro ao carregar estação", err.message);
      setNotFound(true);
      setLoading(false);
      return;
    }
    setStation(data);

    const sensorIds = data.sensors?.map((s: any) => s.id) ?? [];

    const [{ count: totalReadings, error: rdErr }, { count: activeAlerts, error: alErr }] = await Promise.all([
      supabase
        .from("readings")
        .select("*", { count: "exact", head: true })
        .in("sensor_id", sensorIds),
      supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .in("sensor_id", sensorIds)
        .is("resolved_at", null),
    ]);

    if (rdErr) error("Erro ao carregar leituras", rdErr.message);
    if (alErr) error("Erro ao carregar alertas", alErr.message);

    setStats({
      totalReadings: totalReadings ?? 0,
      activeAlerts:  activeAlerts  ?? 0,
    });

    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, []);

  if (loading) return <StationDetailSkeleton />;

  if (notFound) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ textAlign: "center", padding: "80px 0" }}
    >
      <p style={{ color: "#b0c4b8", fontSize: 14, marginBottom: 16 }}>Estação não encontrada.</p>
      <Link href="/dashboard/stations" style={{ color: "#1a5c2e", fontSize: 13 }}>← Voltar</Link>
    </motion.div>
  );

  const sensorIds   = station.sensors?.map((s: any) => s.id) ?? [];
  const isOnline    = station.last_seen_at
    ? Date.now() - new Date(station.last_seen_at).getTime() < 2 * 60 * 1000
    : false;
  const hasLocation = station.latitude && station.longitude;

  return (
    <RealtimeProvider sensorIds={sensorIds}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/dashboard/stations"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                color: "#9ab4a2", fontSize: 13, textDecoration: "none",
                padding: "6px 10px", borderRadius: 8,
                border: "1px solid #e8ede9", backgroundColor: "#ffffff",
              }}
            >
              <ArrowLeft style={{ width: 13, height: 13 }} />
              Estações
            </Link>
          </motion.div>
          <span style={{ color: "#c8d8ce", fontSize: 13 }}>/</span>
          <span style={{ color: "#0f1f12", fontSize: 13, fontWeight: 500 }}>{station.name}</span>
        </motion.div>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e8ede9",
            borderRadius: 16, padding: "24px",
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: 20,
            flexWrap: "wrap",
          }}
        >
          {/* Esquerda */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                width: 52, height: 52, borderRadius: 14,
                backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Radio style={{ width: 22, height: 22, color: "#1a5c2e" }} />
            </motion.div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <h1 style={{ color: "#0f1f12", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-syne)" }}>
                  {station.name}
                </h1>
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  backgroundColor: isOnline ? "#f0f7f2" : "#fafcfa",
                  border: `1px solid ${isOnline ? "#c8e0cf" : "#e8ede9"}`,
                  borderRadius: 999, padding: "3px 10px",
                }}>
                  {isOnline
                    ? <Wifi    style={{ width: 11, height: 11, color: "#1a5c2e" }} />
                    : <WifiOff style={{ width: 11, height: 11, color: "#c8d8ce" }} />}
                  <span style={{ fontSize: 11, color: isOnline ? "#1a5c2e" : "#b0c4b8", fontWeight: 500 }}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                {stats.activeAlerts > 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      backgroundColor: "#fdf3f3", border: "1px solid #f5c6c6",
                      borderRadius: 999, padding: "3px 10px",
                    }}
                  >
                    <AlertTriangle style={{ width: 11, height: 11, color: "#e05252" }} />
                    <span style={{ fontSize: 11, color: "#e05252", fontWeight: 600 }}>
                      {stats.activeAlerts} alerta{stats.activeAlerts !== 1 ? "s" : ""}
                    </span>
                  </motion.div>
                )}
              </div>

              {station.description && (
                <p style={{ color: "#9ab4a2", fontSize: 13, marginBottom: 6 }}>{station.description}</p>
              )}
              {hasLocation && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#b0c4b8" }}>
                  <MapPin style={{ width: 12, height: 12 }} />
                  <span style={{ fontSize: 12, fontFamily: "var(--font-geist-mono)" }}>
                    {parseFloat(station.latitude).toFixed(5)}, {parseFloat(station.longitude).toFixed(5)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Direita — export + stats */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
            <ExportButton
              stationId={station.id}
              stationName={station.name}
              sensorIds={sensorIds}
            />
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { icon: Cpu,      label: "Sensores",  value: station.sensors?.length ?? 0 },
                { icon: Activity, label: "Leituras",  value: stats.totalReadings.toLocaleString() },
                { icon: Calendar, label: "Criada em", value: new Date(station.created_at).toLocaleDateString("pt-BR") },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  style={{
                    backgroundColor: "#fafcfa",
                    border: "1px solid #f0f4f1",
                    borderRadius: 12, padding: "10px 16px",
                    textAlign: "center", minWidth: 80,
                  }}
                >
                  <stat.icon style={{ width: 14, height: 14, color: "#9ab4a2", margin: "0 auto 5px" }} />
                  <div style={{ color: "#0f1f12", fontSize: 15, fontWeight: 700, fontFamily: "var(--font-geist-mono)" }}>
                    {stat.value}
                  </div>
                  <div style={{ color: "#b0c4b8", fontSize: 10 }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Mapa + Lista de sensores */}
        <div style={{ display: "grid", gridTemplateColumns: hasLocation ? "1fr 1fr" : "1fr", gap: 16 }}>
          {hasLocation && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                backgroundColor: "#ffffff", border: "1px solid #e8ede9",
                borderRadius: 16, overflow: "hidden", height: 300,
              }}
            >
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f4f1" }}>
                <span style={{ color: "#0f1f12", fontSize: 13, fontWeight: 600 }}>Localização</span>
              </div>
              <div style={{ height: "calc(100% - 48px)" }}>
                <StationMap
                  latitude={parseFloat(station.latitude)}
                  longitude={parseFloat(station.longitude)}
                  stationName={station.name}
                />
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              backgroundColor: "#ffffff", border: "1px solid #e8ede9",
              borderRadius: 16, padding: "18px",
              height: 300, overflowY: "auto",
            }}
          >
            <div style={{ color: "#0f1f12", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              Sensores instalados
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {station.sensors?.map((sensor: any, i: number) => (
                <motion.div
                  key={sensor.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    backgroundColor: "#fafcfa", border: "1px solid #f0f4f1",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      backgroundColor: TYPE_COLORS[sensor.type] ?? "#1a5c2e",
                    }} />
                    <div>
                      <div style={{ color: "#0f1f12", fontSize: 12, fontWeight: 500 }}>{sensor.label}</div>
                      <div style={{ color: "#b0c4b8", fontSize: 11 }}>{TYPE_LABELS[sensor.type] ?? sensor.type}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#9ab4a2", fontSize: 11, fontFamily: "var(--font-geist-mono)" }}>
                      {sensor.min_expected}–{sensor.max_expected}
                    </div>
                    <div style={{ color: "#c8d8ce", fontSize: 10 }}>{sensor.unit}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Cards em tempo real */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{ color: "#0f1f12", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            Leituras em tempo real
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}>
            {station.sensors?.map((sensor: any, i: number) => (
              <motion.div
                key={sensor.id}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.06 }}
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

      </div>
    </RealtimeProvider>
  );
}