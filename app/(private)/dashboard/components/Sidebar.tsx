"use client";

// app/(private)/dashboard/components/Sidebar.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, Radio, Bell, Settings, ChevronRight, BarChart2, FileText } from "lucide-react";
import { useState } from "react";
import LogoutButton from "./LogoutButton";

const NAV = [
  { icon: LayoutDashboard, label: "Visão Geral",   href: "/dashboard" },
  { icon: BarChart2,       label: "Gráficos",      href: "/dashboard/charts" },
  { icon: FileText,        label: "Relatórios",    href: "/dashboard/reports" },
  { icon: Radio,           label: "Estações",      href: "/dashboard/stations" },
  { icon: Bell,            label: "Alertas",       href: "/dashboard/alerts" },
  { icon: Settings,        label: "Configurações", href: "/dashboard/settings" },
];

const LOGO_FILTER = "brightness(0) saturate(0) invert(17%) sepia(40%) saturate(800%) hue-rotate(95deg) brightness(40%)";

interface SidebarProps {
  // Chamado quando o usuário navega (para fechar o drawer no mobile)
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname    = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // No mobile (quando onNavigate existe) nunca colapsa — mostra sempre expandido
  const isMobile = !!onNavigate;
  const isCollapsed = isMobile ? false : collapsed;
  const W = isCollapsed ? 64 : 230;

  return (
    <motion.aside
      initial={isMobile ? { x: 0, opacity: 1 } : { x: -230, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: W }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      style={{
        width: isMobile ? 240 : W,
        height: "100vh",
        position: isMobile ? "relative" : "sticky",
        top: 0,
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e8ede9",
        display: "flex", flexDirection: "column",
        padding: "20px 0",
        flexShrink: 0, zIndex: 50, overflow: "visible",
        boxShadow: isMobile ? "4px 0 24px #0f1f1218" : "1px 0 0 #e8ede9",
      }}
    >
      {/* Toggle — só no desktop */}
      {!isMobile && (
        <div style={{ position: "absolute", top: "50%", right: -13, transform: "translateY(-50%)", zIndex: 60 }}>
          <motion.button
            whileHover={{ scale: 1.15, backgroundColor: "#1a5c2e", borderColor: "#1a5c2e", color: "#ffffff" }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setCollapsed(prev => !prev)}
            title={isCollapsed ? "Expandir" : "Recolher"}
            style={{
              width: 26, height: 26, borderRadius: "50%",
              backgroundColor: "#ffffff", border: "1.5px solid #e8ede9",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#9ab4a2",
              boxShadow: "0 2px 8px #0f1f1218",
              transition: "background-color 0.2s, border-color 0.2s, color 0.2s",
            }}
          >
            <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.3, type: "spring", stiffness: 300 }}>
              <ChevronRight style={{ width: 13, height: 13 }} />
            </motion.div>
          </motion.button>
        </div>
      )}

      {/* Logo */}
      <div style={{
        padding: isCollapsed ? "0 14px 20px" : "0 16px 20px",
        borderBottom: "1px solid #e8ede9", marginBottom: 8,
        display: "flex", alignItems: "center",
        justifyContent: isCollapsed ? "center" : "flex-start",
        minHeight: 60,
      }}>
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                <img src="/img/ecosense-logo1.svg" alt="Arborea EcoSense" style={{ height: 30, width: "auto", filter: LOGO_FILTER }} />
              </Link>
            </motion.div>
          ) : (
            <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                <img src="/img/ecosense-logotipo1.svg" alt="Arborea EcoSense" style={{ height: 30, width: "auto", filter: LOGO_FILTER }} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Label seção */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ padding: "4px 22px 6px" }}>
            <span style={{ fontSize: 10, color: "#b0c4b8", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>Menu</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
        {NAV.map(({ icon: Icon, label, href }, i) => {
          const active = pathname === href;
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22 + i * 0.07, type: "spring", stiffness: 300, damping: 24 }}
            >
              <Link
                href={href}
                onClick={onNavigate}
                title={isCollapsed ? label : undefined}
                style={{
                  display: "flex", alignItems: "center",
                  gap: isCollapsed ? 0 : 10,
                  padding: isCollapsed ? "10px 0" : "9px 12px",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  borderRadius: 10, textDecoration: "none",
                  color: active ? "#1a5c2e" : "#6b8f78",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  position: "relative", transition: "color 0.15s",
                }}
              >
                <motion.div
                  whileHover={!active ? { backgroundColor: "#f7faf8" } : {}}
                  style={{
                    position: "absolute", inset: 0,
                    backgroundColor: active ? "#f0f7f2" : "transparent",
                    border: `1px solid ${active ? "#c8e0cf" : "transparent"}`,
                    borderRadius: 10, zIndex: 0,
                    transition: "background-color 0.15s, border-color 0.15s",
                  }}
                />
                <Icon style={{ width: 16, height: 16, flexShrink: 0, zIndex: 1, position: "relative" }} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ flex: 1, zIndex: 1, position: "relative", whiteSpace: "nowrap", overflow: "hidden" }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {active && !isCollapsed && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} style={{ zIndex: 1, position: "relative" }}>
                      <ChevronRight style={{ width: 12, height: 12 }} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {active && isCollapsed && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      style={{ position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", backgroundColor: "#1a5c2e" }}
                    />
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ padding: "12px 10px 0", borderTop: "1px solid #e8ede9" }}
      >
        <LogoutButton collapsed={isCollapsed} />
      </motion.div>
    </motion.aside>
  );
}