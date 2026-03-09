"use client";

import { useState } from "react";
import { Check, Zap, Sprout, TreePine, Globe } from "lucide-react";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import Link from "next/link";

const PLANS = [
  {
    id:       "semente",
    name:     "Semente",
    price:    "Grátis",
    period:   "",
    icon:     Sprout,
    color:    "#2a9e4a",
    bg:       "#f0f7f2",
    border:   "#c8e0cf",
    popular:  false,
    description: "Para começar a explorar o monitoramento ambiental.",
    features: [
      "1 estação de monitoramento",
      "Até 4 sensores",
      "Dashboard básico",
      "Histórico de 7 dias",
      "Alertas por e-mail",
    ],
    cta: "Começar grátis",
    href: "/login",
  },
  {
    id:       "broto",
    name:     "Broto",
    price:    "R$ 49",
    period:   "/mês",
    icon:     Zap,
    color:    "#2a7fd4",
    bg:       "#f0f5fd",
    border:   "#c8d8f5",
    popular:  false,
    description: "Para gestores com uma área verde em crescimento.",
    features: [
      "3 estações de monitoramento",
      "Até 16 sensores",
      "Dashboard completo",
      "Histórico de 30 dias",
      "Alertas em tempo real",
      "Exportação CSV",
    ],
    cta: "Assinar Broto",
    href: "/login",
  },
  {
    id:       "floresta",
    name:     "Floresta",
    price:    "R$ 149",
    period:   "/mês",
    icon:     TreePine,
    color:    "#1a5c2e",
    bg:       "#f0f7f2",
    border:   "#1a5c2e",
    popular:  true,
    description: "Para operações sérias que exigem dados confiáveis.",
    features: [
      "10 estações de monitoramento",
      "Sensores ilimitados",
      "Dashboard avançado + gráficos",
      "Histórico de 1 ano",
      "Alertas + notificações push",
      "Exportação CSV e PDF",
      "API de acesso",
      "Suporte prioritário",
    ],
    cta: "Assinar Floresta",
    href: "/login",
  },
  {
    id:       "ecossistema",
    name:     "Ecossistema",
    price:    "Custom",
    period:   "",
    icon:     Globe,
    color:    "#c4942a",
    bg:       "#fdf8f0",
    border:   "#f0ddb0",
    popular:  false,
    description: "Para grandes operações e redes de monitoramento.",
    features: [
      "Estações ilimitadas",
      "Sensores ilimitados",
      "White-label disponível",
      "Histórico ilimitado",
      "SLA garantido",
      "Integrações personalizadas",
      "Gerente de conta dedicado",
      "Treinamento da equipe",
    ],
    cta: "Falar com equipe",
    href: "mailto:contato@arborea.com.br",
  },
];

export default function Pricing() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <section
      id="planos"
      style={{ backgroundColor: "var(--surface)" }}
      className="py-28 px-6"
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <AnimateOnScroll className="mb-16 text-center max-w-2xl mx-auto">
          <span style={{ color: "#2d8a4e", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 16 }}>
            Planos
          </span>
          <h2
            style={{
              color: "var(--text-primary)", fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1,
              marginBottom: 16, fontFamily: "var(--font-syne)",
            }}
          >
            Escale conforme
            <br />
            <span style={{ color: "#1a5c2e" }}>sua área verde cresce.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7 }}>
            Do jardim urbano à grande reserva florestal — temos um plano para cada escala.
            Sem taxas escondidas, sem surpresas.
          </p>
        </AnimateOnScroll>

        {/* Plans grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            alignItems: "start",
          }}
        >
          {PLANS.map((plan, i) => {
            const Icon     = plan.icon;
            const isHovered = hoveredPlan === plan.id;
            const isPop    = plan.popular;

            return (
              <AnimateOnScroll key={plan.id} delay={i * 80}>
                <div
                  onMouseEnter={() => setHoveredPlan(plan.id)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  style={{
                    position: "relative",
                    backgroundColor: isPop ? "#1a5c2e" : "var(--bg-card)",
                    border: `1.5px solid ${isPop ? "#1a5c2e" : isHovered ? plan.border : "var(--border)"}`,
                    borderRadius: 20,
                    padding: "28px 24px",
                    transition: "all 0.25s ease",
                    transform: isPop ? "scale(1.02)" : isHovered ? "translateY(-4px)" : "none",
                    boxShadow: isPop
                      ? "0 20px 60px #1a5c2e44"
                      : isHovered
                        ? "0 12px 40px #00000014"
                        : "0 1px 4px #00000008",
                    cursor: "default",
                  }}
                >
                  {/* Popular badge */}
                  {isPop && (
                    <div style={{
                      position: "absolute", top: -14, left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#2d8a4e",
                      color: "#ffffff",
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      padding: "5px 16px", borderRadius: 999,
                      whiteSpace: "nowrap",
                      boxShadow: "0 4px 12px #2d8a4e55",
                    }}>
                      Mais popular
                    </div>
                  )}

                  {/* Icon + name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      backgroundColor: isPop ? "#ffffff18" : plan.bg,
                      border: `1px solid ${isPop ? "#ffffff28" : plan.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon style={{ width: 18, height: 18, color: isPop ? "#ffffff" : plan.color }} />
                    </div>
                    <div>
                      <div style={{
                        color: isPop ? "#ffffff" : "var(--text-primary)",
                        fontWeight: 700, fontSize: 16,
                        fontFamily: "var(--font-syne)",
                      }}>
                        {plan.name}
                      </div>
                      <div style={{ color: isPop ? "#ffffffaa" : "var(--text-muted)", fontSize: 11 }}>
                        {plan.description}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: 24 }}>
                    <span style={{
                      color: isPop ? "#ffffff" : "var(--text-primary)",
                      fontSize: 36, fontWeight: 800,
                      fontFamily: "var(--font-geist-mono)",
                      letterSpacing: "-0.04em",
                    }}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span style={{ color: isPop ? "#ffffffaa" : "var(--text-muted)", fontSize: 13, marginLeft: 4 }}>
                        {plan.period}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{
                    height: 1,
                    backgroundColor: isPop ? "#ffffff18" : "var(--border)",
                    marginBottom: 20,
                  }} />

                  {/* Features */}
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {plan.features.map((feature) => (
                      <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 6, flexShrink: 0,
                          backgroundColor: isPop ? "#ffffff20" : `${plan.color}18`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          marginTop: 1,
                        }}>
                          <Check style={{ width: 10, height: 10, color: isPop ? "#ffffff" : plan.color }} />
                        </div>
                        <span style={{
                          color: isPop ? "#ffffffcc" : "var(--text-secondary)",
                          fontSize: 13, lineHeight: 1.5,
                        }}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.href}
                    style={{
                      display: "block", textAlign: "center",
                      padding: "11px 20px", borderRadius: 999,
                      fontSize: 13, fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.2s",
                      backgroundColor: isPop ? "#ffffff" : "transparent",
                      color: isPop ? "#1a5c2e" : plan.color,
                      border: isPop ? "none" : `1.5px solid ${plan.border}`,
                    }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>

        {/* Bottom note */}
        <AnimateOnScroll className="mt-12 text-center">
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Todos os planos incluem 14 dias de avaliação gratuita · Cancele a qualquer momento · Sem cartão de crédito para começar
          </p>
        </AnimateOnScroll>
      </div>
    </section>
  );
}