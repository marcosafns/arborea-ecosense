"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import ChartsSkeleton from "../components/ChartsSkeleton";
import SensorChart from "../components/SensorChart";
import EmptyState, { EMPTY_STATES } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { Radio } from "lucide-react";

type Range = "1h" | "6h" | "24h" | "7d";

const RANGE_MS: Record<Range, number> = {
  "1h":  1  * 60 * 60 * 1000,
  "6h":  6  * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d":  7  * 24 * 60 * 60 * 1000,
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

interface SensorWithReadings {
  id: string;
  type: string;
  label: string;
  unit: string;
  min_expected: number;
  max_expected: number;
  readings: { value: number; recorded_at: string }[];
}

interface Station {
  id: string;
  name: string;
  sensors: SensorWithReadings[];
}

export default function ChartsPage() {
  const [stations,        setStations]        = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [range,           setRange]           = useState<Range>("24h");
  const [loading,         setLoading]         = useState(true);
  const supabase = createClient();
  const { error } = useToast();

  const load = useCallback(async (r: Range = range) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: stationsData, error: stErr } = await supabase
      .from("stations")
      .select("id, name, sensors(id, type, label, unit, min_expected, max_expected)")
      .eq("client_id", user.id)
      .eq("status", "active");

    if (stErr) {
      error("Erro ao carregar estações", stErr.message);
      setLoading(false);
      return;
    }

    if (!stationsData?.length) { setLoading(false); return; }

    const since = new Date(Date.now() - RANGE_MS[r]).toISOString();
    const allSensorIds = stationsData.flatMap(s => (s.sensors ?? []).map((sen: any) => sen.id));

    const { data: readingsData, error: rdErr } = await supabase
      .from("readings")
      .select("sensor_id, value, recorded_at")
      .in("sensor_id", allSensorIds)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true });

    if (rdErr) error("Erro ao carregar leituras", rdErr.message);

    // Agrupa leituras por sensor
    const byId: Record<string, { value: number; recorded_at: string }[]> = {};
    for (const r of readingsData ?? []) {
      if (!byId[r.sensor_id]) byId[r.sensor_id] = [];
      byId[r.sensor_id].push({ value: r.value, recorded_at: r.recorded_at });
    }

    const result: Station[] = stationsData.map(st => ({
      id:   st.id,
      name: st.name,
      sensors: (st.sensors ?? []).map((sen: any) => ({
        ...sen,
        readings: byId[sen.id] ?? [],
      })),
    }));

    setStations(result);
    if (!selectedStation) setSelectedStation(result[0]?.id ?? null);
    setLoading(false);
  }, [range, selectedStation]);

  useEffect(() => { load(); }, []);

  // Recarrega quando muda o range
  const handleRangeChange = (r: Range) => {
    setRange(r);
    setLoading(true);
    load(r);
  };

  if (loading) return <ChartsSkeleton />;

  const currentStation = stations.find(s => s.id === selectedStation);
  const hasReadings    = currentStation?.sensors.some(s => s.readings.length > 0);

  const RANGES: { label: string; value: Range }[] = [
    { label: "1h",  value: "1h"  },
    { label: "6h",  value: "6h"  },
    { label: "24h", value: "24h" },
    { label: "7d",  value: "7d"  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}
      >
        <div>
          <h1 style={{
            color: "#0f1f12", fontSize: 22, fontWeight: 700,
            fontFamily: "var(--font-syne)", marginBottom: 4,
          }}>
            Gráficos
          </h1>
          <p style={{ color: "#7aaa8a", fontSize: 13 }}>
            Histórico detalhado por sensor
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Range selector */}
          <div style={{ display: "flex", gap: 4 }}>
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => handleRangeChange(r.value)}
                style={{
                  padding: "7px 14px", borderRadius: 8,
                  border: `1px solid ${range === r.value ? "#1a5c2e" : "#e8ede9"}`,
                  backgroundColor: range === r.value ? "#1a5c2e" : "#ffffff",
                  color: range === r.value ? "#ffffff" : "#9ab4a2",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Station selector (só se >1 estação) */}
          {stations.length > 1 && (
            <div style={{ display: "flex", gap: 4 }}>
              {stations.map(st => (
                <motion.button
                  key={st.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedStation(st.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "7px 14px", borderRadius: 8,
                    border: `1px solid ${selectedStation === st.id ? "#1a5c2e" : "#e8ede9"}`,
                    backgroundColor: selectedStation === st.id ? "#f0f7f2" : "#ffffff",
                    color: selectedStation === st.id ? "#1a5c2e" : "#9ab4a2",
                    fontSize: 12, fontWeight: selectedStation === st.id ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}
                >
                  <Radio style={{ width: 11, height: 11 }} />
                  {st.name}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Charts ou estado vazio */}
      {!stations.length || !currentStation ? (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 16 }}>
          <EmptyState {...EMPTY_STATES.charts} />
        </div>
      ) : !hasReadings ? (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 16 }}>
          <EmptyState
            {...EMPTY_STATES.charts}
            title="Sem leituras neste período"
            description={`Nenhuma leitura registrada nas últimas ${range}. Tente um período maior ou verifique se o simulador está rodando.`}
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {currentStation.sensors.map((sensor, i) => (
            <motion.div
              key={sensor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <SensorChart
                label={sensor.label}
                type={sensor.type}
                unit={sensor.unit}
                color={TYPE_COLORS[sensor.type] ?? "#1a5c2e"}
                readings={sensor.readings}
                minExpected={sensor.min_expected ?? 0}
                maxExpected={sensor.max_expected ?? 100}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}