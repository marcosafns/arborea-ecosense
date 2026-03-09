"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Thermometer, Droplets, Wind, Leaf, Activity } from "lucide-react";
import { SITE, METRICS } from "@/constants";

const SENSOR_DATA = [
  { icon: Thermometer, label: "Temperatura", value: "23.4°C", delta: "+0.2°", color: "#d4622a", status: "estável" },
  { icon: Droplets,    label: "Umidade Solo", value: "68%",    delta: "↑ ideal", color: "#2a7fd4", status: "ideal" },
  { icon: Wind,        label: "CO₂",          value: "412ppm", delta: "↓ baixo", color: "#2ab5a0", status: "normal" },
  { icon: Leaf,        label: "pH do Solo",   value: "6.8pH",  delta: "estável", color: "#7a2ad4", status: "ok" },
];

export default function Hero() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);

  // Sparkline animado no canvas
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "#1a5c2e18";
    ctx.lineWidth   = 1;
    for (let i = 0; i < 6; i++) {
      const y = (H / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Generate wave
    const points: [number, number][] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const x = (W / steps) * i;
      const y = H / 2
        + Math.sin(i * 0.4 + tick * 0.5) * (H * 0.18)
        + Math.sin(i * 0.9 + tick * 0.3) * (H * 0.09)
        + Math.cos(i * 0.2 + tick * 0.8) * (H * 0.06);
      points.push([x, y]);
    }

    // Fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   "#1a5c2e28");
    grad.addColorStop(0.6, "#1a5c2e08");
    grad.addColorStop(1,   "transparent");
    ctx.beginPath();
    ctx.moveTo(0, H);
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(W, H);
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.strokeStyle = "#1a5c2e88";
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Dots
    points.filter((_, i) => i % 8 === 0).forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle   = "#2d8a4e";
      ctx.fill();
      ctx.strokeStyle = "#ffffff44";
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });
  }, [tick]);

  return (
    <section
      style={{ backgroundColor: "var(--bg)", minHeight: "100vh", overflow: "hidden" }}
      className="relative flex flex-col items-center justify-center px-6 pt-28 pb-16"
    >
      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none" style={{ overflow: "hidden" }}>
        {/* Radial glow */}
        <div style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 900, height: 700,
          background: "radial-gradient(ellipse, #1a5c2e1a 0%, transparent 65%)",
          borderRadius: "50%",
        }} />
        {/* Top corner accent */}
        <div style={{
          position: "absolute", top: -100, right: -100,
          width: 400, height: 400,
          background: "radial-gradient(circle, #2d8a4e0d 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
        {/* Bottom left accent */}
        <div style={{
          position: "absolute", bottom: 0, left: -80,
          width: 300, height: 300,
          background: "radial-gradient(circle, #1a5c2e0a 0%, transparent 70%)",
          borderRadius: "50%",
        }} />

        {/* Animated canvas background */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            width: "100%", height: "40%", opacity: 0.6,
          }}
        />
      </div>

      {/* Floating sensor cards — left */}
      <div
        className="hidden xl:block"
        style={{
          position: "absolute", left: "5%", top: "30%",
          animation: "floatA 5s ease-in-out infinite",
        }}
      >
        <SensorFloatCard {...SENSOR_DATA[0]} delay={0} />
      </div>
      <div
        className="hidden xl:block"
        style={{
          position: "absolute", left: "3%", top: "55%",
          animation: "floatB 6s ease-in-out infinite 1s",
        }}
      >
        <SensorFloatCard {...SENSOR_DATA[2]} delay={200} />
      </div>

      {/* Floating sensor cards — right */}
      <div
        className="hidden xl:block"
        style={{
          position: "absolute", right: "5%", top: "28%",
          animation: "floatB 5.5s ease-in-out infinite 0.5s",
        }}
      >
        <SensorFloatCard {...SENSOR_DATA[1]} delay={100} />
      </div>
      <div
        className="hidden xl:block"
        style={{
          position: "absolute", right: "3%", top: "55%",
          animation: "floatA 7s ease-in-out infinite 1.5s",
        }}
      >
        <SensorFloatCard {...SENSOR_DATA[3]} delay={300} />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Badge */}
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            border: "1px solid #1a5c2e44", backgroundColor: "#1a5c2e0d",
            borderRadius: 999, padding: "6px 16px", marginBottom: 32,
            animation: "fadeUp 0.6s ease both",
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            backgroundColor: "#2d8a4e",
            animation: "pulse 2s ease-in-out infinite",
            display: "inline-block",
          }} />
          <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#2d8a4e" }}>
            {SITE.name} · {SITE.product} · Sistema de Monitoramento IoT
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: "var(--text-primary)",
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            marginBottom: 24,
            animation: "fadeUp 0.6s ease 0.1s both",
            fontFamily: "var(--font-syne)",
          }}
        >
          Natureza
          <br />
          <span style={{
            color: "#1a5c2e",
            display: "inline-block",
            position: "relative",
          }}>
            monitorada.
            {/* Underline accent */}
            <svg
              viewBox="0 0 300 12"
              style={{
                position: "absolute", bottom: -6, left: 0, width: "100%",
                opacity: 0.5,
              }}
              preserveAspectRatio="none"
            >
              <path d="M0,8 Q75,0 150,6 Q225,12 300,4" stroke="#2d8a4e" strokeWidth="3" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
          <br />
          Futuro preservado.
        </h1>

        {/* Subheadline */}
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "clamp(1rem, 2vw, 1.15rem)",
            maxWidth: 560, margin: "0 auto 40px",
            lineHeight: 1.7,
            animation: "fadeUp 0.6s ease 0.2s both",
          }}
        >
          Sensores Arduino integrados ao nosso dashboard em tempo real —
          temperatura, umidade, CO₂, pH e muito mais, de qualquer área verde,
          ao alcance de um clique.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 12, flexWrap: "wrap",
            animation: "fadeUp 0.6s ease 0.3s both",
          }}
        >
          <Link
            href="#como-funciona"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              backgroundColor: "#1a5c2e",
              color: "#ffffff",
              padding: "13px 28px", borderRadius: 999,
              fontSize: 14, fontWeight: 600,
              boxShadow: "0 4px 28px #1a5c2e55",
              transition: "all 0.2s",
              textDecoration: "none",
            }}
            className="group"
          >
            Ver como funciona
            <ArrowRight style={{ width: 15, height: 15, transition: "transform 0.2s" }} className="group-hover:translate-x-1" />
          </Link>
          <Link
            href="#planos"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: "1px solid var(--border-hover)",
              color: "var(--text-secondary)",
              padding: "13px 28px", borderRadius: 999,
              fontSize: 14, fontWeight: 500,
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            Ver planos
          </Link>
        </div>

        {/* Live indicator */}
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: 28, color: "var(--text-muted)", fontSize: 12,
            animation: "fadeUp 0.6s ease 0.4s both",
          }}
        >
          <Activity style={{ width: 13, height: 13, color: "#2d8a4e" }} />
          <span>Dados atualizados a cada 30 segundos · Realtime via Supabase</span>
        </div>
      </div>

      {/* Metrics bar */}
      <div
        style={{
          position: "relative", zIndex: 10,
          marginTop: 64, width: "100%", maxWidth: 820,
          animation: "fadeUp 0.6s ease 0.5s both",
        }}
      >
        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            border: "1px solid var(--border)",
            borderRadius: 20, overflow: "hidden",
            backgroundColor: "var(--bg-card)",
            backdropFilter: "blur(16px)",
          }}
        >
          {METRICS.map((m, i) => (
            <div
              key={m.label}
              style={{
                padding: "20px 24px", textAlign: "center",
                borderRight: i < METRICS.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background-color 0.2s",
              }}
            >
              <div style={{
                fontSize: 26, fontWeight: 800, color: "#2d8a4e",
                marginBottom: 4, fontFamily: "var(--font-geist-mono)",
                letterSpacing: "-0.02em",
              }}>
                {m.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </section>
  );
}

function SensorFloatCard({
  icon: Icon, label, value, delta, color, delay,
}: {
  icon: any; label: string; value: string; delta: string; color: string; delay: number;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16, padding: "16px 20px",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px #00000018",
        minWidth: 160,
        animation: `fadeUp 0.6s ease ${delay}ms both`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: `${color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon style={{ width: 13, height: 13, color }} />
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{label}</span>
      </div>
      <div style={{
        color: "var(--text-primary)", fontSize: 22, fontWeight: 700,
        fontFamily: "var(--font-geist-mono)", lineHeight: 1, marginBottom: 6,
      }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          backgroundColor: color, display: "inline-block",
          animation: "pulse 2s ease-in-out infinite",
        }} />
        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{delta}</span>
      </div>
    </div>
  );
}