"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

// ─── tipos ────────────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id:      string;
  type:    ToastType;
  title:   string;
  message?: string;
}

interface ToastContextValue {
  toast:   (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
}

// ─── context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

// ─── config visual por tipo ───────────────────────────────────────────────────
const CONFIG: Record<ToastType, {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}> = {
  success: { icon: CheckCircle,   color: "#1a5c2e", bg: "#f0f7f2", border: "#c8e0cf" },
  error:   { icon: XCircle,       color: "#e05252", bg: "#fdf3f3", border: "#f5c6c6" },
  warning: { icon: AlertTriangle, color: "#c4942a", bg: "#fdf8f0", border: "#f0ddb0" },
  info:    { icon: Info,          color: "#2a7fd4", bg: "#f0f5fd", border: "#c8d8f5" },
};

// ─── item individual ──────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const cfg  = CONFIG[toast.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60,  scale: 0.92 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      style={{
        backgroundColor: "#ffffff",
        border: `1px solid ${cfg.border}`,
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex", alignItems: "flex-start", gap: 12,
        boxShadow: "0 8px 32px #0f1f1218",
        minWidth: 300, maxWidth: 380,
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Accent left */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0,
        width: 3, backgroundColor: cfg.color,
        borderRadius: "14px 0 0 14px",
      }} />

      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 15, height: 15, color: cfg.color }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, paddingLeft: 4 }}>
        <div style={{
          color: "#0f1f12", fontSize: 13, fontWeight: 600,
          marginBottom: toast.message ? 3 : 0,
        }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ color: "#9ab4a2", fontSize: 12, lineHeight: 1.5 }}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 4.5, ease: "linear" }}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 2, backgroundColor: cfg.color,
          transformOrigin: "left", opacity: 0.4,
        }}
      />

      {/* Close */}
      <button
        onClick={onDismiss}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#c8d8ce", padding: 2, flexShrink: 0,
          display: "flex", alignItems: "center",
        }}
      >
        <X style={{ width: 13, height: 13 }} />
      </button>
    </motion.div>
  );
}

// ─── provider + container ─────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const success = useCallback((t: string, m?: string) => toast("success", t, m), [toast]);
  const error   = useCallback((t: string, m?: string) => toast("error",   t, m), [toast]);
  const warning = useCallback((t: string, m?: string) => toast("warning", t, m), [toast]);
  const info    = useCallback((t: string, m?: string) => toast("info",    t, m), [toast]);

  // Garantir que o portal só monta no cliente — evita hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}

      {mounted && createPortal(
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          display: "flex", flexDirection: "column", gap: 8,
          pointerEvents: "none",
        }}>
          <AnimatePresence mode="popLayout">
            {toasts.map(t => (
              <div key={t.id} style={{ pointerEvents: "all" }}>
                <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
              </div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}