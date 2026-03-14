"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
import { NAV_LINKS, SITE } from "@/constants";
import { motion, AnimatePresence } from "motion/react";

export default function Navbar() {
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme,    setTheme]    = useState<"dark" | "light">("dark");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha ao redimensionar para desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Bloqueia scroll quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <>
      <style>{`
        .nav-desktop  { display: none; }
        .nav-mobile   { display: flex; }
        .nav-pill     { display: none; }
        @media (min-width: 768px) {
          .nav-desktop { display: flex; }
          .nav-mobile  { display: none; }
          .nav-pill    { display: flex; }
        }
        .nav-link:hover {
          color: var(--text-primary) !important;
          background-color: var(--surface) !important;
        }
        .theme-btn:hover {
          border-color: #1a5c2e !important;
          color: #2d8a4e !important;
          background-color: #1a5c2e0d !important;
        }
        .cta-btn:hover {
          box-shadow: 0 4px 20px #1a5c2e66 !important;
          transform: translateY(-1px) !important;
        }
        .mobile-link:hover {
          background-color: var(--surface) !important;
          color: var(--text-primary) !important;
        }
      `}</style>

      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          transition: "all 0.4s ease",
          padding: scrolled ? "10px 0" : "20px 0",
          backgroundColor: scrolled
            ? "color-mix(in srgb, var(--bg) 88%, transparent)"
            : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "none",
        }}
      >
        <nav style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>

          {/* Logo */}
          <Link href="/" className="nav-logo" style={{ display: "flex", alignItems: "center", textDecoration: "none", transition: "opacity 0.2s" }}>
            <img
              src="/img/ecosense-logotipo1.svg"
              alt="Arborea EcoSense"
              style={{
                height: 24, width: "auto",
                filter: theme === "light" ? "brightness(0) saturate(0) invert(17%) sepia(40%) saturate(800%) hue-rotate(95deg) brightness(40%)" : "none",
                transition: "filter 0.3s ease",
              }}
            />
          </Link>

          {/* Desktop links pill */}
          <ul className="nav-pill" style={{
            alignItems: "center", gap: 2, listStyle: "none",
            padding: "6px 8px", margin: 0,
            backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 999,
          }}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="nav-link" style={{
                  color: "var(--text-secondary)", fontSize: 13, fontWeight: 500,
                  textDecoration: "none", padding: "6px 16px", borderRadius: 999,
                  display: "block", transition: "all 0.2s",
                }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop right */}
          <div className="nav-desktop" style={{ alignItems: "center", gap: 8 }}>
            <button onClick={toggleTheme} aria-label="Alternar tema" className="theme-btn" style={{
              width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border)",
              backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-muted)", cursor: "pointer", transition: "all 0.2s",
            }}>
              {theme === "dark" ? <Sun style={{ width: 15, height: 15 }} /> : <Moon style={{ width: 15, height: 15 }} />}
            </button>
            <Link href="/dashboard" className="cta-btn" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              backgroundColor: "#1a5c2e", color: "#ffffff", borderRadius: 999, padding: "9px 20px",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 2px 12px #1a5c2e44", transition: "all 0.2s",
            }}>
              Acessar Plataforma
              <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          {/* Mobile toggle */}
          <div className="nav-mobile" style={{ alignItems: "center", gap: 8 }}>
            <button onClick={toggleTheme} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4 }}>
              {theme === "dark" ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
            </button>

            {/* Botão hamburger/X com animação de rotação */}
            <motion.button
              onClick={() => setOpen(!open)}
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{
                background: "none", border: "1px solid var(--border)",
                cursor: "pointer", color: "var(--text-primary)",
                padding: "6px 8px", borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "x" : "menu"}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: "flex" }}
                >
                  {open ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </nav>

        {/* Mobile menu animado */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div style={{
                backgroundColor: "var(--bg)",
                borderTop: "1px solid var(--border)",
                padding: "16px 20px 20px",
                display: "flex", flexDirection: "column", gap: 2,
              }}>
                {/* Links com entrada escalonada */}
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.08, duration: 0.22, ease: "easeOut" }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="mobile-link"
                      style={{
                        display: "block", color: "var(--text-secondary)", fontSize: 15,
                        textDecoration: "none", padding: "11px 14px",
                        borderRadius: 10, fontWeight: 500, transition: "all 0.15s",
                      }}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Divider */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: NAV_LINKS.length * 0.05 + 0.08 }}
                  style={{ height: 1, backgroundColor: "var(--border)", margin: "6px 0" }}
                />

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: NAV_LINKS.length * 0.05 + 0.14, duration: 0.22 }}
                >
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      backgroundColor: "#1a5c2e", color: "#ffffff",
                      borderRadius: 999, padding: "13px 20px",
                      fontSize: 14, fontWeight: 600, textDecoration: "none",
                      boxShadow: "0 4px 16px #1a5c2e44",
                    }}
                  >
                    Acessar Plataforma
                    <ArrowRight style={{ width: 13, height: 13 }} />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}