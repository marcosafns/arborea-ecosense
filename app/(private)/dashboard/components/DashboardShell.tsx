"use client";

// app/(private)/dashboard/components/DashboardShell.tsx
// Client component que gerencia o estado do drawer mobile
// e compõe Sidebar + Topbar + conteúdo

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import PageTransition from "./PageTransition";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);

  // Detecta mobile e fecha drawer ao redimensionar para desktop
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setDrawerOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fecha drawer ao navegar (qualquer clique dentro do drawer)
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div
      data-theme="light"
      style={{
        display: "flex", minHeight: "100vh",
        backgroundColor: "#f7f8f7",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
      }}
    >
      {/* ── Sidebar desktop (sticky) ou drawer mobile ── */}
      {isMobile ? (
        <>
          {/* Overlay escuro */}
          <AnimatePresence>
            {drawerOpen && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeDrawer}
                style={{
                  position: "fixed", inset: 0, zIndex: 100,
                  backgroundColor: "#0f1f1250",
                  backdropFilter: "blur(2px)",
                }}
              />
            )}
          </AnimatePresence>

          {/* Drawer deslizante */}
          <motion.div
            initial={false}
            animate={{ x: drawerOpen ? 0 : -260 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            style={{
              position: "fixed", top: 0, left: 0, bottom: 0,
              zIndex: 110, width: 240,
            }}
          >
            <Sidebar onNavigate={closeDrawer} />
          </motion.div>
        </>
      ) : (
        <Sidebar />
      )}

      {/* ── Conteúdo principal ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Topbar
          onMenuClick={() => setDrawerOpen(prev => !prev)}
          showMenuButton={isMobile}
        />
        <main style={{
          flex: 1, overflow: "auto",
          padding: isMobile ? "16px" : "32px",
          backgroundColor: "#f7f8f7",
        }}>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}