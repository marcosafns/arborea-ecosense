"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Radio, BarChart2, Bell, LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

interface EmptyStateProps {
  icon:        LucideIcon;
  title:       string;
  description: string;
  action?:     { label: string; href?: string; onClick?: () => void };
  color?:      string;
}

export default function EmptyState({
  icon: Icon, title, description, action,
  color = "#1a5c2e",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "80px 24px", textAlign: "center",
      }}
    >
      {/* Ícone com pulso */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          backgroundColor: `${color}0d`,
          border: `1px solid ${color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon style={{ width: 28, height: 28, color: `${color}88` }} />
        </div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            position: "absolute", inset: -8,
            borderRadius: "50%", border: `1px solid ${color}22`,
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}
          style={{
            position: "absolute", inset: -16,
            borderRadius: "50%", border: `1px solid ${color}14`,
          }}
        />
      </div>

      <h3 style={{
        color: "#0f1f12", fontSize: 16, fontWeight: 700,
        marginBottom: 8, fontFamily: "var(--font-syne)",
      }}>
        {title}
      </h3>
      <p style={{
        color: "#9ab4a2", fontSize: 13, lineHeight: 1.7,
        maxWidth: 320, marginBottom: action ? 24 : 0,
      }}>
        {description}
      </p>

      {action && (
        action.href ? (
          <Link
            href={action.href}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              backgroundColor: color, color: "#ffffff",
              padding: "10px 20px", borderRadius: 999,
              fontSize: 13, fontWeight: 600,
              textDecoration: "none",
              boxShadow: `0 4px 16px ${color}44`,
            }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              backgroundColor: color, color: "#ffffff",
              padding: "10px 20px", borderRadius: 999,
              fontSize: 13, fontWeight: 600,
              border: "none", cursor: "pointer",
              boxShadow: `0 4px 16px ${color}44`,
            }}
          >
            {action.label}
          </button>
        )
      )}
    </motion.div>
  );
}

// Presets prontos para cada página
export const EMPTY_STATES = {
  dashboard: {
    icon:        LayoutDashboard,
    title:       "Nenhuma estação ativa",
    description: "Você ainda não tem estações ativas. Crie uma para começar a monitorar suas áreas verdes.",
    action:      { label: "Criar primeira estação", href: "/dashboard/stations" },
    color:       "#1a5c2e",
  },
  stations: {
    icon:        Radio,
    title:       "Nenhuma estação cadastrada",
    description: "Crie sua primeira estação de monitoramento para começar a coletar dados dos seus sensores.",
    color:       "#1a5c2e",
  },
  alerts: {
    icon:        Bell,
    title:       "Nenhum alerta encontrado",
    description: "Tudo certo por aqui! Seus sensores estão operando dentro das faixas esperadas.",
    color:       "#1a5c2e",
  },
  alertsFiltered: {
    icon:        Bell,
    title:       "Nenhum alerta neste filtro",
    description: "Não há alertas correspondentes ao filtro selecionado. Tente outro período.",
    color:       "#9ab4a2",
  },
  charts: {
    icon:        BarChart2,
    title:       "Sem leituras ainda",
    description: "Nenhuma leitura registrada no período selecionado. Verifique se o simulador está rodando.",
    action:      { label: "Ver estações", href: "/dashboard/stations" },
    color:       "#2a7fd4",
  },
} as const;