// hooks/usePlan.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPlan, DEFAULT_PLAN_ID, type PlanConfig } from "@/lib/plans";

interface UsePlanReturn {
  plan:         PlanConfig;
  planId:       string;
  loading:      boolean;
  stationsLeft: number | null;  // null = ilimitado
  sensorsLeft:  number | null;
}

export function usePlan(): UsePlanReturn {
  const supabase = createClient();
  const [planId,       setPlanId]       = useState<string>(DEFAULT_PLAN_ID);
  const [loading,      setLoading]      = useState(true);
  const [stationCount, setStationCount] = useState(0);
  const [sensorCount,  setSensorCount]  = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Busca plan_id (UUID) do cliente
      const { data: client } = await supabase
        .from("clients")
        .select("plan_id")
        .eq("id", user.id)
        .single();

      // Usa o UUID retornado ou o default (Semente)
      const id = client?.plan_id ?? DEFAULT_PLAN_ID;
      setPlanId(id);

      // Conta estações
      const { count: stCount } = await supabase
        .from("stations")
        .select("*", { count: "exact", head: true })
        .eq("client_id", user.id);

      // Conta sensores
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