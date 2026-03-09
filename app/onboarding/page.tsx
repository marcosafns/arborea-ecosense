"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import {
  Leaf, User, Building2, MapPin, Radio,
  Thermometer, Droplets, Wind, Sun, FlaskConical,
  CloudRain, Gauge, Sprout, ArrowRight, ArrowLeft,
  Check, ChevronRight, LayoutDashboard,
} from "lucide-react";

// ─── tipos ───────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5;

const SENSOR_TYPES = [
  { type: "temperature",   label: "Temperatura",     unit: "°C",  icon: Thermometer,  color: "#d4622a", min: 0,   max: 50  },
  { type: "humidity",      label: "Umidade do Ar",   unit: "%",   icon: Droplets,     color: "#2a7fd4", min: 0,   max: 100 },
  { type: "soil_humidity", label: "Umidade do Solo", unit: "%",   icon: Sprout,       color: "#2a9e4a", min: 0,   max: 100 },
  { type: "luminosity",    label: "Luminosidade",    unit: "lux", icon: Sun,          color: "#c4942a", min: 0,   max: 100000 },
  { type: "ph",            label: "pH do Solo",      unit: "pH",  icon: FlaskConical, color: "#7a2ad4", min: 0,   max: 14  },
  { type: "co2",           label: "CO₂",             unit: "ppm", icon: Wind,         color: "#2ab5a0", min: 300, max: 2000 },
  { type: "wind",          label: "Vento",           unit: "m/s", icon: Gauge,        color: "#c42a8a", min: 0,   max: 50  },
  { type: "rain",          label: "Precipitação",    unit: "mm",  icon: CloudRain,    color: "#2a5ad4", min: 0,   max: 200 },
];

const TOUR_STEPS = [
  { icon: LayoutDashboard, title: "Visão Geral",   desc: "Acompanhe todos os seus sensores em tempo real numa única tela, com valores atualizados a cada 30 segundos." },
  { icon: Radio,           title: "Estações",      desc: "Gerencie suas estações de monitoramento, visualize no mapa e acesse o histórico detalhado de cada uma." },
  { icon: Gauge,           title: "Gráficos",      desc: "Explore o histórico de qualquer sensor com gráficos interativos e filtros por período de 1h até 7 dias." },
  { icon: Wind,            title: "Alertas",       desc: "Receba notificações em tempo real quando qualquer sensor sair da faixa esperada ou ficar offline." },
];

