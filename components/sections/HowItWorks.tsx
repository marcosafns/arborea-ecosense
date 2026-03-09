"use client";

import { Cpu, Wifi, BarChart2, LayoutDashboard, ArrowRight } from "lucide-react";
import { HOW_IT_WORKS } from "@/constants";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

const iconMap: Record<string, React.ReactNode> = {
  cpu:              <Cpu className="w-5 h-5" />,
  wifi:             <Wifi className="w-5 h-5" />,
  "bar-chart-2":    <BarChart2 className="w-5 h-5" />,
  "layout-dashboard": <LayoutDashboard className="w-5 h-5" />,
};

const TAGS = ["Temperatura", "Umidade do ar", "Umidade do solo", "Luminosidade", "pH do solo", "CO₂", "Vento", "Precipitação"];

export default function HowItWorks() {
  return (
    <section id="como-funciona" style={{ backgroundColor: "var(--bg)" }} className="py-28 px-6">
      <style>{`
        .step-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px 24px;
          transition: all 0.25s ease;
          position: relative;
          height: 100%;
        }
        .step-card:hover {
          border-color: #1a5c2e55;
          transform: translateY(-4px);
          box-shadow: 0 12px 40px #00000010;
        }
        .step-connector {
          display: none;
        }
        @media (min-width: 1024px) {
          .step-connector { display: block; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <AnimateOnScroll className="mb-20">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <div style={{ maxWidth: 520 }}>
              <span style={{
                color: "#2d8a4e", fontSize: 11, letterSpacing: "0.12em",
                textTransform: "uppercase", fontWeight: 600,
                display: "block", marginBottom: 16,
              }}>
                Como Funciona
              </span>
              <h2 style={{
                color: "var(--text-primary)",
                fontSize: "clamp(2rem, 5vw, 3.2rem)",
                fontWeight: 800, letterSpacing: "-0.03em",
                lineHeight: 1.1, marginBottom: 16,
                fontFamily: "var(--font-syne)",
              }}>
                Do sensor ao insight,
                <br />
                <span style={{ color: "#1a5c2e" }}>em segundos.</span>
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7 }}>
                O EcoSense conecta hardware de campo com software inteligente para
                entregar monitoramento ambiental real e acionável.
              </p>
            </div>

            {/* Step count badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 16, padding: "16px 24px",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: "#1a5c2e18", border: "1px solid #1a5c2e33",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: "#1a5c2e", fontWeight: 800, fontSize: 18, fontFamily: "var(--font-geist-mono)" }}>
                  {HOW_IT_WORKS.length}
                </span>
              </div>
              <div>
                <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>etapas simples</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>do campo ao dashboard</div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5" style={{ marginBottom: 20 }}>
          {HOW_IT_WORKS.map((item, i) => (
            <AnimateOnScroll key={item.step} delay={i * 90}>
              <div className="step-card">

                {/* Connector arrow */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div
                    className="step-connector"
                    style={{
                      position: "absolute", top: "50%", right: -18,
                      transform: "translateY(-50%)", zIndex: 2,
                      color: "#c8e0cf",
                    }}
                  >
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </div>
                )}

                {/* Step number + icon */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: "#1a5c2e18", border: "1px solid #1a5c2e22",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#2d8a4e",
                  }}>
                    {iconMap[item.icon]}
                  </div>
                  <span style={{
                    fontSize: 40, fontWeight: 800, lineHeight: 1,
                    color: "var(--border-hover)",
                    fontFamily: "var(--font-geist-mono)",
                    letterSpacing: "-0.04em",
                  }}>
                    {String(item.step).padStart(2, "0")}
                  </span>
                </div>

                {/* Accent line */}
                <div style={{
                  width: 32, height: 2, backgroundColor: "#1a5c2e",
                  borderRadius: 999, marginBottom: 16, opacity: 0.4,
                }} />

                <h3 style={{
                  color: "var(--text-primary)", fontWeight: 700,
                  fontSize: 16, marginBottom: 10,
                  fontFamily: "var(--font-syne)",
                }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7 }}>
                  {item.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Variables strip */}
        <AnimateOnScroll delay={200}>
          <div style={{
            borderRadius: 20, padding: "24px 32px",
            backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 20,
          }}>
            <div>
              <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                Variáveis monitoradas
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                Cada sensor coleta múltiplas variáveis ambientais simultaneamente.
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TAGS.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 12, padding: "6px 14px", borderRadius: 999,
                    backgroundColor: "#1a5c2e14",
                    color: "#2d8a4e",
                    border: "1px solid #1a5c2e2a",
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}