// lib/plans.ts
// Fonte única da verdade — usa os UUIDs reais da tabela plans no Supabase

export type PlanId =
  | "e5b80744-8483-4b0c-bf83-d6690d42e158"   // Semente
  | "d0458250-269b-4a64-8c0a-04c762e695cf"   // Broto
  | "1f08e0ff-e0ce-4c36-a357-743de6217b3f"   // Floresta
  | "18f57818-8da6-4e24-96a8-c03f43a7854c";  // Ecossistema

export type PlanSlug = "semente" | "broto" | "floresta" | "ecossistema";

export interface PlanConfig {
  id:           PlanId;
  slug:         PlanSlug;
  name:         string;
  maxStations:  number;   // -1 = ilimitado
  maxSensors:   number;   // -1 = ilimitado
  historyDays:  number;   // -1 = ilimitado
  canExportCSV: boolean;
  canExportPDF: boolean;
  canAccessAPI: boolean;
  color:        string;
  bg:           string;
  border:       string;
}

// UUID do plano padrão para novas contas
export const DEFAULT_PLAN_ID: PlanId = "e5b80744-8483-4b0c-bf83-d6690d42e158";

export const PLANS: Record<PlanId, PlanConfig> = {
  "e5b80744-8483-4b0c-bf83-d6690d42e158": {
    id:           "e5b80744-8483-4b0c-bf83-d6690d42e158",
    slug:         "semente",
    name:         "Semente",
    maxStations:  1,
    maxSensors:   4,
    historyDays:  7,
    canExportCSV: false,
    canExportPDF: false,
    canAccessAPI: false,
    color:        "#7aaa8a",
    bg:           "#f0f7f2",
    border:       "#c8e0cf",
  },
  "d0458250-269b-4a64-8c0a-04c762e695cf": {
    id:           "d0458250-269b-4a64-8c0a-04c762e695cf",
    slug:         "broto",
    name:         "Broto",
    maxStations:  3,
    maxSensors:   16,
    historyDays:  30,
    canExportCSV: true,
    canExportPDF: false,
    canAccessAPI: false,
    color:        "#2a7fd4",
    bg:           "#f0f5fd",
    border:       "#c8d8f5",
  },
  "1f08e0ff-e0ce-4c36-a357-743de6217b3f": {
    id:           "1f08e0ff-e0ce-4c36-a357-743de6217b3f",
    slug:         "floresta",
    name:         "Floresta",
    maxStations:  10,
    maxSensors:   -1,
    historyDays:  365,
    canExportCSV: true,
    canExportPDF: true,
    canAccessAPI: true,
    color:        "#1a5c2e",
    bg:           "#f0f7f2",
    border:       "#1a5c2e",
  },
  "18f57818-8da6-4e24-96a8-c03f43a7854c": {
    id:           "18f57818-8da6-4e24-96a8-c03f43a7854c",
    slug:         "ecossistema",
    name:         "Ecossistema",
    maxStations:  -1,
    maxSensors:   -1,
    historyDays:  -1,
    canExportCSV: true,
    canExportPDF: true,
    canAccessAPI: true,
    color:        "#7a2ad4",
    bg:           "#f5f0fd",
    border:       "#d4b8f5",
  },
};

/** Retorna o config do plano pelo UUID, com fallback para Semente */
export function getPlan(planId: string | null | undefined): PlanConfig {
  return PLANS[planId as PlanId] ?? PLANS[DEFAULT_PLAN_ID];
}

/** Checa se pode adicionar mais estações */
export function canAddStation(planId: string, currentCount: number): boolean {
  const plan = getPlan(planId);
  if (plan.maxStations === -1) return true;
  return currentCount < plan.maxStations;
}

/** Checa se pode adicionar mais sensores */
export function canAddSensor(planId: string, currentCount: number): boolean {
  const plan = getPlan(planId);
  if (plan.maxSensors === -1) return true;
  return currentCount < plan.maxSensors;
}

/** Retorna a data mínima permitida para histórico */
export function getHistoryStartDate(planId: string): Date {
  const plan = getPlan(planId);
  if (plan.historyDays === -1) return new Date(0);
  const d = new Date();
  d.setDate(d.getDate() - plan.historyDays);
  return d;
}