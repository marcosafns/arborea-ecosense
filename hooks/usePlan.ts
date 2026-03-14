// hooks/usePlan.ts
// Hook que carrega o plano do usuário e expõe os limites

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPlan, type PlanConfig } from "@/lib/plans";

interface UsePlanReturn {
  plan:          PlanConfig;
  planId:        string;
  loading:       boolean;
  // limites prontos para usar nos componentes:
  stationsLeft:  number | null;   // null = ilimitado
  sensorsLeft:   number | null;   // null = ilimitado
}

export function usePlan(): UsePlanReturn {
  const supabase = createClient();
  const [planId,   setPlanId]   = useState<string>("semente");
  const [loading,  setLoading]  = useState(true);

  // Contadores para exibir "restam X slots"
  const [stationCount, setStationCount] = useState(0);
  const [sensorCount,  setSensorCount]  = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Busca plano do cliente
      const { data: client } = await supabase
        .from("clients")
        .select("plan_id")
        .eq("id", user.id)
        .single();

      const id = client?.plan_id ?? "semente";
      setPlanId(id);

      // Conta estações e sensores atuais
      const { count: stCount } = await supabase
        .from("stations")
        .select("*", { count: "exact", head: true })
        .eq("client_id", user.id);

      const { data: stations } = await supabase
        .from("stations")
        .select("id")
        .eq("client_id", user.id);

      const stationIds = (stations ?? []).map((s: any) => s.id);
      let snCount = 0;
      if (stationIds.length) {
        const { count } = await supabase
          .from("sensors")
          .select("*", { count: "exact", head: true })
          .in("station_id", stationIds);
        snCount = count ?? 0;
      }

      setStationCount(stCount ?? 0);
      setSensorCount(snCount);
      setLoading(false);
    };

    load();
  }, []);

  const plan = getPlan(planId);

  const stationsLeft = plan.maxStations === -1
    ? null
    : Math.max(0, plan.maxStations - stationCount);

  const sensorsLeft = plan.maxSensors === -1
    ? null
    : Math.max(0, plan.maxSensors - sensorCount);

  return { plan, planId, loading, stationsLeft, sensorsLeft };
}