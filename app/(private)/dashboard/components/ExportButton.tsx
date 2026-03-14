"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, FileText, Table, ChevronDown, Loader2, Check, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePlan } from "@/hooks/usePlan";
import { getPlan, getHistoryStartDate } from "@/lib/plans";
import Link from "next/link";

interface Props {
  stationId?: string;
  stationName?: string;
  sensorIds?: string[];
}

type Format = "csv" | "pdf";

export default function ExportButton({ stationId, stationName = "Arborea EcoSense", sensorIds = [] }: Props) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState<Format | null>(null);
  const [done,    setDone]    = useState<Format | null>(null);
  const supabase = createClient();
  const { plan } = usePlan();

  const fetchData = async () => {
    // Respeita historyDays do plano
    const startDate = getHistoryStartDate(plan.id).toISOString();

    let sensorsQuery = supabase.from("sensors").select("id, type, label, unit, station_id, stations(name)");
    if (sensorIds.length)  sensorsQuery = sensorsQuery.in("id", sensorIds);
    else if (stationId)    sensorsQuery = sensorsQuery.eq("station_id", stationId);
    const { data: sensors } = await sensorsQuery;

    const ids = sensors?.map((s: any) => s.id) ?? [];
    const { data: readings } = await supabase
      .from("readings")
      .select("sensor_id, value, is_anomaly, recorded_at")
      .in("sensor_id", ids)
      .gte("recorded_at", startDate)   // ← respeita limite do plano
      .order("recorded_at", { ascending: false })
      .limit(5000);

    return { sensors: sensors ?? [], readings: readings ?? [] };
  };

  const exportCSV = async () => {
    if (!plan.canExportCSV) return;
    setLoading("csv");
    setOpen(false);

    const { sensors, readings } = await fetchData();
    const sensorMap: Record<string, any> = {};
    for (const s of sensors) sensorMap[s.id] = s;

    const rows = [
      ["Data/Hora", "Estação", "Sensor", "Tipo", "Valor", "Unidade", "Anomalia"],
      ...readings.map((r: any) => {
        const s = sensorMap[r.sensor_id] ?? {};
        return [
          new Date(r.recorded_at).toLocaleString("pt-BR"),
          (s.stations as any)?.name ?? stationName,
          s.label ?? "—",
          s.type  ?? "—",
          r.value.toFixed(2),
          s.unit  ?? "—",
          r.is_anomaly ? "Sim" : "Não",
        ];
      }),
    ];

    const csv  = rows.map((r: any) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `ecosense_${stationName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setLoading(null);
    setDone("csv");
    setTimeout(() => setDone(null), 3000);
  };

  const exportPDF = async () => {
    if (!plan.canExportPDF) return;
    setLoading("pdf");
    setOpen(false);

    const { sensors, readings } = await fetchData();
    const sensorMap: Record<string, any> = {};
    for (const s of sensors) sensorMap[s.id] = s;

    const { default: jsPDF }     = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const now  = new Date().toLocaleString("pt-BR");
    const W    = doc.internal.pageSize.getWidth();

    doc.setFillColor(26, 92, 46);
    doc.rect(0, 0, W, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Arborea EcoSense", 14, 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório de Leituras de Sensores", 14, 16);
    doc.text(`Gerado em: ${now}`, W - 14, 16, { align: "right" });

    doc.setTextColor(60, 80, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Estação: ${stationName}`, 14, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 140, 120);

    const planLabel = plan.historyDays === -1 ? "histórico ilimitado" : `últimos ${plan.historyDays} dias`;
    doc.text(`Período: ${planLabel}  ·  ${readings.length} leituras  ·  ${sensors.length} sensores`, 14, 36);

    const summaryData = sensors.map((s: any) => {
      const vals      = readings.filter((r: any) => r.sensor_id === s.id).map((r: any) => r.value);
      const anomalies = readings.filter((r: any) => r.sensor_id === s.id && r.is_anomaly).length;
      return [
        s.label, s.type, s.unit,
        vals.length.toString(),
        vals.length ? Math.min(...vals).toFixed(2) : "—",
        vals.length ? Math.max(...vals).toFixed(2) : "—",
        vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(2) : "—",
        anomalies.toString(),
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [["Sensor", "Tipo", "Unidade", "Leituras", "Mín", "Máx", "Média", "Anomalias"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [26, 92, 46], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [40, 60, 40] },
      alternateRowStyles: { fillColor: [245, 250, 246] },
      margin: { left: 14, right: 14 },
    });

    const afterSummary = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 60, 40);
    doc.text("Leituras detalhadas (máx. 500)", 14, afterSummary);

    const tableData = readings.slice(0, 500).map((r: any) => {
      const s = sensorMap[r.sensor_id] ?? {};
      return [
        new Date(r.recorded_at).toLocaleString("pt-BR"),
        (s.stations as any)?.name ?? stationName,
        s.label ?? "—",
        s.type  ?? "—",
        `${r.value.toFixed(2)} ${s.unit ?? ""}`,
        r.is_anomaly ? "⚠ Sim" : "Não",
      ];
    });

    autoTable(doc, {
      startY: afterSummary + 4,
      head: [["Data/Hora", "Estação", "Sensor", "Tipo", "Valor", "Anomalia"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [26, 92, 46], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 7.5, textColor: [40, 60, 40] },
      alternateRowStyles: { fillColor: [245, 250, 246] },
      margin: { left: 14, right: 14 },
      didDrawPage: (data: any) => {
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(180, 200, 180);
        doc.text(`Arborea EcoSense  ·  Página ${data.pageNumber}`, W / 2, pageH - 6, { align: "center" });
      },
    });

    doc.save(`ecosense_${stationName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);

    setLoading(null);
    setDone("pdf");
    setTimeout(() => setDone(null), 3000);
  };

  // Opções com base no plano
  const options = [
    {
      id:          "csv" as Format,
      label:       "Exportar CSV",
      description: plan.canExportCSV ? "Planilha · Excel / Google Sheets" : `Disponível no plano Broto`,
      icon:        Table,
      action:      exportCSV,
      allowed:     plan.canExportCSV,
    },
    {
      id:          "pdf" as Format,
      label:       "Exportar PDF",
      description: plan.canExportPDF ? "Relatório com gráficos e resumo" : `Disponível no plano Floresta`,
      icon:        FileText,
      action:      exportPDF,
      allowed:     plan.canExportPDF,
    },
  ];

  const historyLabel = plan.historyDays === -1
    ? "histórico ilimitado"
    : `últimos ${plan.historyDays} dias`;

  return (
    <div style={{ position: "relative" }}>
      <motion.button
        whileHover={{ scale: 1.02, backgroundColor: "#f0f7f2" }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(prev => !prev)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "9px 16px", borderRadius: 10,
          border: "1px solid #c8e0cf",
          backgroundColor: "#ffffff",
          color: "#1a5c2e", fontSize: 13, fontWeight: 500,
          cursor: "pointer", transition: "background-color 0.15s",
        }}
      >
        {loading ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
            <Loader2 style={{ width: 14, height: 14 }} />
          </motion.div>
        ) : done ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Check style={{ width: 14, height: 14 }} />
          </motion.div>
        ) : (
          <Download style={{ width: 14, height: 14 }} />
        )}
        {done ? "Exportado!" : "Exportar"}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown style={{ width: 13, height: 13 }} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              backgroundColor: "#ffffff",
              border: "1px solid #e8ede9",
              borderRadius: 12, overflow: "hidden",
              boxShadow: "0 8px 28px #0f1f1214",
              minWidth: 220, zIndex: 50,
            }}
          >
            <div style={{ padding: "8px 12px 4px" }}>
              <span style={{ fontSize: 10, color: "#b0c4b8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                Formato
              </span>
            </div>

            {options.map((opt, i) => (
              <div key={opt.id} style={{ borderTop: i > 0 ? "1px solid #f0f4f1" : "none" }}>
                <motion.button
                  whileHover={{ backgroundColor: opt.allowed ? "#f7faf8" : undefined }}
                  whileTap={{ scale: opt.allowed ? 0.98 : 1 }}
                  onClick={opt.allowed ? opt.action : undefined}
                  disabled={!!loading || !opt.allowed}
                  style={{
                    width: "100%", padding: "10px 14px",
                    display: "flex", alignItems: "center", gap: 12,
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: opt.allowed && !loading ? "pointer" : "not-allowed",
                    textAlign: "left",
                    opacity: opt.allowed ? (loading ? 0.6 : 1) : 1,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    backgroundColor: opt.allowed ? "#f0f7f2" : "#f4f7f4",
                    border: `1px solid ${opt.allowed ? "#c8e0cf" : "#e8ede9"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {opt.allowed
                      ? <opt.icon style={{ width: 14, height: 14, color: "#1a5c2e" }} />
                      : <Lock     style={{ width: 14, height: 14, color: "#c8d8ce" }} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: opt.allowed ? "#0f1f12" : "#b0c4b8", fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
                    <div style={{ color: opt.allowed ? "#9ab4a2" : "#c8d8ce", fontSize: 11 }}>{opt.description}</div>
                  </div>
                  {!opt.allowed && (
                    <Link
                      href="/dashboard/settings"
                      onClick={e => e.stopPropagation()}
                      style={{
                        fontSize: 10, color: "#1a5c2e", fontWeight: 600,
                        backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf",
                        borderRadius: 999, padding: "2px 8px",
                        textDecoration: "none", flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Upgrade
                    </Link>
                  )}
                </motion.button>
              </div>
            ))}

            <div style={{ padding: "8px 14px 10px", borderTop: "1px solid #f0f4f1" }}>
              <span style={{ color: "#c8d8ce", fontSize: 10 }}>
                Plano {plan.name} · {historyLabel} · máx. 5.000 leituras
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}