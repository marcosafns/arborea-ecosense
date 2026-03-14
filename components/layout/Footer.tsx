"use client";

import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, Github, Linkedin, Twitter, ArrowRight } from "lucide-react";
import Link from "next/link";

const FOOTER_LINKS = {
  Produto: [
    { label: "Como Funciona",      href: "#como-funciona" },
    { label: "Planos",             href: "#planos" },
    { label: "Depoimentos",        href: "#depoimentos" },
    { label: "Acessar Plataforma", href: "/dashboard" },
  ],
  Empresa: [
    { label: "Nossa Jornada", href: "#jornada" },
    { label: "Blog",          href: "#" },
    { label: "Carreiras",     href: "#" },
    { label: "Imprensa",      href: "#" },
  ],
  Suporte: [
    { label: "Documentação",       href: "#" },
    { label: "Guia de início",     href: "#" },
    { label: "Status do sistema",  href: "#" },
    { label: "Contato",            href: "mailto:contato@arborea.com.br" },
  ],
};

const SOCIAL = [
  { icon: Github,   href: "#", label: "GitHub" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter,  href: "#", label: "Twitter" },
];

export default function Footer() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme((document.documentElement.getAttribute("data-theme") as "dark" | "light") ?? "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <footer style={{ backgroundColor: "var(--bg)", borderTop: "1px solid var(--border)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* Grid: coluna única mobile → 4 colunas md+ */}
        <div className="footer-grid">
          {/* Brand column */}
          <div>
            <Link href="/" style={{
              display: "flex", alignItems: "center", textDecoration: "none",
              filter: theme === "light" ? "brightness(0) saturate(0) invert(17%) sepia(40%) saturate(800%) hue-rotate(95deg) brightness(40%)" : "none",
              transition: "opacity 0.2s",
            }}>
              <img src="/img/arborea-logotipo1.svg" alt="Arborea EcoSense" style={{ height: 80, width: "auto" }} />
            </Link>

            <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.8, marginBottom: 20, maxWidth: 280, marginTop: 12 }}>
              Sistema de monitoramento ambiental IoT para áreas verdes — do jardim urbano à grande reserva florestal.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                { icon: Mail,   text: "contato@arborea.com.br" },
                { icon: Phone,  text: "+55 (19) 3000-0000" },
                { icon: MapPin, text: "Campinas, São Paulo — Brasil" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon style={{ width: 13, height: 13, color: "#2d8a4e", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <Link key={label} href={href} aria-label={label} style={{
                  width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)", transition: "all 0.2s", textDecoration: "none",
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#1a5c2e"; el.style.color = "#2d8a4e"; el.style.backgroundColor = "#1a5c2e0d"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "var(--border)"; el.style.color = "var(--text-muted)"; el.style.backgroundColor = "transparent"; }}
                >
                  <Icon style={{ width: 14, height: 14 }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                {category}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none", transition: "color 0.15s", display: "inline-flex", alignItems: "center", gap: 4 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#2d8a4e"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)"; }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div style={{
          marginTop: 40, padding: "22px 24px",
          backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 18, display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 20, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 15, marginBottom: 4, fontFamily: "var(--font-syne)" }}>
              Receba novidades do EcoSense
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Artigos sobre monitoramento ambiental, dicas de IoT e atualizações da plataforma.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input type="email" placeholder="seu@email.com.br" style={{
              padding: "10px 16px", borderRadius: 999,
              border: "1px solid var(--border)", backgroundColor: "var(--bg)",
              color: "var(--text-primary)", fontSize: 13, outline: "none",
              width: "min(220px, 100%)", fontFamily: "inherit",
            }} />
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 999,
              backgroundColor: "#1a5c2e", color: "#ffffff",
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              fontFamily: "inherit", transition: "all 0.2s", boxShadow: "0 4px 16px #1a5c2e44",
            }}>
              Inscrever
              <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "14px 16px" }}>
        <div className="max-w-7xl mx-auto footer-bottom">
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            © {new Date().getFullYear()} Arborea Inovações. Todos os direitos reservados.
          </p>
          <div className="footer-legal">
            {[
              { label: "Privacidade",         href: "#" },
              { label: "Termos de Uso",       href: "#" },
              { label: "Política de Cookies", href: "#" },
            ].map(link => (
              <Link key={link.label} href={link.href} style={{ color: "var(--text-muted)", fontSize: 12, textDecoration: "none" }}>
                {link.label}
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#2d8a4e", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Todos os sistemas operacionais</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* Footer grid: 1 col mobile → 4 col md */
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 640px) {
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px 24px; }
        }
        @media (min-width: 768px) {
          .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
        }

        /* Bottom bar */
        .footer-bottom {
          display: flex; flex-direction: column;
          align-items: center; gap: 10; text-align: center;
        }
        @media (min-width: 768px) {
          .footer-bottom {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 12;
            text-align: left;
          }
        }

        /* Legal links */
        .footer-legal {
          display: flex; gap: 16; flex-wrap: wrap; justify-content: center;
        }
        @media (min-width: 768px) {
          .footer-legal { gap: 20; }
        }
      `}</style>
    </footer>
  );
}