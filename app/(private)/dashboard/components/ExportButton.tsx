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
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState<Format | null>(null);
  const [done,    setDone]    = useState<Format | null>(null);
  const supabase = createClient();

  const fetchData = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let sensorsQuery = supabase.from("sensors").select("id, type, label, unit, station_id, stations(name)");
    if (sensorIds.length) sensorsQuery = sensorsQuery.in("id", sensorIds);
    else if (stationId)   sensorsQuery = sensorsQuery.eq("station_id", stationId);
    const { data: sensors } = await sensorsQuery;

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

  // ── CSV (unchanged) ──────────────────────────────────────────────────────────
  const exportCSV = async () => {
    setLoading("csv"); setOpen(false);
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
          s.label ?? "—", s.type ?? "—",
          r.value.toFixed(2), s.unit ?? "—",
          r.is_anomaly ? "Sim" : "Não",
        ];
      }),
    ];

    const csv  = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `ecosense_${stationName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(null); setDone("csv");
    setTimeout(() => setDone(null), 3000);
  };

  // ── PDF redesenhado ──────────────────────────────────────────────────────────
  const exportPDF = async () => {
    setLoading("pdf"); setOpen(false);
    const { sensors, readings } = await fetchData();
    const sensorMap: Record<string, any> = {};
    for (const s of sensors) sensorMap[s.id] = s;

    const { default: jsPDF }     = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W    = doc.internal.pageSize.getWidth();   // 210
    const H    = doc.internal.pageSize.getHeight();  // 297
    const now  = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // ── Paleta ──
    const GREEN_DARK  : [number,number,number] = [15,  40,  20];
    const GREEN_MID   : [number,number,number] = [26,  92,  46];
    const GREEN_LIGHT : [number,number,number] = [45, 138,  78];
    const GREEN_PALE  : [number,number,number] = [240,247,242];
    const GRAY_TEXT   : [number,number,number] = [60,  80,  65];
    const GRAY_MUTED  : [number,number,number] = [154,180,162];
    const WHITE       : [number,number,number] = [255,255,255];
    const BORDER      : [number,number,number] = [220,234,222];

    // ────────────────────────────────────────────────────────────────────
    // PÁGINA 1 — CAPA
    // ────────────────────────────────────────────────────────────────────

    // Fundo escuro topo
    doc.setFillColor(...GREEN_DARK);
    doc.rect(0, 0, W, 90, "F");

    // Faixa decorativa verde médio
    doc.setFillColor(...GREEN_MID);
    doc.rect(0, 82, W, 8, "F");

    // Padrão de pontos decorativo (simula grade)
    doc.setFillColor(26, 92, 46);
    for (let x = 8; x < W; x += 12) {
      for (let y = 8; y < 82; y += 12) {
        doc.circle(x, y, 0.4, "F");
      }
    }

    // Ícone folha (círculo + texto)
    doc.setFillColor(...GREEN_MID);
    doc.circle(20, 24, 8, "F");
    doc.setFillColor(...GREEN_LIGHT);
    doc.circle(20, 24, 5.5, "F");
    doc.setFillColor(...WHITE);
    doc.circle(20, 24, 2.5, "F");

    // Nome da empresa
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("ARBOREA INOVAÇÕES", 32, 21);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_MUTED);
    doc.text("EcoSense Platform", 32, 27);

    // Título principal
    doc.setTextColor(...WHITE);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de", 14, 52);
    doc.setTextColor(144, 238, 144);
    doc.text("Monitoramento", 14, 63);

    // Subtítulo
    doc.setTextColor(...GRAY_MUTED);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Análise ambiental via sensores IoT · Últimos 7 dias", 14, 73);

    // Metadados da capa (abaixo da faixa verde)
    const metaY = 100;
    doc.setFillColor(...GREEN_PALE);
    doc.roundedRect(14, metaY, W - 28, 36, 3, 3, "F");
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, metaY, W - 28, 36, 3, 3, "S");

    const metaItems = [
      { label: "Estação",    value: stationName },
      { label: "Data",       value: dateStr },
      { label: "Hora",       value: timeStr },
      { label: "Período",    value: "Últimos 7 dias" },
      { label: "Leituras",   value: readings.length.toLocaleString("pt-BR") },
      { label: "Sensores",   value: `${sensors.length} ativos` },
    ];

    metaItems.forEach((item, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x   = 22 + col * 60;
      const y   = metaY + 10 + row * 14;
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_MUTED);
      doc.text(item.label.toUpperCase(), x, y);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...GRAY_TEXT);
      doc.text(item.value, x, y + 5.5);
    });

    // ── Seção: Resumo por sensor ──────────────────────────────────────────────

    const secY = metaY + 46;

    // Título da seção
    doc.setFillColor(...GREEN_MID);
    doc.rect(14, secY, 3, 7, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREEN_DARK);
    doc.text("Resumo por Sensor", 20, secY + 5.5);

    // Cards de sensor (2 colunas)
    const cardW = (W - 28 - 6) / 2;
    let cardX   = 14;
    let cardY   = secY + 12;
    const cardH = 28;

    const sensorColors: Record<string, [number,number,number]> = {
      temperature:   [212,  98,  42],
      humidity:      [ 42, 127, 212],
      soil_humidity: [ 42, 158,  74],
      luminosity:    [196, 148,  42],
      ph:            [122,  42, 212],
      co2:           [ 42, 181, 160],
      wind:          [196,  42, 138],
      rain:          [ 42,  90, 212],
    };

    sensors.forEach((sensor, i) => {
      if (i > 0 && i % 2 === 0) {
        cardX  = 14;
        cardY += cardH + 5;
        if (cardY + cardH > H - 20) {
          doc.addPage();
          cardY = 20;
        }
      }
      if (i % 2 !== 0) cardX = 14 + cardW + 6;

      const vals      = readings.filter(r => r.sensor_id === sensor.id).map(r => r.value);
      const anomalies = readings.filter(r => r.sensor_id === sensor.id && r.is_anomaly).length;
      const avg       = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const min       = vals.length ? Math.min(...vals) : 0;
      const max       = vals.length ? Math.max(...vals) : 0;
      const color     = sensorColors[sensor.type] ?? GREEN_MID;

      // Card fundo
      doc.setFillColor(...WHITE);
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, cardY, cardW, cardH, 2.5, 2.5, "FD");

      // Barra colorida lateral
      doc.setFillColor(...color);
      doc.roundedRect(cardX, cardY, 3, cardH, 2.5, 2.5, "F");
      doc.rect(cardX + 1.5, cardY, 1.5, cardH, "F"); // quadrar lado direito da barra

      // Nome sensor
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...GRAY_TEXT);
      doc.text(sensor.label, cardX + 7, cardY + 7);

      // Unidade badge
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...color);
      doc.text(sensor.unit, cardX + cardW - 6, cardY + 7, { align: "right" });

      // Stats
      const stats = [
        { l: "Mín", v: `${min.toFixed(1)}` },
        { l: "Média", v: `${avg.toFixed(1)}` },
        { l: "Máx", v: `${max.toFixed(1)}` },
        { l: "Leituras", v: vals.length.toString() },
      ];

      stats.forEach((stat, si) => {
        const sx = cardX + 7 + si * ((cardW - 10) / 4);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...GRAY_MUTED);
        doc.text(stat.l, sx, cardY + 15);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...GRAY_TEXT);
        doc.text(stat.v, sx, cardY + 21);
      });

      // Anomalias badge
      if (anomalies > 0) {
        doc.setFillColor(253, 243, 243);
        doc.setDrawColor(245, 198, 198);
        doc.roundedRect(cardX + 7, cardY + 23, 28, 4, 1, 1, "FD");
        doc.setFontSize(6);
        doc.setTextColor(224, 82, 82);
        doc.setFont("helvetica", "bold");
        doc.text(`⚠ ${anomalies} anomalia${anomalies > 1 ? "s" : ""}`, cardX + 8, cardY + 26.2);
      }
    });

    // ────────────────────────────────────────────────────────────────────
    // PÁGINA 2+ — TABELA DE LEITURAS
    // ────────────────────────────────────────────────────────────────────
    doc.addPage();

    // Header da página 2
    doc.setFillColor(...GREEN_MID);
    doc.rect(0, 0, W, 14, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Arborea EcoSense  ·  Leituras Detalhadas", 14, 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(stationName, W - 14, 9, { align: "right" });

    // Título seção
    doc.setFillColor(...GREEN_MID);
    doc.rect(14, 20, 3, 7, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREEN_DARK);
    doc.text("Leituras Detalhadas", 20, 25.5);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_MUTED);
    doc.text(`${Math.min(readings.length, 500).toLocaleString("pt-BR")} registros · ordenados por data desc`, 20, 31);

    const tableData = readings.slice(0, 500).map(r => {
      const s = sensorMap[r.sensor_id] ?? {};
      return [
        new Date(r.recorded_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }),
        s.label ?? "—",
        s.type  ?? "—",
        `${r.value.toFixed(2)} ${s.unit ?? ""}`.trim(),
        r.is_anomaly ? "⚠ Sim" : "—",
      ];
    });

    autoTable(doc, {
      startY: 36,
      head: [["Data/Hora", "Sensor", "Tipo", "Valor", "Anomalia"]],
      body: tableData,
      theme: "plain",
      headStyles: {
        fillColor: GREEN_DARK,
        textColor: WHITE,
        fontSize: 8,
        fontStyle: "bold",
        cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: GRAY_TEXT,
        cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
      },
      alternateRowStyles: {
        fillColor: GREEN_PALE,
      },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 38 },
        2: { cellWidth: 32 },
        3: { cellWidth: 35, halign: "right", fontStyle: "bold" },
        4: { cellWidth: 20, halign: "center" },
      },
      margin: { left: 14, right: 14 },
      // Linha colorida na anomalia
      willDrawCell: (data: any) => {
        if (data.section === "body" && data.column.index === 4 && data.cell.raw === "⚠ Sim") {
          doc.setTextColor(224, 82, 82);
        } else if (data.section === "body") {
          doc.setTextColor(...GRAY_TEXT);
        }
      },
      didDrawPage: (data: any) => {
        // Rodapé em todas as páginas
        doc.setFillColor(...GREEN_PALE);
        doc.rect(0, H - 10, W, 10, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...GRAY_MUTED);
        doc.text("Arborea Inovações  ·  EcoSense Platform", 14, H - 4);
        doc.text(
          `Gerado em ${dateStr} às ${timeStr}  ·  Página ${data.pageNumber}`,
          W - 14, H - 4, { align: "right" }
        );
      },
    });

    doc.save(`ecosense_${stationName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
    setLoading(null); setDone("pdf");
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
          border: "1px solid #c8e0cf", backgroundColor: "#ffffff",
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
              backgroundColor: "#ffffff", border: "1px solid #e8ede9",
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
              { id: "csv" as Format, label: "Exportar CSV", description: "Planilha · Excel / Google Sheets", icon: Table, action: exportCSV },
              { id: "pdf" as Format, label: "Exportar PDF", description: "Relatório profissional com resumo", icon: FileText, action: exportPDF },
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
                  border: "none", borderTop: i > 0 ? "1px solid #f0f4f1" : "none",
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