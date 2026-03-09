"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import {
  User, Mail, Building2, MapPin, Shield, CreditCard,
  CheckCircle, Loader2, Leaf, Zap, TreePine, Globe, ChevronRight
} from "lucide-react";

const PLANS = [
  {
    id: "semente",
    name: "Semente",
    price: "Grátis",
    description: "Para começar a monitorar",
    color: "#7aaa8a",
    features: ["1 estação", "3 sensores", "Histórico 7 dias", "Suporte por email"],
    icon: Leaf,
  },
  {
    id: "broto",
    name: "Broto",
    price: "R$ 49/mês",
    description: "Para pequenas áreas verdes",
    color: "#2a9e4a",
    features: ["3 estações", "10 sensores", "Histórico 30 dias", "Alertas em tempo real", "Suporte prioritário"],
    icon: Zap,
  },
  {
    id: "floresta",
    name: "Floresta",
    price: "R$ 149/mês",
    description: "Para gestão profissional",
    color: "#1a5c2e",
    features: ["10 estações", "Sensores ilimitados", "Histórico 1 ano", "Relatórios automáticos", "API de acesso", "Suporte dedicado"],
    icon: TreePine,
    popular: true,
  },
  {
    id: "ecossistema",
    name: "Ecossistema",
    price: "Sob consulta",
    description: "Para grandes operações",
    color: "#0f1f12",
    features: ["Estações ilimitadas", "Sensores ilimitados", "Histórico ilimitado", "White-label", "SLA garantido", "Gerente dedicado"],
    icon: Globe,
  },
];

type Tab = "profile" | "plan" | "security";

