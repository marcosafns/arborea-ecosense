"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, MapPin, FileText, Tag } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SENSOR_TYPES = [
  { value: "temperature",   label: "Temperatura",     unit: "°C",  min: 15,  max: 35    },
  { value: "humidity",      label: "Umidade do Ar",   unit: "%",   min: 30,  max: 80    },
  { value: "soil_humidity", label: "Umidade do Solo", unit: "%",   min: 20,  max: 70    },
  { value: "luminosity",    label: "Luminosidade",    unit: "lux", min: 100, max: 80000 },
  { value: "ph",            label: "pH do Solo",      unit: "pH",  min: 5.5, max: 7.5   },
  { value: "co2",           label: "CO₂",             unit: "ppm", min: 300, max: 1000  },
  { value: "wind",          label: "Vento",           unit: "m/s", min: 0,   max: 15    },
  { value: "rain",          label: "Precipitação",    unit: "mm",  min: 0,   max: 50    },
];

export default function StationModal({ open, onClose, onCreated }: Props) {
  const supabase = createClient();

  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [latitude, setLat]        = useState("");
  const [longitude, setLng]       = useState("");
  const [selectedSensors, setSensors] = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [step, setStep]           = useState<1 | 2>(1);

  const toggleSensor = (type: string) => {
    setSensors(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const reset = () => {
    setName(""); setDesc(""); setLat(""); setLng("");
    setSensors([]); setError(""); setStep(1);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Nome da estação é obrigatório."); return; }
    if (!selectedSensors.length) { setError("Selecione ao menos 1 sensor."); return; }

    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado.");

      // 1. Criar estação
      const { data: station, error: stErr } = await supabase
        .from("stations")
        .insert({
          client_id:   user.id,
          name:        name.trim(),
          description: description.trim() || null,
          latitude:    latitude ? parseFloat(latitude) : null,
          longitude:   longitude ? parseFloat(longitude) : null,
          status:      "active",
        })
        .select()
        .single();

      if (stErr) throw stErr;

      // 2. Criar sensores
      const sensorsToInsert = selectedSensors.map(type => {
        const meta = SENSOR_TYPES.find(s => s.value === type)!;
        return {
          station_id:   station.id,
          type,
          label:        `Sensor ${meta.label}`,
          unit:         meta.unit,
          min_expected: meta.min,
          max_expected: meta.max,
        };
      });

      const { error: senErr } = await supabase.from("sensors").insert(sensorsToInsert);
      if (senErr) throw senErr;

      onCreated();
      handleClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar estação.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #e8ede9",
    backgroundColor: "#fafcfa",
    color: "#0f1f12",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            backgroundColor: "#0f1f1255",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20, padding: 32,
              width: "100%", maxWidth: 520,
              boxShadow: "0 24px 80px #0f1f1224",
              border: "1px solid #e8ede9",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ color: "#0f1f12", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-syne)", marginBottom: 4 }}>
                  Nova Estação
                </h2>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2].map(s => (
                    <div key={s} style={{
                      height: 3, width: 32, borderRadius: 999,
                      backgroundColor: step >= s ? "#1a5c2e" : "#e8ede9",
                      transition: "background-color 0.3s",
                    }} />
                  ))}
                  <span style={{ color: "#9ab4a2", fontSize: 11, marginLeft: 4 }}>
                    Passo {step} de 2
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "#f0f4f1" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: "1px solid #e8ede9", backgroundColor: "#f7f8f7",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#9ab4a2",
                }}
              >
                <X style={{ width: 15, height: 15 }} />
              </motion.button>
            </div>

            {/* Steps */}
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Nome */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#3d6b4a", display: "block", marginBottom: 6 }}>
                      Nome da estação *
                    </label>
                    <div style={{ position: "relative" }}>
                      <Tag style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#aac4b4" }} />
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="ex: Jardim Norte"
                        style={{ ...inputStyle, paddingLeft: 36 }}
                        onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                        onBlur={e => (e.target.style.borderColor = "#e8ede9")}
                      />
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#3d6b4a", display: "block", marginBottom: 6 }}>
                      Descrição
                    </label>
                    <div style={{ position: "relative" }}>
                      <FileText style={{ position: "absolute", left: 12, top: 12, width: 14, height: 14, color: "#aac4b4" }} />
                      <textarea
                        value={description}
                        onChange={e => setDesc(e.target.value)}
                        placeholder="Descrição opcional da área monitorada..."
                        rows={3}
                        style={{ ...inputStyle, paddingLeft: 36, resize: "none" }}
                        onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                        onBlur={e => (e.target.style.borderColor = "#e8ede9")}
                      />
                    </div>
                  </div>

                  {/* Coordenadas */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#3d6b4a", display: "block", marginBottom: 6 }}>
                      Localização (opcional)
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div style={{ position: "relative" }}>
                        <MapPin style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#aac4b4" }} />
                        <input
                          value={latitude}
                          onChange={e => setLat(e.target.value)}
                          placeholder="Latitude"
                          type="number"
                          style={{ ...inputStyle, paddingLeft: 36 }}
                          onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                          onBlur={e => (e.target.style.borderColor = "#e8ede9")}
                        />
                      </div>
                      <input
                        value={longitude}
                        onChange={e => setLng(e.target.value)}
                        placeholder="Longitude"
                        type="number"
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                        onBlur={e => (e.target.style.borderColor = "#e8ede9")}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <p style={{ color: "#7aaa8a", fontSize: 13, marginBottom: 14 }}>
                    Selecione os sensores desta estação:
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {SENSOR_TYPES.map(sensor => {
                      const active = selectedSensors.includes(sensor.value);
                      return (
                        <motion.button
                          key={sensor.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleSensor(sensor.value)}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: `1.5px solid ${active ? "#1a5c2e" : "#e8ede9"}`,
                            backgroundColor: active ? "#f0f7f2" : "#fafcfa",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.15s",
                          }}
                        >
                          <div style={{ color: active ? "#1a5c2e" : "#0f1f12", fontSize: 13, fontWeight: active ? 600 : 400 }}>
                            {sensor.label}
                          </div>
                          <div style={{ color: active ? "#7aaa8a" : "#b0c4b8", fontSize: 11, marginTop: 2 }}>
                            {sensor.unit}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 12, color: "#9ab4a2", fontSize: 12 }}>
                    {selectedSensors.length} sensor{selectedSensors.length !== 1 ? "es" : ""} selecionado{selectedSensors.length !== 1 ? "s" : ""}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    marginTop: 14, fontSize: 12, padding: "8px 12px",
                    borderRadius: 8, color: "#c0392b",
                    backgroundColor: "#fdf3f3", border: "1px solid #f5c6c6",
                  }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {step === 2 && (
                <motion.button
                  whileHover={{ backgroundColor: "#f0f4f1" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 10,
                    border: "1px solid #e8ede9", backgroundColor: "#fafcfa",
                    color: "#6b8f78", fontSize: 13, fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Voltar
                </motion.button>
              )}
              <motion.button
                whileHover={{ backgroundColor: "#1e6b34" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => step === 1 ? (name.trim() ? setStep(2) : setError("Nome obrigatório.")) : handleSubmit()}
                disabled={loading}
                style={{
                  flex: 2, padding: "11px 0", borderRadius: 10,
                  border: "none",
                  backgroundColor: loading ? "#7aaa8a" : "#1a5c2e",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "background-color 0.2s",
                }}
              >
                {loading && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
                {step === 1 ? "Próximo → Sensores" : "Criar Estação"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}