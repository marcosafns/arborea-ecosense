"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import {
  Bell, AlertTriangle, CheckCircle, Clock,
  Filter, RefreshCw, X,
} from "lucide-react";
import AlertsSkeleton from "../components/AlertsSkeleton";
import EmptyState, { EMPTY_STATES } from "../components/EmptyState";
import { useToast } from "../components/Toast";

type FilterType = "all" | "active" | "resolved";

const ALERT_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  anomaly:   { color: "#e05252", bg: "#fdf3f3", border: "#f5c6c6" },
  offline:   { color: "#c4942a", bg: "#fdf8f0", border: "#f0ddb0" },
  threshold: { color: "#2a7fd4", bg: "#f0f5fd", border: "#c8d8f5" },
};

export default function AlertsPage() {
  const [alerts,    setAlerts]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<FilterType>("all");
  const [resolving, setResolving] = useState<string | null>(null);
  const supabase = createClient();
  const { success, error, info } = useToast();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Busca alertas com sensor + estação
    const { data, error: err } = await supabase
      .from("alerts")
      .select("*, sensors(id, type, label, station_id, stations(name, client_id))")
      .order("created_at", { ascending: false })
      .limit(100);

    if (err) {
      error("Erro ao carregar alertas", err.message);
      setLoading(false);
      return;
    }

    // Filtra só alertas do usuário atual
    const userAlerts = (data ?? []).filter(
      (a: any) => a.sensors?.stations?.client_id === user.id
    );

    setAlerts(userAlerts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const handleResolve = async (alertId: string) => {
    setResolving(alertId);
    const { error: err } = await supabase
      .from("alerts")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", alertId);

    if (err) {
      error("Erro ao resolver alerta", err.message);
      setResolving(null);
      return;
    }

    success("Alerta resolvido", "O alerta foi marcado como resolvido.");
    await load();
    setResolving(null);
  };

  const handleResolveAll = async () => {
    const activeIds = alerts.filter(a => !a.resolved_at).map(a => a.id);
    if (!activeIds.length) {
      info("Nenhum alerta ativo", "Não há alertas pendentes para resolver.");
      return;
    }

    const { error: err } = await supabase
      .from("alerts")
      .update({ resolved_at: new Date().toISOString() })
      .in("id", activeIds);

    if (err) {
      error("Erro ao resolver alertas", err.message);
      return;
    }

    success("Todos resolvidos!", `${activeIds.length} alerta${activeIds.length !== 1 ? "s" : ""} marcado${activeIds.length !== 1 ? "s" : ""} como resolvido${activeIds.length !== 1 ? "s" : ""}.`);
    await load();
  };

  if (loading) return <AlertsSkeleton />;

  const filtered = alerts.filter(a => {
    if (filter === "active")   return !a.resolved_at;
    if (filter === "resolved") return  a.resolved_at;
    return true;
  });

  const activeCount   = alerts.filter(a => !a.resolved_at).length;
  const resolvedCount = alerts.filter(a =>  a.resolved_at).length;

  const STATS = [
    { label: "Total",      value: alerts.length,  color: "#9ab4a2", bg: "#f7f8f7", border: "#e8ede9" },
    { label: "Ativos",     value: activeCount,    color: activeCount > 0 ? "#e05252" : "#1a5c2e", bg: activeCount > 0 ? "#fdf3f3" : "#f0f7f2", border: activeCount > 0 ? "#f5c6c6" : "#c8e0cf" },
    { label: "Resolvidos", value: resolvedCount,  color: "#1a5c2e", bg: "#f0f7f2", border: "#c8e0cf" },
  ];

  return (
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
            Alertas
          </h1>
          <p style={{ color: "#7aaa8a", fontSize: 13 }}>
            {activeCount > 0 ? `${activeCount} alerta${activeCount !== 1 ? "s" : ""} ativo${activeCount !== 1 ? "s" : ""}` : "Nenhum alerta ativo"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "#f0f7f2" }}
            whileTap={{ scale: 0.97 }}
            onClick={load}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 14px", borderRadius: 10,
              border: "1px solid #e8ede9", backgroundColor: "#ffffff",
              color: "#9ab4a2", fontSize: 13, cursor: "pointer",
              transition: "background-color 0.15s",
            }}
          >
            <RefreshCw style={{ width: 13, height: 13 }} />
            Atualizar
          </motion.button>
          {activeCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "#1e6b34" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleResolveAll}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 14px", borderRadius: 10,
                border: "none", backgroundColor: "#1a5c2e",
                color: "#ffffff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", boxShadow: "0 4px 16px #1a5c2e33",
                transition: "background-color 0.2s",
              }}
            >
              <CheckCircle style={{ width: 13, height: 13 }} />
              Resolver todos
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}
      >
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            style={{
              backgroundColor: "#ffffff", border: "1px solid #e8ede9",
              borderRadius: 14, padding: "18px 20px",
              boxShadow: "0 1px 4px #0f1f1206",
            }}
          >
            <div style={{
              color: "#9ab4a2", fontSize: 11, marginBottom: 8,
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {stat.label}
            </div>
            <div style={{
              color: stat.color, fontSize: 32, fontWeight: 700,
              fontFamily: "var(--font-geist-mono)", lineHeight: 1,
            }}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ display: "flex", gap: 8 }}
      >
        {(["all", "active", "resolved"] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 16px", borderRadius: 999,
              border: `1px solid ${filter === f ? "#1a5c2e" : "#e8ede9"}`,
              backgroundColor: filter === f ? "#1a5c2e" : "#ffffff",
              color: filter === f ? "#ffffff" : "#9ab4a2",
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.15s",
            }}
          >
            {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Resolvidos"}
          </button>
        ))}
      </motion.div>

      {/* Lista de alertas ou estado vazio */}
      {filtered.length === 0 ? (
        <div style={{
          backgroundColor: "#ffffff", border: "1px solid #e8ede9",
          borderRadius: 16,
        }}>
          <EmptyState {...(filter === "all" ? EMPTY_STATES.alerts : EMPTY_STATES.alertsFiltered)} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <AnimatePresence>
            {filtered.map((alert, i) => {
              const cfg        = ALERT_COLORS[alert.type] ?? ALERT_COLORS.anomaly;
              const isResolved = !!alert.resolved_at;
              const isResolving = resolving === alert.id;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.97 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  style={{
                    backgroundColor: "#ffffff",
                    border: `1px solid ${isResolved ? "#e8ede9" : cfg.border}`,
                    borderRadius: 14, padding: "16px 20px",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: 16,
                    opacity: isResolved ? 0.65 : 1,
                    position: "relative", overflow: "hidden",
                    boxShadow: "0 1px 4px #0f1f1206",
                  }}
                >
                  {/* Accent left */}
                  {!isResolved && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, bottom: 0,
                      width: 3, backgroundColor: cfg.color,
                      borderRadius: "14px 0 0 14px",
                    }} />
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 14, paddingLeft: isResolved ? 0 : 6 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      backgroundColor: isResolved ? "#f7f8f7" : cfg.bg,
                      border: `1px solid ${isResolved ? "#e8ede9" : cfg.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isResolved
                        ? <CheckCircle  style={{ width: 15, height: 15, color: "#9ab4a2" }} />
                        : <AlertTriangle style={{ width: 15, height: 15, color: cfg.color }} />
                      }
                    </div>

                    <div>
                      <p style={{
                        color: isResolved ? "#9ab4a2" : "#0f1f12",
                        fontSize: 13, fontWeight: 500, marginBottom: 4,
                        textDecoration: isResolved ? "line-through" : "none",
                      }}>
                        {alert.message}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          fontSize: 11, color: "#b0c4b8",
                          backgroundColor: "#f7f8f7", border: "1px solid #e8ede9",
                          borderRadius: 6, padding: "2px 8px",
                        }}>
                          {alert.sensors?.label ?? "—"}
                        </span>
                        <span style={{
                          fontSize: 11, color: "#b0c4b8",
                          backgroundColor: "#f7f8f7", border: "1px solid #e8ede9",
                          borderRadius: 6, padding: "2px 8px",
                        }}>
                          {alert.sensors?.stations?.name ?? "—"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#c8d8ce" }}>
                          <Clock style={{ width: 10, height: 10 }} />
                          <span style={{ fontSize: 11 }}>
                            {new Date(alert.created_at).toLocaleString("pt-BR", {
                              day: "2-digit", month: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isResolved && (
                    <motion.button
                      whileHover={{ scale: 1.03, backgroundColor: "#f0f7f2", borderColor: "#c8e0cf" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleResolve(alert.id)}
                      disabled={!!isResolving}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 8,
                        border: "1px solid #e8ede9", backgroundColor: "#ffffff",
                        color: "#1a5c2e", fontSize: 12, fontWeight: 500,
                        cursor: isResolving ? "not-allowed" : "pointer",
                        flexShrink: 0, fontFamily: "inherit",
                        transition: "all 0.15s", opacity: isResolving ? 0.6 : 1,
                      }}
                    >
                      {isResolving ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw style={{ width: 11, height: 11 }} />
                        </motion.div>
                      ) : (
                        <>
                          <CheckCircle style={{ width: 11, height: 11 }} />
                          Resolver
                        </>
                      )}
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}