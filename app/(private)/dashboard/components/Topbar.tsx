"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Search, X, Radio, BarChart2, Bell, Settings, ArrowRight } from "lucide-react";
import NotificationBell from "./NotificationBell";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SEARCH_INDEX = [
  { label: "Visão Geral",   href: "/dashboard",           icon: BarChart2, description: "Painel principal com todos os sensores" },
  { label: "Gráficos",      href: "/dashboard/charts",    icon: BarChart2, description: "Histórico detalhado por sensor" },
  { label: "Estações",      href: "/dashboard/stations",  icon: Radio,     description: "Gerenciar estações de monitoramento" },
  { label: "Alertas",       href: "/dashboard/alerts",    icon: Bell,      description: "Anomalias e eventos detectados" },
  { label: "Configurações", href: "/dashboard/settings",  icon: Settings,  description: "Perfil, plano e segurança" },
];

export default function Topbar() {
  const [email,       setEmail]       = useState("");
  const [search,      setSearch]      = useState("");
  const [focused,     setFocused]     = useState(false);
  const [results,     setResults]     = useState(SEARCH_INDEX);
  const inputRef  = useRef<HTMLInputElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);
  const supabase  = createClient();
  const router    = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email ?? "");
    });

    // Atalho Cmd/Ctrl + K
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
      if (e.key === "Escape") {
        setFocused(false);
        setSearch("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKey);

    // Fechar ao clicar fora
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setFocused(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) { setResults(SEARCH_INDEX); return; }
    setResults(SEARCH_INDEX.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    ));
  }, [search]);

  const handleSelect = (href: string) => {
    router.push(href);
    setFocused(false);
    setSearch("");
  };

  const initials = email ? email[0].toUpperCase() : "?";
  const showPanel = focused;

  return (
    <>
      {/* Overlay ao abrir busca */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 40,
              backgroundColor: "#0f1f1210",
              backdropFilter: "blur(1px)",
            }}
          />
        )}
      </AnimatePresence>

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.1 }}
        style={{
          height: 58,
          borderBottom: "1px solid #e8ede9",
          backgroundColor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          flexShrink: 0,
          position: "relative",
          zIndex: 45,
        }}
      >
        {/* Esquerda — data + status */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#9ab4a2", fontSize: 12 }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf",
              borderRadius: 999, padding: "3px 10px",
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#1a5c2e", display: "block" }}
            />
            <span style={{ color: "#1a5c2e", fontSize: 11, fontWeight: 600 }}>Sistema operacional</span>
          </motion.div>
        </div>

        {/* Centro — busca global */}
        <div ref={panelRef} style={{ position: "relative", width: 340 }}>
          <motion.div
            animate={{
              boxShadow: focused ? "0 0 0 2px #1a5c2e33" : "0 0 0 0px transparent",
              borderColor: focused ? "#1a5c2e" : "#e8ede9",
            }}
            transition={{ duration: 0.2 }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              backgroundColor: focused ? "#ffffff" : "#fafcfa",
              border: "1.5px solid #e8ede9",
              borderRadius: 10, padding: "0 12px",
              height: 36,
            }}
          >
            <Search style={{ width: 14, height: 14, color: "#9ab4a2", flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Buscar páginas..."
              style={{
                flex: 1, border: "none", outline: "none",
                backgroundColor: "transparent",
                fontSize: 13, color: "#0f1f12",
                fontFamily: "inherit",
              }}
            />
            <AnimatePresence>
              {search ? (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearch("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#c8d8ce", padding: 0 }}
                >
                  <X style={{ width: 13, height: 13 }} />
                </motion.button>
              ) : (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontSize: 10, color: "#c8d8ce",
                    backgroundColor: "#f0f4f1",
                    border: "1px solid #e8ede9",
                    borderRadius: 4, padding: "2px 5px",
                    fontFamily: "var(--font-geist-mono)",
                    whiteSpace: "nowrap",
                  }}
                >
                  ⌘K
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Dropdown de resultados */}
          <AnimatePresence>
            {showPanel && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                style={{
                  position: "absolute", top: "calc(100% + 8px)",
                  left: 0, right: 0, zIndex: 100,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e8ede9",
                  borderRadius: 12,
                  boxShadow: "0 8px 32px #0f1f1218",
                  overflow: "hidden",
                }}
              >
                {results.length === 0 ? (
                  <div style={{ padding: "20px 16px", textAlign: "center", color: "#b0c4b8", fontSize: 13 }}>
                    Nenhum resultado para "{search}"
                  </div>
                ) : (
                  <>
                    <div style={{ padding: "8px 12px 4px" }}>
                      <span style={{ fontSize: 10, color: "#b0c4b8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                        {search ? "Resultados" : "Páginas"}
                      </span>
                    </div>
                    {results.map((item, i) => (
                      <motion.button
                        key={item.href}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ backgroundColor: "#f7faf8" }}
                        onClick={() => handleSelect(item.href)}
                        style={{
                          width: "100%", padding: "10px 14px",
                          display: "flex", alignItems: "center", gap: 12,
                          border: "none", backgroundColor: "transparent",
                          cursor: "pointer", textAlign: "left",
                          borderTop: i > 0 ? "1px solid #f7f8f7" : "none",
                        }}
                      >
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <item.icon style={{ width: 13, height: 13, color: "#1a5c2e" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "#0f1f12", fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                          <div style={{ color: "#9ab4a2", fontSize: 11 }}>{item.description}</div>
                        </div>
                        <ArrowRight style={{ width: 13, height: 13, color: "#c8d8ce" }} />
                      </motion.button>
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Direita */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#b0c4b8", fontSize: 11 }}>
            <Shield style={{ width: 13, height: 13 }} />
            <span>Conexão segura</span>
          </div>

          <div style={{ width: 1, height: 20, backgroundColor: "#e8ede9", margin: "0 4px" }} />

          <NotificationBell />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: "#1a5c2e",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 13, fontWeight: 700,
              }}
            >
              {initials}
            </motion.div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ color: "#0f1f12", fontSize: 12, fontWeight: 600 }}>
                {email.split("@")[0]}
              </div>
              <div style={{ color: "#9ab4a2", fontSize: 10 }}>
                {email.split("@")[1] ? `@${email.split("@")[1]}` : ""}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.header>
    </>
  );
}