// ─── componente principal ─────────────────────────────────
export default function OnboardingPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [step,      setStep]      = useState<Step>(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // Step 1 — perfil
  const [fullName,  setFullName]  = useState("");
  const [company,   setCompany]   = useState("");

  // Step 2 — estação
  const [stationName, setStationName] = useState("");
  const [stationDesc, setStationDesc] = useState("");
  const [latitude,    setLatitude]    = useState("");
  const [longitude,   setLongitude]   = useState("");

  // Step 3 — sensores
  const [selectedSensors, setSelectedSensors] = useState<string[]>(["temperature", "humidity"]);

  // Step 4 — tour
  const [tourStep, setTourStep] = useState(0);

  // IDs criados
  const [stationId, setStationId] = useState("");

  const goTo = (s: Step) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
    setError("");
  };

  // ── handlers ──
  const saveProfile = async () => {
    if (!fullName.trim()) { setError("Digite seu nome completo."); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("clients").upsert({
        id:        user.id,
        email:     user.email,
        full_name: fullName.trim(),
        company:   company.trim(),
      });
    }
    setLoading(false);
    goTo(2);
  };

  const saveStation = async () => {
    if (!stationName.trim()) { setError("Digite o nome da estação."); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: err } = await supabase
      .from("stations")
      .insert({
        client_id:   user.id,
        name:        stationName.trim(),
        description: stationDesc.trim() || null,
        latitude:    latitude  ? parseFloat(latitude)  : null,
        longitude:   longitude ? parseFloat(longitude) : null,
        status:      "active",
      })
      .select("id")
      .single();

    if (err || !data) { setError("Erro ao criar estação. Tente novamente."); setLoading(false); return; }
    setStationId(data.id);
    setLoading(false);
    goTo(3);
  };

  const saveSensors = async () => {
    if (!selectedSensors.length) { setError("Selecione pelo menos um sensor."); return; }
    setLoading(true);

    const sensorsToInsert = selectedSensors.map(type => {
      const s = SENSOR_TYPES.find(st => st.type === type)!;
      return {
        station_id:   stationId,
        type:         s.type,
        label:        `Sensor ${s.label.split(" ")[0]} A`,
        unit:         s.unit,
        min_expected: s.min,
        max_expected: s.max,
        is_active:    true,
      };
    });

    await supabase.from("sensors").insert(sensorsToInsert);
    setLoading(false);
    goTo(4);
  };

  const finishTour = () => goTo(5);

  const goToDashboard = () => router.push("/dashboard");

  const toggleSensor = (type: string) => {
    setSelectedSensors(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // ── progress ──
  const progress = ((step - 1) / 4) * 100;

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "var(--bg, #0a160d)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          backgroundColor: "#1a5c2e",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 6px #1a5c2e22",
        }}>
          <Leaf style={{ width: 17, height: 17, color: "#ffffff" }} />
        </div>
        <span style={{
          color: "#ffffff", fontWeight: 700, fontSize: 16,
          fontFamily: "var(--font-syne, sans-serif)",
        }}>
          Arborea
          <span style={{ color: "#2d8a4e", fontWeight: 400, marginLeft: 4 }}>/ EcoSense</span>
        </span>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ width: "100%", maxWidth: 520, marginBottom: 32 }}
      >
        {/* Step indicators */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                backgroundColor: s < step ? "#1a5c2e" : s === step ? "#1a5c2e" : "#1a2e1e",
                border: `2px solid ${s <= step ? "#1a5c2e" : "#1a2e1e"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
              }}>
                {s < step
                  ? <Check style={{ width: 12, height: 12, color: "#ffffff" }} />
                  : <span style={{ color: s === step ? "#ffffff" : "#2d4a35", fontSize: 11, fontWeight: 600 }}>{s}</span>
                }
              </div>
              {s < 5 && (
                <div style={{
                  width: 60, height: 1,
                  backgroundColor: s < step ? "#1a5c2e" : "#1a2e1e",
                  transition: "background-color 0.3s",
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Bar */}
        <div style={{ height: 2, backgroundColor: "#1a2e1e", borderRadius: 999, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ height: "100%", backgroundColor: "#1a5c2e", borderRadius: 999 }}
          />
        </div>
      </motion.div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 520, position: "relative", overflow: "hidden" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              backgroundColor: "#0f1f12",
              border: "1px solid #1a2e1e",
              borderRadius: 24, padding: "36px",
              boxShadow: "0 24px 80px #00000066",
            }}
          >
            {/* ── STEP 1: Perfil ── */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      backgroundColor: "#1a5c2e22", border: "1px solid #1a5c2e44",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <User style={{ width: 18, height: 18, color: "#2d8a4e" }} />
                    </div>
                    <span style={{ color: "#2d8a4e", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      Passo 1 de 5
                    </span>
                  </div>
                  <h2 style={{ color: "#ffffff", fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: "var(--font-syne, sans-serif)" }}>
                    Bem-vindo ao EcoSense!
                  </h2>
                  <p style={{ color: "#7aaa8a", fontSize: 14, lineHeight: 1.6 }}>
                    Vamos configurar tudo em poucos minutos. Primeiro, nos conte um pouco sobre você.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ color: "#9ab4a2", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>
                      Nome completo *
                    </label>
                    <input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="João Silva"
                      style={{
                        width: "100%", padding: "11px 14px",
                        backgroundColor: "#0a160d", border: "1px solid #1a2e1e",
                        borderRadius: 10, color: "#ffffff", fontSize: 14,
                        outline: "none", fontFamily: "inherit",
                        boxSizing: "border-box",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                      onBlur={e  => (e.target.style.borderColor = "#1a2e1e")}
                    />
                  </div>
                  <div>
                    <label style={{ color: "#9ab4a2", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>
                      Empresa / Organização
                    </label>
                    <input
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="Prefeitura de Campinas (opcional)"
                      style={{
                        width: "100%", padding: "11px 14px",
                        backgroundColor: "#0a160d", border: "1px solid #1a2e1e",
                        borderRadius: 10, color: "#ffffff", fontSize: 14,
                        outline: "none", fontFamily: "inherit",
                        boxSizing: "border-box",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                      onBlur={e  => (e.target.style.borderColor = "#1a2e1e")}
                    />
                  </div>
                </div>

                {error && <p style={{ color: "#e05252", fontSize: 12 }}>{error}</p>}

                <OnboardingButton onClick={saveProfile} loading={loading}>
                  Continuar <ArrowRight style={{ width: 14, height: 14 }} />
                </OnboardingButton>
              </div>
            )}

            {/* ── STEP 2: Estação ── */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      backgroundColor: "#1a5c2e22", border: "1px solid #1a5c2e44",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Radio style={{ width: 18, height: 18, color: "#2d8a4e" }} />
                    </div>
                    <span style={{ color: "#2d8a4e", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      Passo 2 de 5
                    </span>
                  </div>
                  <h2 style={{ color: "#ffffff", fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: "var(--font-syne, sans-serif)" }}>
                    Crie sua primeira estação
                  </h2>
                  <p style={{ color: "#7aaa8a", fontSize: 14, lineHeight: 1.6 }}>
                    Uma estação representa um ponto físico de monitoramento — um parque, jardim ou área verde.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ color: "#9ab4a2", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>
                      Nome da estação *
                    </label>
                    <input
                      value={stationName}
                      onChange={e => setStationName(e.target.value)}
                      placeholder="Jardim Principal"
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                      onBlur={e  => (e.target.style.borderColor = "#1a2e1e")}
                    />
                  </div>
                  <div>
                    <label style={{ color: "#9ab4a2", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>
                      Descrição
                    </label>
                    <input
                      value={stationDesc}
                      onChange={e => setStationDesc(e.target.value)}
                      placeholder="Área verde do setor norte (opcional)"
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                      onBlur={e  => (e.target.style.borderColor = "#1a2e1e")}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ color: "#9ab4a2", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>
                        Latitude
                      </label>
                      <div style={{ position: "relative" }}>
                        <MapPin style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#2d4a35" }} />
                        <input
                          value={latitude}
                          onChange={e => setLatitude(e.target.value)}
                          placeholder="-22.9099"
                          style={{ ...inputStyle, paddingLeft: 30 }}
                          onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                          onBlur={e  => (e.target.style.borderColor = "#1a2e1e")}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ color: "#9ab4a2", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>
                        Longitude
                      </label>
                      <div style={{ position: "relative" }}>
                        <MapPin style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#2d4a35" }} />
                        <input
                          value={longitude}
                          onChange={e => setLongitude(e.target.value)}
                          placeholder="-47.0626"
                          style={{ ...inputStyle, paddingLeft: 30 }}
                          onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                          onBlur={e  => (e.target.style.borderColor = "#1a2e1e")}
                        />
                      </div>
                    </div>
                  </div>
                  <p style={{ color: "#2d4a35", fontSize: 11 }}>
                    Coordenadas opcionais — você pode adicionar depois nas configurações da estação.
                  </p>
                </div>

                {error && <p style={{ color: "#e05252", fontSize: 12 }}>{error}</p>}

                <div style={{ display: "flex", gap: 10 }}>
                  <BackButton onClick={() => goTo(1)} />
                  <OnboardingButton onClick={saveStation} loading={loading} flex>
                    Criar estação <ArrowRight style={{ width: 14, height: 14 }} />
                  </OnboardingButton>
                </div>
              </div>
            )}

            {/* ── STEP 3: Sensores ── */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      backgroundColor: "#1a5c2e22", border: "1px solid #1a5c2e44",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Thermometer style={{ width: 18, height: 18, color: "#2d8a4e" }} />
                    </div>
                    <span style={{ color: "#2d8a4e", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      Passo 3 de 5
                    </span>
                  </div>
                  <h2 style={{ color: "#ffffff", fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: "var(--font-syne, sans-serif)" }}>
                    Quais sensores você tem?
                  </h2>
                  <p style={{ color: "#7aaa8a", fontSize: 14, lineHeight: 1.6 }}>
                    Selecione os tipos de sensores conectados à sua estação. Você pode adicionar mais depois.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {SENSOR_TYPES.map(sensor => {
                    const Icon     = sensor.icon;
                    const selected = selectedSensors.includes(sensor.type);
                    return (
                      <motion.button
                        key={sensor.type}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleSensor(sensor.type)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "12px 14px", borderRadius: 12,
                          border: `1.5px solid ${selected ? sensor.color + "88" : "#1a2e1e"}`,
                          backgroundColor: selected ? sensor.color + "14" : "#0a160d",
                          cursor: "pointer", textAlign: "left",
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                          backgroundColor: selected ? sensor.color + "22" : "#1a2e1e",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s",
                        }}>
                          <Icon style={{ width: 14, height: 14, color: selected ? sensor.color : "#2d4a35" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: selected ? "#ffffff" : "#7aaa8a", fontSize: 12, fontWeight: 500 }}>
                            {sensor.label}
                          </div>
                          <div style={{ color: selected ? sensor.color : "#2d4a35", fontSize: 10 }}>
                            {sensor.unit}
                          </div>
                        </div>
                        {selected && (
                          <Check style={{ width: 13, height: 13, color: sensor.color, flexShrink: 0 }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <p style={{ color: "#2d4a35", fontSize: 11 }}>
                  {selectedSensors.length} sensor{selectedSensors.length !== 1 ? "es" : ""} selecionado{selectedSensors.length !== 1 ? "s" : ""}
                </p>

                {error && <p style={{ color: "#e05252", fontSize: 12 }}>{error}</p>}

                <div style={{ display: "flex", gap: 10 }}>
                  <BackButton onClick={() => goTo(2)} />
                  <OnboardingButton onClick={saveSensors} loading={loading} flex>
                    Adicionar sensores <ArrowRight style={{ width: 14, height: 14 }} />
                  </OnboardingButton>
                </div>
              </div>
            )}

            {/* ── STEP 4: Tour ── */}
            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      backgroundColor: "#1a5c2e22", border: "1px solid #1a5c2e44",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <LayoutDashboard style={{ width: 18, height: 18, color: "#2d8a4e" }} />
                    </div>
                    <span style={{ color: "#2d8a4e", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      Passo 4 de 5
                    </span>
                  </div>
                  <h2 style={{ color: "#ffffff", fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: "var(--font-syne, sans-serif)" }}>
                    Conheça a plataforma
                  </h2>
                  <p style={{ color: "#7aaa8a", fontSize: 14, lineHeight: 1.6 }}>
                    Um tour rápido pelas principais funcionalidades do EcoSense.
                  </p>
                </div>

                {/* Tour cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {TOUR_STEPS.map((t, i) => {
                    const Icon    = t.icon;
                    const active  = i === tourStep;
                    const done    = i < tourStep;
                    return (
                      <motion.div
                        key={t.title}
                        animate={{
                          backgroundColor: active ? "#1a5c2e18" : "transparent",
                          borderColor:     active ? "#1a5c2e44" : "#1a2e1e",
                        }}
                        style={{
                          border: "1px solid #1a2e1e",
                          borderRadius: 14, padding: "14px 16px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onClick={() => setTourStep(i)}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            backgroundColor: done ? "#1a5c2e" : active ? "#1a5c2e22" : "#0a160d",
                            border: `1px solid ${done || active ? "#1a5c2e44" : "#1a2e1e"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s",
                          }}>
                            {done
                              ? <Check  style={{ width: 14, height: 14, color: "#ffffff" }} />
                              : <Icon   style={{ width: 14, height: 14, color: active ? "#2d8a4e" : "#2d4a35" }} />
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: active ? "#ffffff" : done ? "#7aaa8a" : "#4a7a5a", fontSize: 13, fontWeight: 600, marginBottom: active ? 4 : 0 }}>
                              {t.title}
                            </div>
                            <AnimatePresence>
                              {active && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{ color: "#7aaa8a", fontSize: 12, lineHeight: 1.6, overflow: "hidden" }}
                                >
                                  {t.desc}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                          <ChevronRight style={{ width: 14, height: 14, color: "#2d4a35", flexShrink: 0, marginTop: 2 }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <BackButton onClick={() => goTo(3)} />
                  <OnboardingButton onClick={finishTour} flex>
                    Concluir tour <ArrowRight style={{ width: 14, height: 14 }} />
                  </OnboardingButton>
                </div>
              </div>
            )}

            {/* ── STEP 5: Sucesso ── */}
            {step === 5 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", textAlign: "center" }}>
                {/* Animated check */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 16 }}
                  style={{
                    width: 80, height: 80, borderRadius: "50%",
                    backgroundColor: "#1a5c2e",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 0 16px #1a5c2e22, 0 0 0 32px #1a5c2e0a",
                  }}
                >
                  <Check style={{ width: 36, height: 36, color: "#ffffff" }} />
                </motion.div>

                <div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ color: "#ffffff", fontSize: 26, fontWeight: 800, marginBottom: 8, fontFamily: "var(--font-syne, sans-serif)" }}
                  >
                    Tudo pronto!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ color: "#7aaa8a", fontSize: 14, lineHeight: 1.7 }}
                  >
                    Sua estação <strong style={{ color: "#2d8a4e" }}>{stationName}</strong> foi criada com{" "}
                    <strong style={{ color: "#2d8a4e" }}>{selectedSensors.length} sensores</strong>.
                    Agora é só conectar seus Arduinos e começar a monitorar.
                  </motion.p>
                </div>

                {/* Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    width: "100%", backgroundColor: "#0a160d",
                    border: "1px solid #1a2e1e", borderRadius: 14,
                    padding: "16px 20px",
                    display: "flex", flexDirection: "column", gap: 10,
                    textAlign: "left",
                  }}
                >
                  {[
                    { label: "Estação criada",  value: stationName },
                    { label: "Sensores",         value: `${selectedSensors.length} tipos configurados` },
                    { label: "Próximo passo",    value: "Conectar Arduino ao simulador" },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#2d4a35", fontSize: 12 }}>{item.label}</span>
                      <span style={{ color: "#7aaa8a", fontSize: 12, fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{ width: "100%" }}
                >
                  <OnboardingButton onClick={goToDashboard} flex>
                    Ir para o Dashboard <ArrowRight style={{ width: 14, height: 14 }} />
                  </OnboardingButton>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Skip */}
      {step < 5 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={goToDashboard}
          style={{
            marginTop: 20, background: "none", border: "none",
            color: "#2d4a35", fontSize: 12, cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Pular configuração por agora →
        </motion.button>
      )}
    </div>
  );
}

// ─── sub-componentes ──────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  backgroundColor: "#0a160d", border: "1px solid #1a2e1e",
  borderRadius: 10, color: "#ffffff", fontSize: 14,
  outline: "none", fontFamily: "inherit",
  boxSizing: "border-box", transition: "border-color 0.2s",
};

function OnboardingButton({
  onClick, loading, children, flex,
}: {
  onClick: () => void; loading?: boolean; children: React.ReactNode; flex?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={loading}
      style={{
        flex: flex ? 1 : undefined,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        backgroundColor: "#1a5c2e", color: "#ffffff",
        border: "none", borderRadius: 12, padding: "13px 24px",
        fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit", opacity: loading ? 0.7 : 1,
        boxShadow: "0 4px 20px #1a5c2e55",
        transition: "opacity 0.2s",
      }}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          style={{ width: 16, height: 16, border: "2px solid #ffffff44", borderTop: "2px solid #ffffff", borderRadius: "50%" }}
        />
      ) : children}
    </motion.button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        backgroundColor: "transparent", border: "1px solid #1a2e1e",
        color: "#7aaa8a", cursor: "pointer",
      }}
    >
      <ArrowLeft style={{ width: 15, height: 15 }} />
    </motion.button>
  );
}