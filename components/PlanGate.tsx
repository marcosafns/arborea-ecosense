// components/PlanGate.tsx
// Componente que bloqueia acesso a features fora do plano
// Uso: <PlanGate feature="canExportPDF" plan={plan}> ... </PlanGate>

"use client";

import { type PlanConfig } from "@/lib/plans";
import { Lock } from "lucide-react";
import Link from "next/link";

interface Props {
  /** Qual feature verificar */
  feature: keyof Pick<PlanConfig, "canExportCSV" | "canExportPDF" | "canAccessAPI">;
  plan: PlanConfig;
  children: React.ReactNode;
  /** Mensagem personalizada (opcional) */
  message?: string;
}

const FEATURE_LABELS: Record<string, string> = {
  canExportCSV: "Exportação CSV",
  canExportPDF: "Exportação PDF",
  canAccessAPI: "Acesso à API",
};

const UPGRADE_PLAN: Record<string, string> = {
  canExportCSV: "Broto",
  canExportPDF: "Floresta",
  canAccessAPI: "Floresta",
};

export default function PlanGate({ feature, plan, children, message }: Props) {
  const allowed = plan[feature] as boolean;

  if (allowed) return <>{children}</>;

  const label   = FEATURE_LABELS[feature] ?? feature;
  const upgrade = UPGRADE_PLAN[feature] ?? "superior";

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
      title={`${label} disponível no plano ${upgrade} ou superior`}
    >
      {/* Renderiza o filho com opacidade reduzida e pointer-events desabilitado */}
      <div style={{ opacity: 0.4, pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>

      {/* Badge de upgrade sobreposto */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "not-allowed",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          backgroundColor: "#ffffff",
          border: "1px solid #e8ede9",
          borderRadius: 999, padding: "4px 10px",
          boxShadow: "0 2px 8px #0f1f1210",
          pointerEvents: "auto",
        }}>
          <Lock style={{ width: 10, height: 10, color: "#9ab4a2" }} />
          <Link
            href="/dashboard/settings"
            style={{ fontSize: 10, color: "#1a5c2e", fontWeight: 600, textDecoration: "none" }}
            title={message ?? `Disponível no plano ${upgrade}`}
          >
            Plano {upgrade}
          </Link>
        </div>
      </div>
    </div>
  );
}