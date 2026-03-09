"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Reading {
  id: string;
  sensor_id: string;
  value: number;
  is_anomaly: boolean;
  recorded_at: string;
}

interface SensorStats {
  latest: Reading | null;
  history: Reading[];
  todayMax: number | null;
  todayMin: number | null;
  average: number | null;
  isOnline: boolean;
}

interface SensorData {
  [sensorId: string]: SensorStats;
}

const RealtimeContext = createContext<SensorData>({});

export function useRealtimeData() {
  return useContext(RealtimeContext);
}

export default function RealtimeProvider({ children, sensorIds }: {
  children: React.ReactNode;
  sensorIds: string[];
}) {
  const [data, setData] = useState<SensorData>({});
  const supabase        = createClient();

  const computeStats = (readings: Reading[]): Omit<SensorStats, "latest"> => {
    if (!readings.length) return { history: [], todayMax: null, todayMin: null, average: null, isOnline: false };

    const sorted  = [...readings].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    const values  = sorted.map(r => r.value);

    // Hoje
    const today   = new Date();
    today.setHours(0, 0, 0, 0);
    const todayReadings = sorted.filter(r => new Date(r.recorded_at) >= today);
    const todayValues   = todayReadings.map(r => r.value);

    // Online se última leitura foi há menos de 2 minutos
    const lastTime  = new Date(sorted[sorted.length - 1].recorded_at).getTime();
    const isOnline  = Date.now() - lastTime < 2 * 60 * 1000;

    return {
      history:  sorted.slice(-30),
      todayMax: todayValues.length ? Math.max(...todayValues) : null,
      todayMin: todayValues.length ? Math.min(...todayValues) : null,
      average:  values.length ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : null,
      isOnline,
    };
  };

  const fetchInitial = useCallback(async () => {
    if (!sensorIds.length) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: readings } = await supabase
      .from("readings")
      .select("*")
      .in("sensor_id", sensorIds)
      .gte("recorded_at", todayStart.toISOString())
      .order("recorded_at", { ascending: false })
      .limit(100 * sensorIds.length);

    if (!readings) return;

    const grouped: SensorData = {};
    for (const id of sensorIds) {
      const sensorReadings = readings.filter(r => r.sensor_id === id);
      const latest = sensorReadings[0] ?? null;
      grouped[id] = {
        latest,
        ...computeStats(sensorReadings),
      };
    }
    setData(grouped);
  }, [sensorIds]);

  useEffect(() => {
    fetchInitial();

    // Re-checar online status a cada 60s
    const onlineCheck = setInterval(() => {
      setData(prev => {
        const updated = { ...prev };
        for (const id of Object.keys(updated)) {
          const latest = updated[id].latest;
          if (latest) {
            const lastTime = new Date(latest.recorded_at).getTime();
            updated[id] = { ...updated[id], isOnline: Date.now() - lastTime < 2 * 60 * 1000 };
          }
        }
        return updated;
      });
    }, 60000);

    const channel = supabase
      .channel("readings-live")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "readings",
      }, (payload) => {
        const reading = payload.new as Reading;
        if (!sensorIds.includes(reading.sensor_id)) return;

        setData(prev => {
          const current = prev[reading.sensor_id] ?? { latest: null, history: [], todayMax: null, todayMin: null, average: null, isOnline: false };
          const newHistory = [...current.history, reading];
          const stats = computeStats(newHistory);
          return {
            ...prev,
            [reading.sensor_id]: { latest: reading, ...stats },
          };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(onlineCheck);
    };
  }, [sensorIds]);

  return (
    <RealtimeContext.Provider value={data}>
      {children}
    </RealtimeContext.Provider>
  );
}