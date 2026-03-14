"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Radio, Cpu, MapPin, Wifi, WifiOff, Trash2, Loader2, AlertTriangle, Lock } from "lucide-react";
import StationModal from "../components/StationModal";
import StationsSkeleton from "../components/StationsSkeleton";
import EmptyState, { EMPTY_STATES } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import Link from "next/link";
import { usePlan } from "@/hooks/usePlan";
import { canAddStation } from "@/lib/plans";

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

function DeleteConfirmModal({
  station,
  onConfirm,
  onCancel,
  loading,
}: {
  station: { id: string; name: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !station) return null;

  return createPortal(
    <AnimatePresence>
      {station && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onCancel()}
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              backgroundColor: "#0f1f1230",
              backdropFilter: "blur(2px)",
            }}
          />
          <div style={{
            position: "fixed", inset: 0, zIndex: 1001,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              style={{
                pointerEvents: "all",
                backgroundColor: "#ffffff",
                border: "1px solid #e8ede9",
                borderRadius: 20, padding: "28px",
                width: 360,
                boxShadow: "0 24px 64px #0f1f1228",
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: "#fdf3f3", border: "1px solid #f5c6c6",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <AlertTriangle style={{ width: 22, height: 22, color: "#e05252" }} />
              </div>

              <h3 style={{
                color: "#0f1f12", fontSize: 16, fontWeight: 700,
                marginBottom: 6, fontFamily: "var(--font-syne)",
              }}>
                Excluir estação?
              </h3>
              <p style={{ color: "#9ab4a2", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                A estação <strong style={{ color: "#6b8f78" }}>"{station.name}"</strong> e todos os seus sensores e leituras serão removidos permanentemente.
              </p>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={onCancel}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "10px 16px", borderRadius: 10,
                    border: "1px solid #e8ede9", backgroundColor: "#ffffff",
                    color: "#0f1f12", fontSize: 13, fontWeight: 500,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit", opacity: loading ? 0.5 : 1,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "10px 16px", borderRadius: 10,
                    border: "none", backgroundColor: "#e05252",
                    color: "#ffffff", fontSize: 13, fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit", opacity: loading ? 0.7 : 1,
                    display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6,
                    transition: "opacity 0.2s",
                  }}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: 14, height: 14,
                        border: "2px solid #ffffff44",
                        borderTop: "2px solid #ffffff",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <>
                      <Trash2 style={{ width: 13, height: 13 }} />
                      Excluir
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default function StationsPage() {
  const [stations,     setStations]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);
  const [deleting,     setDeleting]     = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const supabase = createClient();
  const { success, error } = useToast();
  const { plan, stationsLeft } = usePlan();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: err } = await supabase
      .from("stations")
      .select("*, sensors(*)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (err) {
      error("Erro ao carregar estações", err.message);
      setLoading(false);
      return;
    }

    setStations(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);

    const { error: err } = await supabase.from("stations").delete().eq("id", deleteTarget.id);

    if (err) {
      error("Erro ao excluir estação", err.message);
      setDeleting(null);
      setDeleteTarget(null);
      return;
    }

    success("Estação removida", `"${deleteTarget.name}" foi excluída com sucesso.`);
    setDeleteTarget(null);
    setDeleting(null);
    await load();
  };

  const handleCreated = async () => {
    await load();
    success("Estação criada!", "Sua nova estação está pronta para receber dados.");
  };

  if (loading) return <StationsSkeleton />;

  // Verifica se pode adicionar mais estações
  const allowed = canAddStation(plan.id, stations.length);

  return (
    <>
      <StationModal open={modal} onClose={() => setModal(false)} onCreated={handleCreated} />

      <DeleteConfirmModal
        station={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={!!deleting}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
        >
          <div>
            <h1 style={{
              color: "#0f1f12", fontSize: 22, fontWeight: 700,
              fontFamily: "var(--font-syne)", marginBottom: 4,
            }}>
              Estações
            </h1>
            <p style={{ color: "#7aaa8a", fontSize: 13 }}>
              {stations.length} estação{stations.length !== 1 ? "ões" : ""} cadastrada{stations.length !== 1 ? "s" : ""}
              {stationsLeft !== null && (
                <span style={{ color: stationsLeft === 0 ? "#e05252" : "#b0c4b8", marginLeft: 8 }}>
                  · {stationsLeft === 0 ? "limite atingido" : `${stationsLeft} restante${stationsLeft !== 1 ? "s" : ""}`}
                </span>
              )}
            </p>
          </div>

          {/* Botão Nova Estação — bloqueado se atingiu limite */}
          <div style={{ position: "relative" }}>
            <motion.button
              whileHover={allowed ? { scale: 1.03, backgroundColor: "#1e6b34" } : { scale: 1 }}
              whileTap={allowed ? { scale: 0.97 } : {}}
              onClick={() => allowed && setModal(true)}
              title={!allowed ? `Limite do plano ${plan.name}: ${plan.maxStations} estação${plan.maxStations !== 1 ? "ões" : ""}` : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 18px", borderRadius: 10,
                backgroundColor: allowed ? "#1a5c2e" : "#c8d8ce",
                border: "none",
                color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: allowed ? "pointer" : "not-allowed",
                boxShadow: allowed ? "0 4px 16px #1a5c2e33" : "none",
                transition: "all 0.2s",
              }}
            >
              {allowed
                ? <Plus style={{ width: 15, height: 15 }} />
                : <Lock style={{ width: 13, height: 13 }} />
              }
              Nova Estação
              {!allowed && (
                <span style={{
                  fontSize: 10, backgroundColor: "#ffffff22",
                  borderRadius: 999, padding: "1px 6px",
                }}>
                  {plan.name}
                </span>
              )}
            </motion.button>

            {/* Tooltip de upgrade quando bloqueado */}
            {!allowed && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                backgroundColor: "#0f1f12", color: "#ffffff",
                fontSize: 11, borderRadius: 8, padding: "8px 12px",
                whiteSpace: "nowrap", zIndex: 10,
                boxShadow: "0 4px 16px #0f1f1233",
                pointerEvents: "none",
                opacity: 0,
              }}
                className="plan-tooltip"
              >
                Faça upgrade para adicionar mais estações
              </div>
            )}
          </div>
        </motion.div>

        {/* Banner de upgrade quando no limite */}
        {!allowed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: 12,
              backgroundColor: "#fdf8f0", border: "1px solid #f0ddb0",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Lock style={{ width: 14, height: 14, color: "#c4942a", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#8a6a1a" }}>
                Você atingiu o limite de <strong>{plan.maxStations} estação{plan.maxStations !== 1 ? "ões" : ""}</strong> do plano {plan.name}.
              </span>
            </div>
            <Link
              href="/dashboard/settings?tab=conta"
              style={{
                fontSize: 12, fontWeight: 600, color: "#c4942a",
                backgroundColor: "#f0ddb0", borderRadius: 999,
                padding: "5px 12px", textDecoration: "none",
                whiteSpace: "nowrap", flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              Ver planos
            </Link>
          </motion.div>
        )}

        {/* Lista de estações */}
        <AnimatePresence>
          {stations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                backgroundColor: "#ffffff", border: "1.5px dashed #e8ede9",
                borderRadius: 16,
              }}
            >
              <EmptyState
                {...EMPTY_STATES.stations}
                action={allowed ? { label: "Criar estação", onClick: () => setModal(true) } : undefined}
              />
            </motion.div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {stations.map((station, i) => {
                const lastSeen   = station.last_seen_at ? new Date(station.last_seen_at) : null;
                const isOnline   = lastSeen ? Date.now() - lastSeen.getTime() < 2 * 60 * 1000 : false;
                const isDeleting = deleting === station.id;

                return (
                  <motion.div
                    key={station.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.97 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e8ede9",
                      borderRadius: 14, overflow: "hidden",
                      boxShadow: "0 1px 4px #0f1f1208",
                    }}
                  >
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "18px 22px",
                      borderBottom: station.sensors?.length ? "1px solid #f0f4f1" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Radio style={{ width: 18, height: 18, color: "#1a5c2e" }} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <Link href={`/dashboard/stations/${station.id}`} style={{ textDecoration: "none" }}>
                              <motion.span
                                whileHover={{ color: "#1a5c2e" }}
                                style={{ color: "#0f1f12", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "color 0.15s" }}
                              >
                                {station.name}
                              </motion.span>
                            </Link>
                            <div style={{
                              display: "flex", alignItems: "center", gap: 4,
                              backgroundColor: isOnline ? "#f0f7f2" : "#fafcfa",
                              border: `1px solid ${isOnline ? "#c8e0cf" : "#e8ede9"}`,
                              borderRadius: 999, padding: "2px 8px",
                            }}>
                              {isOnline
                                ? <Wifi    style={{ width: 10, height: 10, color: "#1a5c2e" }} />
                                : <WifiOff style={{ width: 10, height: 10, color: "#c8d8ce" }} />}
                              <span style={{ fontSize: 10, color: isOnline ? "#1a5c2e" : "#b0c4b8", fontWeight: 500 }}>
                                {isOnline ? "online" : "offline"}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {station.description && (
                              <span style={{ color: "#9ab4a2", fontSize: 12 }}>{station.description}</span>
                            )}
                            {station.latitude && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <MapPin style={{ width: 11, height: 11, color: "#b0c4b8" }} />
                                <span style={{ color: "#b0c4b8", fontSize: 11, fontFamily: "var(--font-geist-mono)" }}>
                                  {parseFloat(station.latitude).toFixed(4)}, {parseFloat(station.longitude).toFixed(4)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 11, color: "#7aaa8a",
                          backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf",
                          borderRadius: 999, padding: "3px 10px",
                        }}>
                          <Cpu style={{ width: 10, height: 10, display: "inline", marginRight: 4 }} />
                          {station.sensors?.length ?? 0} sensores
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05, backgroundColor: "#fdf3f3", borderColor: "#f5c6c6" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDeleteTarget({ id: station.id, name: station.name })}
                          disabled={!!isDeleting}
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: "1px solid #e8ede9", backgroundColor: "#fafcfa",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "#c8d8ce", transition: "all 0.15s",
                          }}
                        >
                          {isDeleting
                            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                                <Loader2 style={{ width: 13, height: 13 }} />
                              </motion.div>
                            : <Trash2 style={{ width: 13, height: 13 }} />}
                        </motion.button>
                      </div>
                    </div>

                    {station.sensors?.length > 0 && (
                      <div style={{ padding: "12px 22px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {station.sensors.map((sensor: any, si: number) => (
                          <motion.div
                            key={sensor.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.06 + si * 0.04 }}
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              padding: "5px 10px",
                              backgroundColor: "#fafcfa",
                              border: "1px solid #f0f4f1",
                              borderRadius: 8,
                            }}
                          >
                            <div style={{
                              width: 6, height: 6, borderRadius: "50%",
                              backgroundColor: TYPE_COLORS[sensor.type] ?? "#1a5c2e",
                            }} />
                            <span style={{ color: "#6b8f78", fontSize: 11 }}>
                              {TYPE_LABELS[sensor.type] ?? sensor.type}
                            </span>
                            <span style={{ color: "#c8d8ce", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}>
                              {sensor.unit}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}