export default function SettingsPage() {
  const supabase = createClient();

  const [tab, setTab]             = useState<Tab>("profile");
  const [email, setEmail]         = useState("");
  const [fullName, setFullName]   = useState("");
  const [company, setCompany]     = useState("");
  const [city, setCity]           = useState("");
  const [currentPlan, setPlan]    = useState("floresta");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [loading, setLoading]     = useState(true);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError]     = useState("");
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwSaved, setPwSaved]     = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");

      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("id", user.id)
        .single();

      if (client) {
        setFullName(client.full_name ?? "");
        setCompany(client.company ?? "");
        setCity(client.city ?? "");
        setPlan(client.plan_id ?? "floresta");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("clients").upsert({
      id: user.id,
      full_name: fullName,
      company,
      city,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = async () => {
    setPwError("");
    if (newPw.length < 6) { setPwError("A senha deve ter ao menos 6 caracteres."); return; }
    if (newPw !== confirmPw) { setPwError("As senhas não coincidem."); return; }

    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);

    if (error) { setPwError(error.message); return; }
    setPwSaved(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSaved(false), 3000);
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

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "profile",  label: "Perfil",    icon: User    },
    { id: "plan",     label: "Plano",     icon: CreditCard },
    { id: "security", label: "Segurança", icon: Shield  },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #e8ede9", borderTop: "2px solid #1a5c2e" }}
      />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 780 }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 style={{ color: "#0f1f12", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-syne)", marginBottom: 4 }}>
          Configurações
        </h1>
        <p style={{ color: "#7aaa8a", fontSize: 13 }}>Gerencie seu perfil, plano e segurança</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: "flex", gap: 4,
          backgroundColor: "#f0f4f1",
          borderRadius: 12, padding: 4,
          width: "fit-content",
        }}
      >
        {TABS.map(t => (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 18px", borderRadius: 9,
              border: "none",
              backgroundColor: tab === t.id ? "#ffffff" : "transparent",
              color: tab === t.id ? "#0f1f12" : "#7aaa8a",
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              cursor: "pointer",
              boxShadow: tab === t.id ? "0 1px 4px #0f1f1210" : "none",
              transition: "all 0.2s",
            }}
          >
            <t.icon style={{ width: 14, height: 14 }} />
            {t.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">

        {/* PERFIL */}
        {tab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Avatar card */}
            <div style={{
              backgroundColor: "#ffffff", border: "1px solid #e8ede9",
              borderRadius: 16, padding: "24px",
              display: "flex", alignItems: "center", gap: 20,
            }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  width: 64, height: 64, borderRadius: 16,
                  backgroundColor: "#1a5c2e",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 26, fontWeight: 700,
                  fontFamily: "var(--font-syne)", flexShrink: 0,
                }}
              >
                {email[0]?.toUpperCase() ?? "?"}
              </motion.div>
              <div>
                <div style={{ color: "#0f1f12", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  {fullName || email.split("@")[0]}
                </div>
                <div style={{ color: "#9ab4a2", fontSize: 13 }}>{email}</div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  marginTop: 8, fontSize: 11,
                  backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf",
                  borderRadius: 999, padding: "3px 10px", color: "#1a5c2e", fontWeight: 600,
                }}>
                  <TreePine style={{ width: 11, height: 11 }} />
                  Plano {PLANS.find(p => p.id === currentPlan)?.name ?? "—"}
                </div>
              </div>
            </div>

            {/* Form */}
            <div style={{
              backgroundColor: "#ffffff", border: "1px solid #e8ede9",
              borderRadius: 16, padding: "24px",
              display: "flex", flexDirection: "column", gap: 16,
            }}>
              <h3 style={{ color: "#0f1f12", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                Informações pessoais
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#3d6b4a", display: "block", marginBottom: 6 }}>
                    Nome completo
                  </label>
                  <div style={{ position: "relative" }}>
                    <User style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#aac4b4" }} />
                    <input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      style={{ ...inputStyle, paddingLeft: 36 }}
                      onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                      onBlur={e => (e.target.style.borderColor = "#e8ede9")}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#3d6b4a", display: "block", marginBottom: 6 }}>
                    E-mail
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#aac4b4" }} />
                    <input
                      value={email}
                      disabled
                      style={{ ...inputStyle, paddingLeft: 36, opacity: 0.6, cursor: "not-allowed" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#3d6b4a", display: "block", marginBottom: 6 }}>
                    Empresa / Organização
                  </label>
                  <div style={{ position: "relative" }}>
                    <Building2 style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#aac4b4" }} />
                    <input
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="Nome da empresa"
                      style={{ ...inputStyle, paddingLeft: 36 }}
                      onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                      onBlur={e => (e.target.style.borderColor = "#e8ede9")}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#3d6b4a", display: "block", marginBottom: 6 }}>
                    Cidade
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#aac4b4" }} />
                    <input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Sua cidade"
                      style={{ ...inputStyle, paddingLeft: 36 }}
                      onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                      onBlur={e => (e.target.style.borderColor = "#e8ede9")}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <AnimatePresence>
                  {saved && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ display: "flex", alignItems: "center", gap: 6, color: "#1a5c2e", fontSize: 13 }}
                    >
                      <CheckCircle style={{ width: 14, height: 14 }} />
                      Salvo com sucesso!
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button
                  whileHover={{ backgroundColor: "#1e6b34" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 22px", borderRadius: 10,
                    backgroundColor: "#1a5c2e", border: "none",
                    color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s",
                  }}
                >
                  {saving && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
                  Salvar alterações
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PLANO */}
        {tab === "plan" && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {PLANS.map((plan, i) => {
                const Icon    = plan.icon;
                const active  = currentPlan === plan.id;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ y: -2, boxShadow: "0 8px 28px #0f1f1214" }}
                    style={{
                      backgroundColor: "#ffffff",
                      border: `1.5px solid ${active ? plan.color : "#e8ede9"}`,
                      borderRadius: 16, padding: "22px",
                      position: "relative", overflow: "hidden",
                      boxShadow: active ? `0 4px 20px ${plan.color}18` : "0 1px 4px #0f1f1208",
                      cursor: "default",
                      transition: "box-shadow 0.2s",
                    }}
                  >
                    {/* Popular badge */}
                    {plan.popular && (
                      <div style={{
                        position: "absolute", top: 14, right: 14,
                        fontSize: 10, padding: "3px 9px", borderRadius: 999,
                        backgroundColor: plan.color, color: "#fff", fontWeight: 700,
                      }}>
                        Popular
                      </div>
                    )}

                    {/* Active indicator */}
                    {active && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: "absolute", top: 14, right: plan.popular ? 80 : 14,
                          width: 20, height: 20, borderRadius: "50%",
                          backgroundColor: plan.color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <CheckCircle style={{ width: 12, height: 12, color: "#fff" }} />
                      </motion.div>
                    )}

                    <div style={{
                      width: 36, height: 36, borderRadius: 10, marginBottom: 14,
                      backgroundColor: `${plan.color}15`,
                      border: `1px solid ${plan.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon style={{ width: 17, height: 17, color: plan.color }} />
                    </div>

                    <div style={{ color: "#0f1f12", fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                      {plan.name}
                    </div>
                    <div style={{ color: "#9ab4a2", fontSize: 12, marginBottom: 12 }}>
                      {plan.description}
                    </div>
                    <div style={{ color: plan.color, fontSize: 18, fontWeight: 700, fontFamily: "var(--font-geist-mono)", marginBottom: 16 }}>
                      {plan.price}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
                      {plan.features.map(f => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <CheckCircle style={{ width: 12, height: 12, color: plan.color, flexShrink: 0 }} />
                          <span style={{ color: "#6b8f78", fontSize: 12 }}>{f}</span>
                        </div>
                      ))}
                    </div>

                    {active ? (
                      <div style={{
                        padding: "8px 0", textAlign: "center",
                        backgroundColor: `${plan.color}10`,
                        border: `1px solid ${plan.color}30`,
                        borderRadius: 8, color: plan.color, fontSize: 12, fontWeight: 600,
                      }}>
                        Plano atual
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ backgroundColor: plan.color, color: "#fff" }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          width: "100%", padding: "8px 0", textAlign: "center",
                          backgroundColor: "transparent",
                          border: `1px solid ${plan.color}`,
                          borderRadius: 8, color: plan.color,
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                      >
                        Fazer upgrade
                        <ChevronRight style={{ width: 13, height: 13 }} />
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* SEGURANÇA */}
        {tab === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Info card */}
            <div style={{
              backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf",
              borderRadius: 12, padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <Shield style={{ width: 18, height: 18, color: "#1a5c2e", flexShrink: 0 }} />
              <div>
                <div style={{ color: "#1a5c2e", fontSize: 13, fontWeight: 600 }}>Conexão segura</div>
                <div style={{ color: "#7aaa8a", fontSize: 12 }}>
                  Sua sessão é protegida com criptografia de ponta a ponta via Supabase Auth.
                </div>
              </div>
            </div>

            {/* Change password */}
            <div style={{
              backgroundColor: "#ffffff", border: "1px solid #e8ede9",
              borderRadius: 16, padding: "24px",
              display: "flex", flexDirection: "column", gap: 16,
            }}>
              <h3 style={{ color: "#0f1f12", fontSize: 14, fontWeight: 600 }}>
                Alterar senha
              </h3>

              {[
                { label: "Nova senha",        value: newPw,     set: setNewPw },
                { label: "Confirmar senha",   value: confirmPw, set: setConfirmPw },
              ].map(field => (
                <div key={field.label}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#3d6b4a", display: "block", marginBottom: 6 }}>
                    {field.label}
                  </label>
                  <input
                    type="password"
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    placeholder="••••••••"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                    onBlur={e => (e.target.style.borderColor = "#e8ede9")}
                  />
                </div>
              ))}

              <AnimatePresence>
                {pwError && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontSize: 12, padding: "8px 12px", borderRadius: 8,
                      color: "#c0392b", backgroundColor: "#fdf3f3",
                      border: "1px solid #f5c6c6",
                    }}
                  >
                    {pwError}
                  </motion.p>
                )}
                {pwSaved && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: 12, padding: "8px 12px", borderRadius: 8,
                      color: "#1a5c2e", backgroundColor: "#f0f7f2",
                      border: "1px solid #c8e0cf",
                    }}
                  >
                    <CheckCircle style={{ width: 14, height: 14 }} />
                    Senha alterada com sucesso!
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <motion.button
                  whileHover={{ backgroundColor: "#1e6b34" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleChangePassword}
                  disabled={pwSaving}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 22px", borderRadius: 10,
                    backgroundColor: "#1a5c2e", border: "none",
                    color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: pwSaving ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s",
                  }}
                >
                  {pwSaving && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
                  Alterar senha
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}