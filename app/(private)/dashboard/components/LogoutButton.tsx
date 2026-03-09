"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";

export default function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [mounted,    setMounted]    = useState(false);

  const supabase         = createClient();
  const router           = useRouter();
  const { error, success } = useToast();

  useEffect(() => { setMounted(true); }, []);

  const handleLogout = async () => {
    setLoading(true);
    const { error: err } = await supabase.auth.signOut();
    if (err) {
      error("Erro ao sair", "Tente novamente em instantes.");
      setLoading(false);
      setConfirming(false);
      return;
    }
    success("Até logo!", "Sessão encerrada com sucesso.");
    setTimeout(() => router.push("/login"), 800);
  };

  return (
    <>
      {/* Botão na sidebar */}
      <button
        onClick={() => setConfirming(true)}
        title={collapsed ? "Sair" : undefined}
        style={{
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 8,
          width: "100%", padding: collapsed ? "10px 0" : "9px 12px",
          background: "none", border: "none",
          borderRadius: 9, cursor: "pointer",
          color: "#e05252", fontSize: 13, fontWeight: 500,
          transition: "background-color 0.15s",
          fontFamily: "inherit",
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fdf3f3")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <LogOut style={{ width: 15, height: 15, flexShrink: 0 }} />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden", whiteSpace: "nowrap" }}
            >
              Sair
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Modal via portal — renderiza direto no body, fora de qualquer transform */}
      {mounted && createPortal(
        <AnimatePresence>
          {confirming && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !loading && setConfirming(false)}
                style={{
                  position: "fixed", inset: 0, zIndex: 1000,
                  backgroundColor: "#0f1f1230",
                  backdropFilter: "blur(2px)",
                }}
              />

              {/* Wrapper de posicionamento — flexbox garante centralização real sem conflito com o motion */}
              <div style={{
                position: "fixed", inset: 0, zIndex: 1001,
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -8 }}
                animate={{ opacity: 1, scale: 1,    y: 0  }}
                exit={{    opacity: 0, scale: 0.94, y: -8  }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                style={{
                  pointerEvents: "all",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e8ede9",
                  borderRadius: 20, padding: "28px",
                  width: 340,
                  boxShadow: "0 24px 64px #0f1f1228",
                }}
              >
                {/* Icon */}
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
                  marginBottom: 8, fontFamily: "var(--font-syne)",
                }}>
                  Sair da conta?
                </h3>
                <p style={{
                  color: "#9ab4a2", fontSize: 13, lineHeight: 1.6, marginBottom: 24,
                }}>
                  Sua sessão será encerrada e você precisará fazer login novamente para acessar o dashboard.
                </p>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                    style={{
                      flex: 1, padding: "10px 16px", borderRadius: 10,
                      border: "1px solid #e8ede9", backgroundColor: "#ffffff",
                      color: "#0f1f12", fontSize: 13, fontWeight: 500,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLogout}
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
                        <LogOut style={{ width: 13, height: 13 }} />
                        Sair
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
      )}
    </>
  );
}