"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { Bell, AlertTriangle, CheckCircle, X, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Alert {
  id: string;
  type: string;
  message: string;
  created_at: string;
  resolved_at: string | null;
  sensors: {
    type: string;
    label: string;
    stations: { name: string };
  };
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

export default function NotificationBell() {
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const [open, setOpen]         = useState(false);
  const [newAlert, setNewAlert] = useState(false);
  const [toast, setToast]       = useState<Alert | null>(null);
  const panelRef                = useRef<HTMLDivElement>(null);
  const supabase                = createClient();

  const activeAlerts = alerts.filter(a => !a.resolved_at);

  const load = async () => {
    const { data } = await supabase
      .from("alerts")
      .select(`*, sensors(type, label, stations(name))`)
      .order("created_at", { ascending: false })
      .limit(20);
    setAlerts(data ?? []);
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel("bell-alerts")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "alerts",
      }, async (payload) => {
        // Buscar dados completos do novo alerta
        const { data } = await supabase
          .from("alerts")
          .select(`*, sensors(type, label, stations(name))`)
          .eq("id", payload.new.id)
          .single();

        if (data) {
          setAlerts(prev => [data, ...prev]);
          setNewAlert(true);
          setToast(data);
          setTimeout(() => setNewAlert(false), 3000);
          setTimeout(() => setToast(null), 5000);
        }
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "alerts",
      }, () => load())
      .subscribe();

    // Fechar ao clicar fora
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(mins / 60);
    if (hrs > 0)  return `${hrs}h atrás`;
    if (mins > 0) return `${mins}min atrás`;
    return "agora";
  };

  return (
    <>
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{
              position: "fixed", top: 70, right: 24, zIndex: 200,
              backgroundColor: "#ffffff",
              border: "1px solid #fde8e8",
              borderRadius: 12, padding: "14px 16px",
              boxShadow: "0 8px 32px #0f1f1220",
              display: "flex", alignItems: "flex-start", gap: 12,
              maxWidth: 320, minWidth: 280,
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              backgroundColor: "#fdf3f3",
              border: "1px solid #f5c6c6",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertTriangle style={{ width: 15, height: 15, color: "#e05252" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#0f1f12", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                Novo alerta detectado
              </div>
              <div style={{ color: "#7aaa8a", fontSize: 12, marginBottom: 4 }}>
                {toast.sensors?.label} · {toast.sensors?.stations?.name}
              </div>
              <div style={{ color: "#9ab4a2", fontSize: 11 }}>{toast.message}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#c8d8ce", padding: 0, flexShrink: 0,
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>

            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: "linear" }}
              style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: 2, backgroundColor: "#e05252",
                borderRadius: "0 0 12px 12px",
                transformOrigin: "left",
                opacity: 0.4,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bell button + panel */}
      <div ref={panelRef} style={{ position: "relative" }}>
        <motion.button
          whileHover={{ scale: 1.05, borderColor: "#c8e0cf" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(prev => !prev)}
          style={{
            width: 34, height: 34, borderRadius: 10,
            border: `1px solid ${open ? "#c8e0cf" : "#e8ede9"}`,
            backgroundColor: open ? "#f0f7f2" : "#fff",
            color: "#6b8f78",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", position: "relative",
          }}
        >
          <motion.div
            animate={newAlert ? { rotate: [0, -20, 20, -15, 15, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Bell style={{ width: 15, height: 15 }} />
          </motion.div>

          {/* Badge */}
          <AnimatePresence>
            {activeAlerts.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                style={{
                  position: "absolute", top: -4, right: -4,
                  minWidth: 16, height: 16,
                  backgroundColor: "#e05252",
                  border: "2px solid #fff",
                  borderRadius: 999,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "#fff", fontWeight: 700,
                  fontFamily: "var(--font-geist-mono)",
                  padding: "0 3px",
                }}
              >
                {activeAlerts.length > 9 ? "9+" : activeAlerts.length}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                width: 340, zIndex: 150,
                backgroundColor: "#ffffff",
                border: "1px solid #e8ede9",
                borderRadius: 16,
                boxShadow: "0 16px 48px #0f1f1218",
                overflow: "hidden",
              }}
            >
              {/* Panel header */}
              <div style={{
                padding: "14px 18px",
                borderBottom: "1px solid #f0f4f1",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#0f1f12", fontSize: 14, fontWeight: 600 }}>Notificações</span>
                  {activeAlerts.length > 0 && (
                    <span style={{
                      fontSize: 10, padding: "2px 7px", borderRadius: 999,
                      backgroundColor: "#fdf3f3", border: "1px solid #f5c6c6",
                      color: "#e05252", fontWeight: 600,
                    }}>
                      {activeAlerts.length} ativo{activeAlerts.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <Link
                  href="/dashboard/alerts"
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    color: "#1a5c2e", fontSize: 11, fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  Ver todos
                  <ExternalLink style={{ width: 11, height: 11 }} />
                </Link>
              </div>

              {/* Lista */}
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {alerts.length === 0 ? (
                  <div style={{ padding: "32px 0", textAlign: "center" }}>
                    <CheckCircle style={{ width: 24, height: 24, color: "#c8d8ce", margin: "0 auto 8px" }} />
                    <p style={{ color: "#b0c4b8", fontSize: 13 }}>Nenhuma notificação</p>
                  </div>
                ) : (
                  alerts.map((alert, i) => {
                    const resolved   = !!alert.resolved_at;
                    const sensorType = alert.sensors?.type ?? "";
                    const color      = TYPE_COLORS[sensorType] ?? "#1a5c2e";

                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{
                          padding: "12px 18px",
                          borderBottom: "1px solid #f7f8f7",
                          display: "flex", alignItems: "flex-start", gap: 12,
                          backgroundColor: resolved ? "#ffffff" : "#fffcfc",
                          opacity: resolved ? 0.6 : 1,
                        }}
                      >
                        {/* Dot */}
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                          marginTop: 5,
                          backgroundColor: resolved ? "#c8d8ce" : color,
                        }} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ color: "#0f1f12", fontSize: 12, fontWeight: 600 }}>
                              {alert.sensors?.label ?? "Sensor"}
                            </span>
                            {resolved && (
                              <CheckCircle style={{ width: 11, height: 11, color: "#1a5c2e" }} />
                            )}
                          </div>
                          <p style={{
                            color: "#9ab4a2", fontSize: 11,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {alert.message}
                          </p>
                          <div style={{ color: "#c8d8ce", fontSize: 10, marginTop: 3, fontFamily: "var(--font-geist-mono)" }}>
                            {timeAgo(alert.created_at)} · {alert.sensors?.stations?.name}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {alerts.length > 0 && (
                <div style={{
                  padding: "10px 18px",
                  borderTop: "1px solid #f0f4f1",
                  textAlign: "center",
                }}>
                  <Link
                    href="/dashboard/alerts"
                    onClick={() => setOpen(false)}
                    style={{
                      color: "#1a5c2e", fontSize: 12, fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    Gerenciar todos os alertas →
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}