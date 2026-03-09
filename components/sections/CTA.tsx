"use client";

import Link from "next/link";
import { ArrowRight, Mail, MessageCircle, Zap } from "lucide-react";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export default function CTA() {
  return (
    <section
      id="contato"
      style={{ backgroundColor: "var(--surface)" }}
      className="py-28 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <AnimateOnScroll>
          <div
            style={{
              position: "relative",
              backgroundColor: "#1a5c2e",
              borderRadius: 28, overflow: "hidden",
              padding: "64px 48px",
              textAlign: "center",
            }}
          >
            {/* Background effects */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
            }}>
              <div style={{
                position: "absolute", top: -80, right: -80,
                width: 300, height: 300,
                background: "radial-gradient(circle, #2d8a4e55 0%, transparent 70%)",
                borderRadius: "50%",
              }} />
              <div style={{
                position: "absolute", bottom: -60, left: -60,
                width: 250, height: 250,
                background: "radial-gradient(circle, #0f3d1e55 0%, transparent 70%)",
                borderRadius: "50%",
              }} />
              {/* Grid pattern */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `
                  linear-gradient(#ffffff08 1px, transparent 1px),
                  linear-gradient(90deg, #ffffff08 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }} />
            </div>

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                backgroundColor: "#ffffff18", border: "1px solid #ffffff28",
                borderRadius: 999, padding: "6px 16px", marginBottom: 28,
              }}>
                <Zap style={{ width: 12, height: 12, color: "#7dda9e" }} />
                <span style={{ color: "#7dda9e", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Comece hoje
                </span>
              </div>

              <h2
                style={{
                  color: "#ffffff",
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  fontWeight: 800, letterSpacing: "-0.03em",
                  lineHeight: 1.1, marginBottom: 20,
                  fontFamily: "var(--font-syne)",
                }}
              >
                Pronto para monitorar
                <br />
                sua área verde?
              </h2>

              <p style={{
                color: "#ffffffaa", fontSize: 16,
                maxWidth: 480, margin: "0 auto 40px",
                lineHeight: 1.7,
              }}>
                Entre em contato com nossa equipe e descubra como o EcoSense pode
                transformar a gestão do seu espaço verde. Respondemos em até 24 horas.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
                <Link
                  href="/login"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    backgroundColor: "#ffffff", color: "#1a5c2e",
                    padding: "13px 28px", borderRadius: 999,
                    fontSize: 14, fontWeight: 700,
                    textDecoration: "none",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 20px #00000033",
                  }}
                >
                  Criar conta grátis
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
                <Link
                  href="mailto:contato@arborea.com.br"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    backgroundColor: "transparent", color: "#ffffff",
                    padding: "13px 28px", borderRadius: 999,
                    fontSize: 14, fontWeight: 600,
                    textDecoration: "none",
                    border: "1.5px solid #ffffff44",
                    transition: "all 0.2s",
                  }}
                >
                  <Mail style={{ width: 14, height: 14 }} />
                  Falar com a equipe
                </Link>
              </div>

              {/* Trust items */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 32, flexWrap: "wrap",
                }}
              >
                {[
                  "14 dias grátis",
                  "Sem cartão de crédito",
                  "Cancele quando quiser",
                  "Suporte em português",
                ].map((item, i) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      backgroundColor: "#2d8a4e44", border: "1px solid #2d8a4e88",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#7dda9e" }} />
                    </div>
                    <span style={{ color: "#ffffffaa", fontSize: 12 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}