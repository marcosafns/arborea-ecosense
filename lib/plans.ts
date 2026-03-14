// lib/plans.ts
// Configuração central dos planos — fonte única da verdade

export type PlanId = "semente" | "broto" | "floresta" | "ecossistema";

export interface PlanConfig {
  id:            PlanId;
  name:          string;
  maxStations:   number;          // -1 = ilimitado
  maxSensors:    number;          // total de sensores (todas as estações)
  historyDays:   number;          // -1 = ilimitado
  canExportCSV:  boolean;
  canExportPDF:  boolean;
  canAccessAPI:  boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  semente: {
    id:           "semente",
    name:         "Semente",
    maxStations:  1,
    maxSensors:   4,
    historyDays:  7,
    canExportCSV: false,
    canExportPDF: false,
    canAccessAPI: false,
  },
  broto: {
    id:           "broto",
    name:         "Broto",
    maxStations:  3,
    maxSensors:   16,
    historyDays:  30,
    canExportCSV: true,
    canExportPDF: false,
    canAccessAPI: false,
  },
  floresta: {
    id:           "floresta",
    name:         "Floresta",
    maxStations:  10,
    maxSensors:   -1,
    historyDays:  365,
    canExportCSV: true,
    canExportPDF: true,
    canAccessAPI: true,
  },
  ecossistema: {
    id:           "ecossistema",
    name:         "Ecossistema",
    maxStations:  -1,
    maxSensors:   -1,
    historyDays:  -1,
    canExportCSV: true,
    canExportPDF: true,
    canAccessAPI: true,
  },
};

/** Retorna o config do plano, com fallback para semente */
export function getPlan(planId: string | null | undefined): PlanConfig {
  return PLANS[(planId as PlanId) ?? "semente"] ?? PLANS.semente;
}

/** Checa se o usuário atingiu o limite de estações */
export function canAddStation(planId: string, currentCount: number): boolean {
  const plan = getPlan(planId);
  if (plan.maxStations === -1) return true;
  return currentCount < plan.maxStations;
}

/** Checa se o usuário atingiu o limite de sensores */
export function canAddSensor(planId: string, currentCount: number): boolean {
  const plan = getPlan(planId);
  if (plan.maxSensors === -1) return true;
  return currentCount < plan.maxSensors;
}

/** Retorna a data mínima permitida para consultar histórico */
export function getHistoryStartDate(planId: string): Date {
  const plan = getPlan(planId);
  if (plan.historyDays === -1) return new Date(0); // sem limite
  const d = new Date();
  d.setDate(d.getDate() - plan.historyDays);
  return d;
}