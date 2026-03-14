"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import ChartsSkeleton from "../components/ChartsSkeleton";
import SensorChart from "../components/SensorChart";
import EmptyState, { EMPTY_STATES } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { Radio, GitCompare, LayoutGrid, X, Check, Info, Lock } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { usePlan } from "@/hooks/usePlan";
import { getHistoryStartDate } from "@/lib/plans";

type Range    = "1h" | "6h" | "24h" | "7d";
type ViewMode = "individual" | "compare";

const RANGE_MS: Record<Range, number> = {
  "1h":  1  * 60 * 60 * 1000,
  "6h":  6  * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d":  7  * 24 * 60 * 60 * 1000,
};

// Quantos dias mínimos cada range exige no histórico
const RANGE_MIN_DAYS: Record<Range, number> = {
  "1h":  0,
  "6h":  0,
  "24h": 1,
  "7d":  7,
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

const TYPE_LABELS: Record<string, string> = {
  temperature:   "Temperatura",
  humidity:      "Umidade do Ar",
  soil_humidity: "Umidade do Solo",
  luminosity:    "Luminosidade",
  ph:            "pH",
  co2:           "CO₂",
  wind:          "Vento",
  rain:          "Chuva",
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

const RANGES: { label: string; value: Range }[] = [
  { label: "1h",  value: "1h"  },
  { label: "6h",  value: "6h"  },
  { label: "24h", value: "24h" },
  { label: "7d",  value: "7d"  },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: "#ffffff", border: "1px solid #e8ede9",
      borderRadius: 12, padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(15,31,18,0.1)", minWidth: 160,
    }}>
      <div style={{ color: "#9ab4a2", fontSize: 11, marginBottom: 8 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: p.color, flexShrink: 0 }} />
          <span style={{ color: "#6b8f78", fontSize: 12, flex: 1 }}>{p.name}</span>
          <span style={{ color: "#0f1f12", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ChartsPage() {
  const [stations,        setStations]        = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [range,           setRange]           = useState<Range>("24h");
  const [loading,         setLoading]         = useState(true);
  const [viewMode,        setViewMode]        = useState<ViewMode>("individual");
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const supabase = createClient();
  const { error } = useToast();
  const { plan } = usePlan();

  const load = useCallback(async (r: Range = range) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: stationsData, error: stErr } = await supabase
      .from("stations")
      .select("id, name, sensors(id, type, label, unit, min_expected, max_expected)")
      .eq("client_id", user.id)
      .eq("status", "active");

    if (stErr) { error("Erro ao carregar estações", stErr.message); setLoading(false); return; }
    if (!stationsData?.length) { setLoading(false); return; }

    // Limite do range solicitado
    const rangeSince = new Date(Date.now() - RANGE_MS[r]);

    // Limite do plano — não deixa buscar além do permitido
    const planSince = getHistoryStartDate(plan.id);

    // Usa o mais restritivo dos dois (o mais recente)
    const since = (rangeSince > planSince ? rangeSince : planSince).toISOString();

    const allSensorIds = stationsData.flatMap(s => (s.sensors ?? []).map((sen: any) => sen.id));

    const { data: readingsData, error: rdErr } = await supabase
      .from("readings")
      .select("sensor_id, value, recorded_at")
      .in("sensor_id", allSensorIds)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true });

    if (rdErr) error("Erro ao carregar leituras", rdErr.message);

    const byId: Record<string, { value: number; recorded_at: string }[]> = {};
    for (const rd of readingsData ?? []) {
      if (!byId[rd.sensor_id]) byId[rd.sensor_id] = [];
      byId[rd.sensor_id].push({ value: rd.value, recorded_at: rd.recorded_at });
    }

    const result: Station[] = stationsData.map(st => ({
      id: st.id, name: st.name,
      sensors: (st.sensors ?? []).map((sen: any) => ({ ...sen, readings: byId[sen.id] ?? [] })),
    }));

    setStations(result);
    if (!selectedStation) setSelectedStation(result[0]?.id ?? null);
    setLoading(false);
  }, [range, selectedStation, plan.id]);

  useEffect(() => { load(); }, [plan.id]);

  // Verifica se um range está disponível no plano atual
  const isRangeAllowed = (r: Range) => {
    if (plan.historyDays === -1) return true;
    return plan.historyDays >= RANGE_MIN_DAYS[r];
  };

  const handleRangeChange = (r: Range) => {
    if (!isRangeAllowed(r)) return;
    setRange(r); setLoading(true); load(r);
  };

  const toggleSensor = (id: string) => setSelectedSensors(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  );
  const switchMode = (mode: ViewMode) => { setViewMode(mode); setSelectedSensors([]); };

  const buildCompareData = () => {
    const station = stations.find(s => s.id === selectedStation);
    if (!station) return { data: [], sensors: [] };
    const sensors = station.sensors.filter(s => selectedSensors.includes(s.id));
    if (!sensors.length) return { data: [], sensors: [] };

    const normalize = (value: number, sensor: SensorWithReadings) => {
      const range = (sensor.max_expected ?? 100) - (sensor.min_expected ?? 0);
      return range === 0 ? 50 : Math.round(((value - sensor.min_expected) / range) * 100);
    };

    const allTimestamps = Array.from(
      new Set(sensors.flatMap(s => s.readings.map(r => r.recorded_at)))
    ).sort();

    const data = allTimestamps.map(ts => {
      const point: Record<string, any> = {
        time: new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      for (const sensor of sensors) {
        const reading = sensor.readings.find(r => r.recorded_at === ts);
        if (reading !== undefined) {
          point[sensor.id]           = parseFloat(reading.value.toFixed(2));
          point[`${sensor.id}_norm`] = normalize(reading.value, sensor);
        }
      }
      return point;
    });

    const step = Math.max(1, Math.floor(data.length / 200));
    return { data: data.filter((_, i) => i % step === 0), sensors };
  };

  if (loading) return <ChartsSkeleton />;

  const currentStation = stations.find(s => s.id === selectedStation);
  const hasReadings    = currentStation?.sensors.some(s => s.readings.length > 0);
  const { data: compareData, sensors: compareSensors } = buildCompareData();
  const units      = Array.from(new Set(compareSensors.map(s => s.unit)));
  const mixedUnits = units.length > 1;

  // Label do limite de histórico para exibir no header
  const historyLabel = plan.historyDays === -1
    ? "histórico ilimitado"
    : `últimos ${plan.historyDays} dia${plan.historyDays !== 1 ? "s" : ""}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}
      >
        <div>
          <h1 style={{ color: "#0f1f12", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-syne)", marginBottom: 4 }}>Gráficos</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ color: "#7aaa8a", fontSize: 13 }}>Histórico detalhado por sensor</p>
            {/* Badge do limite do plano */}
            <span style={{
              fontSize: 10, color: "#9ab4a2",
              backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf",
              borderRadius: 999, padding: "2px 8px",
            }}>
              Plano {plan.name} · {historyLabel}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>

          {/* Modo toggle */}
          <div style={{ display: "flex", backgroundColor: "#f4f7f4", borderRadius: 10, padding: 3, gap: 2 }}>
            {([
              { mode: "individual" as ViewMode, icon: LayoutGrid, label: "Individual" },
              { mode: "compare"    as ViewMode, icon: GitCompare,  label: "Comparar"   },
            ]).map(({ mode, icon: Icon, label }) => (
              <motion.button key={mode} whileTap={{ scale: 0.96 }} onClick={() => switchMode(mode)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                borderRadius: 8, border: "none",
                backgroundColor: viewMode === mode ? "#ffffff" : "transparent",
                color: viewMode === mode ? "#1a5c2e" : "#9ab4a2",
                fontSize: 12, fontWeight: viewMode === mode ? 600 : 400,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: viewMode === mode ? "0 1px 4px rgba(15,31,18,0.08)" : "none",
                transition: "all 0.15s",
              }}>
                <Icon style={{ width: 13, height: 13 }} />{label}
              </motion.button>
            ))}
          </div>

          {/* Range — bloqueado pelo plano */}
          <div style={{ display: "flex", gap: 4 }}>
            {RANGES.map(r => {
              const allowed = isRangeAllowed(r.value);
              return (
                <button
                  key={r.value}
                  onClick={() => handleRangeChange(r.value)}
                  disabled={!allowed}
                  title={!allowed ? `Disponível no plano com histórico de ${RANGE_MIN_DAYS[r.value]} dias ou mais` : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "7px 14px", borderRadius: 8,
                    border: `1px solid ${!allowed ? "#f0f4f1" : range === r.value ? "#1a5c2e" : "#e8ede9"}`,
                    backgroundColor: !allowed ? "#f8fbf8" : range === r.value ? "#1a5c2e" : "#ffffff",
                    color: !allowed ? "#c8d8ce" : range === r.value ? "#ffffff" : "#9ab4a2",
                    fontSize: 12, fontWeight: 500,
                    cursor: allowed ? "pointer" : "not-allowed",
                    fontFamily: "inherit", transition: "all 0.15s",
                  }}
                >
                  {!allowed && <Lock style={{ width: 9, height: 9 }} />}
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Estação */}
          {stations.length > 1 && (
            <div style={{ display: "flex", gap: 4 }}>
              {stations.map(st => (
                <motion.button key={st.id} whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelectedStation(st.id); setSelectedSensors([]); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 8,
                    border: `1px solid ${selectedStation === st.id ? "#1a5c2e" : "#e8ede9"}`,
                    backgroundColor: selectedStation === st.id ? "#f0f7f2" : "#ffffff",
                    color: selectedStation === st.id ? "#1a5c2e" : "#9ab4a2",
                    fontSize: 12, fontWeight: selectedStation === st.id ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}>
                  <Radio style={{ width: 11, height: 11 }} />{st.name}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Conteúdo */}
      {!stations.length || !currentStation ? (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 16 }}>
          <EmptyState {...EMPTY_STATES.charts} />
        </div>
      ) : (
        <AnimatePresence mode="wait">

          {/* INDIVIDUAL */}
          {viewMode === "individual" && (
            <motion.div key="individual"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            >
              {!hasReadings ? (
                <div style={{ backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 16 }}>
                  <EmptyState {...EMPTY_STATES.charts} title="Sem leituras neste período"
                    description={`Nenhuma leitura nas últimas ${range}. Tente um período maior.`} />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 460px), 1fr))", gap: 16 }}>
                  {currentStation.sensors.map((sensor, i) => (
                    <motion.div key={sensor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <SensorChart label={sensor.label} type={sensor.type} unit={sensor.unit}
                        color={TYPE_COLORS[sensor.type] ?? "#1a5c2e"} readings={sensor.readings}
                        minExpected={sensor.min_expected ?? 0} maxExpected={sensor.max_expected ?? 100} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* COMPARAR */}
          {viewMode === "compare" && (
            <motion.div key="compare"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* Seletor */}
              <div style={{ backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ color: "#0f1f12", fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Selecione os sensores para comparar</div>
                    <div style={{ color: "#9ab4a2", fontSize: 12 }}>Escolha 2 ou mais • {selectedSensors.length} selecionado{selectedSensors.length !== 1 ? "s" : ""}</div>
                  </div>
                  {selectedSensors.length > 0 && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSelectedSensors([])} style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8,
                      border: "1px solid #e8ede9", backgroundColor: "#f4f7f4",
                      color: "#9ab4a2", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    }}>
                      <X style={{ width: 11, height: 11 }} />Limpar
                    </motion.button>
                  )}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {currentStation.sensors.map(sensor => {
                    const selected = selectedSensors.includes(sensor.id);
                    const color    = TYPE_COLORS[sensor.type] ?? "#1a5c2e";
                    const hasData  = sensor.readings.length > 0;
                    return (
                      <motion.button key={sensor.id}
                        whileHover={hasData ? { scale: 1.03 } : {}}
                        whileTap={hasData ? { scale: 0.97 } : {}}
                        onClick={() => hasData && toggleSensor(sensor.id)}
                        disabled={!hasData}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 10,
                          border: `1.5px solid ${selected ? color : "#e8ede9"}`,
                          backgroundColor: selected ? `${color}14` : "#f8fbf8",
                          cursor: hasData ? "pointer" : "not-allowed",
                          opacity: hasData ? 1 : 0.4, fontFamily: "inherit", transition: "all 0.15s",
                        }}
                      >
                        <div style={{
                          width: 14, height: 14, borderRadius: "50%",
                          backgroundColor: selected ? color : "transparent",
                          border: `2px solid ${selected ? color : "#c8d8ce"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, transition: "all 0.15s",
                        }}>
                          {selected && <Check style={{ width: 8, height: 8, color: "#fff" }} />}
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ color: selected ? color : "#0f1f12", fontSize: 13, fontWeight: selected ? 600 : 400 }}>{sensor.label}</div>
                          <div style={{ color: "#b0c4b8", fontSize: 10 }}>{TYPE_LABELS[sensor.type] ?? sensor.type} • {sensor.unit}{!hasData && " • sem dados"}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico */}
              <AnimatePresence>
                {selectedSensors.length >= 2 ? (
                  <motion.div key="chart"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{ backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 16, padding: 24 }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ color: "#0f1f12", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Comparação de Sensores</div>
                        <div style={{ color: "#9ab4a2", fontSize: 12 }}>{compareSensors.map(s => s.label).join(" vs ")}</div>
                      </div>
                      {mixedUnits && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
                          backgroundColor: "#f0f5fd", border: "1px solid #c4d8f5",
                        }}>
                          <Info style={{ width: 12, height: 12, color: "#2a7fd4", flexShrink: 0 }} />
                          <span style={{ color: "#2a7fd4", fontSize: 11 }}>Eixo Y normalizado (0–100%) — unidades diferentes</span>
                        </motion.div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                      {compareSensors.map(sensor => (
                        <div key={sensor.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 24, height: 3, borderRadius: 2, backgroundColor: TYPE_COLORS[sensor.type] ?? "#1a5c2e" }} />
                          <span style={{ color: "#6b8f78", fontSize: 12 }}>{sensor.label}{!mixedUnits && ` (${sensor.unit})`}</span>
                        </div>
                      ))}
                    </div>

                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={compareData} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f1" />
                        <XAxis dataKey="time" tick={{ fill: "#9ab4a2", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: "#9ab4a2", fontSize: 11 }} axisLine={false} tickLine={false}
                          tickFormatter={v => mixedUnits ? `${v}%` : String(v)} />
                        <Tooltip content={<CustomTooltip />} />
                        {compareSensors.map(sensor => (
                          <Line key={sensor.id} type="monotone"
                            dataKey={mixedUnits ? `${sensor.id}_norm` : sensor.id}
                            name={sensor.label}
                            stroke={TYPE_COLORS[sensor.type] ?? "#1a5c2e"}
                            strokeWidth={2} dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>

                    <div style={{
                      display: "grid", gridTemplateColumns: `repeat(${Math.min(compareSensors.length, 2)}, 1fr)`,
                      gap: 12, marginTop: 20, paddingTop: 20, borderTop: "1px solid #f0f4f1",
                    }}>
                      {compareSensors.map(sensor => {
                        const vals = sensor.readings.map(r => r.value);
                        const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                        const min  = vals.length ? Math.min(...vals) : 0;
                        const max  = vals.length ? Math.max(...vals) : 0;
                        const color = TYPE_COLORS[sensor.type] ?? "#1a5c2e";
                        return (
                          <div key={sensor.id} style={{ padding: "12px 14px", backgroundColor: `${color}08`, borderRadius: 10, border: `1px solid ${color}22` }}>
                            <div style={{ color, fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{sensor.label}</div>
                            {[{ l: "Média", v: avg }, { l: "Mín", v: min }, { l: "Máx", v: max }].map(({ l, v }) => (
                              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                <span style={{ color: "#9ab4a2", fontSize: 11 }}>{l}</span>
                                <span style={{ color: "#0f1f12", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}>{v.toFixed(1)} {sensor.unit}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : selectedSensors.length === 1 ? (
                  <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 16, padding: 32, textAlign: "center" }}>
                    <div style={{ color: "#9ab4a2", fontSize: 13 }}>
                      Selecione pelo menos <strong style={{ color: "#1a5c2e" }}>mais um sensor</strong> para comparar
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      )}
    </div>
  );
}