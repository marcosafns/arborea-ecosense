"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, FileText, Table, ChevronDown, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  stationId?: string;
  stationName?: string;
  sensorIds?: string[];
}

type Format = "csv" | "pdf";

export default function ExportButton({ stationId, stationName = "Arborea EcoSense", sensorIds = [] }: Props) {
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState<Format | null>(null);
  const [done,     setDone]     = useState<Format | null>(null);
  const supabase = createClient();

  const fetchData = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Buscar sensores
    let sensorsQuery = supabase.from("sensors").select("id, type, label, unit, station_id, stations(name)");
    if (sensorIds.length)  sensorsQuery = sensorsQuery.in("id", sensorIds);
    else if (stationId)    sensorsQuery = sensorsQuery.eq("station_id", stationId);
    const { data: sensors } = await sensorsQuery;

    // Buscar leituras
    const ids = sensors?.map(s => s.id) ?? [];
    const { data: readings } = await supabase
      .from("readings")
      .select("sensor_id, value, is_anomaly, recorded_at")
      .in("sensor_id", ids)
      .gte("recorded_at", sevenDaysAgo)
      .order("recorded_at", { ascending: false })
      .limit(5000);

    return { sensors: sensors ?? [], readings: readings ?? [] };
  };

  const exportCSV = async () => {
    setLoading("csv");
    setOpen(false);

    const { sensors, readings } = await fetchData();

    const sensorMap: Record<string, any> = {};
    for (const s of sensors) sensorMap[s.id] = s;

    const rows = [
      ["Data/Hora", "Estação", "Sensor", "Tipo", "Valor", "Unidade", "Anomalia"],
      ...readings.map(r => {
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

    const csv     = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob    = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement("a");
    a.href        = url;
    a.download    = `ecosense_${stationName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setLoading(null);
    setDone("csv");
    setTimeout(() => setDone(null), 3000);
  };

  const exportPDF = async () => {
    setLoading("pdf");
    setOpen(false);

    const { sensors, readings } = await fetchData();
    const sensorMap: Record<string, any> = {};
    for (const s of sensors) sensorMap[s.id] = s;

    const { default: jsPDF }    = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc  = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const now  = new Date().toLocaleString("pt-BR");
    const W    = doc.internal.pageSize.getWidth();

    // Header
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

    // Subtítulo
    doc.setTextColor(60, 80, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Estação: ${stationName}`, 14, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 140, 120);
    doc.text(`Período: últimos 7 dias  ·  ${readings.length} leituras  ·  ${sensors.length} sensores`, 14, 36);

    // Resumo por sensor
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 60, 40);
    doc.text("Resumo por sensor", 14, 46);

    const summaryData = sensors.map(s => {
      const vals = readings.filter(r => r.sensor_id === s.id).map(r => r.value);
      const anomalies = readings.filter(r => r.sensor_id === s.id && r.is_anomaly).length;
      return [
        s.label,
        s.type,
        s.unit,
        vals.length.toString(),
        vals.length ? Math.min(...vals).toFixed(2) : "—",
        vals.length ? Math.max(...vals).toFixed(2) : "—",
        vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : "—",
        anomalies.toString(),
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [["Sensor", "Tipo", "Unidade", "Leituras", "Mín", "Máx", "Média", "Anomalias"]],
      body: summaryData,
      theme: "grid",
      headStyles: {
        fillColor: [26, 92, 46],
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles:     { fontSize: 8, textColor: [40, 60, 40] },
      alternateRowStyles: { fillColor: [245, 250, 246] },
      margin: { left: 14, right: 14 },
    });

    // Tabela de leituras
    const afterSummary = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 60, 40);
    doc.text("Leituras detalhadas (máx. 500)", 14, afterSummary);

    const tableData = readings.slice(0, 500).map(r => {
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
      headStyles: {
        fillColor: [26, 92, 46],
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles:     { fontSize: 7.5, textColor: [40, 60, 40] },
      alternateRowStyles: { fillColor: [245, 250, 246] },
      margin: { left: 14, right: 14 },
      didDrawPage: (data: any) => {
        // Rodapé em cada página
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(180, 200, 180);
        doc.text(
          `Arborea EcoSense  ·  Página ${data.pageNumber}`,
          W / 2, pageH - 6,
          { align: "center" }
        );
      },
    });

    doc.save(`ecosense_${stationName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);

    setLoading(null);
    setDone("pdf");
    setTimeout(() => setDone(null), 3000);
  };

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
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
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
              minWidth: 200, zIndex: 50,
            }}
          >
            <div style={{ padding: "8px 12px 4px" }}>
              <span style={{ fontSize: 10, color: "#b0c4b8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                Formato
              </span>
            </div>

            {[
              {
                id:          "csv" as Format,
                label:       "Exportar CSV",
                description: "Planilha · Excel / Google Sheets",
                icon:        Table,
                action:      exportCSV,
              },
              {
                id:          "pdf" as Format,
                label:       "Exportar PDF",
                description: "Relatório com gráficos e resumo",
                icon:        FileText,
                action:      exportPDF,
              },
            ].map((opt, i) => (
              <motion.button
                key={opt.id}
                whileHover={{ backgroundColor: "#f7faf8" }}
                whileTap={{ scale: 0.98 }}
                onClick={opt.action}
                disabled={!!loading}
                style={{
                  width: "100%", padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 12,
                  border: "none",
                  borderTop: i > 0 ? "1px solid #f0f4f1" : "none",
                  backgroundColor: "transparent",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "left", opacity: loading ? 0.6 : 1,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <opt.icon style={{ width: 14, height: 14, color: "#1a5c2e" }} />
                </div>
                <div>
                  <div style={{ color: "#0f1f12", fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
                  <div style={{ color: "#9ab4a2", fontSize: 11 }}>{opt.description}</div>
                </div>
              </motion.button>
            ))}

            <div style={{ padding: "8px 14px 10px", borderTop: "1px solid #f0f4f1" }}>
              <span style={{ color: "#c8d8ce", fontSize: 10 }}>
                Últimos 7 dias · máx. 5.000 leituras
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}