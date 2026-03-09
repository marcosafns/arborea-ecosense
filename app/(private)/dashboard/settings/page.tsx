"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import {
  User, Bell, Palette, Shield, ChevronRight,
  Save, Loader2, CheckCircle2, Mail, Building2,
  MapPin, AlertTriangle, Eye, EyeOff, Trash2,
  ToggleLeft, ToggleRight, Leaf,
} from "lucide-react";
import { useToast } from "../components/Toast";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Section = "perfil" | "notificacoes" | "aparencia" | "conta";

interface Profile {
  full_name: string;
  company:   string;
  city:      string;
  plan_id:   string;
}

interface NotifSettings {
  email_alerts:     boolean;
  email_anomalies:  boolean;
  email_offline:    boolean;
  alert_frequency:  "immediate" | "hourly" | "daily";
}

interface AppearSettings {
  compact_cards:    boolean;
  show_coordinates: boolean;
  readings_limit:   number;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const SECTIONS: { id: Section; label: string; icon: any; desc: string }[] = [
  { id: "perfil",        label: "Perfil",        icon: User,    desc: "Suas informações pessoais" },
  { id: "notificacoes",  label: "Notificações",  icon: Bell,    desc: "Alertas e emails" },
  { id: "aparencia",     label: "Aparência",     icon: Palette, desc: "Preferências de exibição" },
  { id: "conta",         label: "Conta",         icon: Shield,  desc: "Segurança e plano" },
];

const PLAN_LABELS: Record<string, { name: string; color: string; bg: string }> = {
  semente:    { name: "Semente",    color: "#7aaa8a", bg: "#f0f7f2" },
  broto:      { name: "Broto",      color: "#2a7fd4", bg: "#f0f5fd" },
  floresta:   { name: "Floresta",   color: "#1a5c2e", bg: "#f0f7f2" },
  ecossistema:{ name: "Ecossistema",color: "#7a2ad4", bg: "#f5f0fd" },
};

const FREQ_OPTIONS = [
  { value: "immediate", label: "Imediato",      desc: "Assim que ocorrer" },
  { value: "hourly",    label: "A cada hora",   desc: "Resumo por hora" },
  { value: "daily",     label: "Diário",        desc: "Resumo diário" },
];

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f0f4f1" }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: "#f0f7f2", border: "1px solid #c8e0cf",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 18, height: 18, color: "#1a5c2e" }} />
      </div>
      <div>
        <h2 style={{ color: "#0f1f12", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-syne)", marginBottom: 2 }}>{title}</h2>
        <p style={{ color: "#9ab4a2", fontSize: 12 }}>{desc}</p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#3d6b4a", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: "#b0c4b8" }}>{hint}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", icon: Icon }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {Icon && <Icon style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: focused ? "#1a5c2e" : "#b0c4b8", transition: "color 0.2s" }} />}
      <input
        type={type} value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: "100%", paddingLeft: Icon ? 36 : 14, paddingRight: 14,
          paddingTop: 11, paddingBottom: 11, borderRadius: 10,
          border: `1.5px solid ${focused ? "#1a5c2e" : "#e0eae4"}`,
          backgroundColor: focused ? "#fafcfa" : "#f8fbf8",
          color: "#0f1f12", fontSize: 14, outline: "none",
          transition: "all 0.2s", boxSizing: "border-box", fontFamily: "inherit",
        }}
      />
    </div>
  );
}

function Toggle({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", backgroundColor: "#f8fbf8", borderRadius: 10, border: "1px solid #f0f4f1" }}>
      <div>
        <div style={{ color: "#0f1f12", fontSize: 13, fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ color: "#9ab4a2", fontSize: 11, marginTop: 2 }}>{desc}</div>}
      </div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => onChange(!value)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
      >
        {value
          ? <ToggleRight style={{ width: 32, height: 32, color: "#1a5c2e" }} />
          : <ToggleLeft  style={{ width: 32, height: 32, color: "#c8d8ce" }} />}
      </motion.button>
    </div>
  );
}

function SaveButton({ loading, saved, onClick }: { loading: boolean; saved: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={!loading ? { scale: 1.02, boxShadow: "0 6px 20px #1a5c2e33" } : {}}
      whileTap={!loading ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "11px 24px", borderRadius: 10, border: "none",
        background: saved ? "#f0f7f2" : "linear-gradient(135deg, #1a5c2e, #2d8a4e)",
        color: saved ? "#1a5c2e" : "#ffffff",
        fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.25s",
      }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
              <Loader2 style={{ width: 14, height: 14 }} />
            </motion.div>
          </motion.div>
        ) : saved ? (
          <motion.div key="saved" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <CheckCircle2 style={{ width: 14, height: 14 }} />
          </motion.div>
        ) : (
          <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Save style={{ width: 14, height: 14 }} />
          </motion.div>
        )}
      </AnimatePresence>
      {loading ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
    </motion.button>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [section,  setSection]  = useState<Section>("perfil");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const supabase = createClient();
  const { success, error } = useToast();

  // Estados de perfil
  const [profile, setProfile] = useState<Profile>({
    full_name: "", company: "", city: "", plan_id: "floresta",
  });
  const [userEmail, setUserEmail] = useState("");

  // Notificações
  const [notif, setNotif] = useState<NotifSettings>({
    email_alerts: true, email_anomalies: true, email_offline: false,
    alert_frequency: "immediate",
  });

  // Aparência
  const [appear, setAppear] = useState<AppearSettings>({
    compact_cards: false, show_coordinates: true, readings_limit: 100,
  });

  // Conta
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass,        setShowPass]        = useState(false);
  const [deleteConfirm,   setDeleteConfirm]   = useState("");

  // ── Carrega dados ──
  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserEmail(user.email ?? "");

    const { data } = await supabase
      .from("clients")
      .select("full_name, company, city, plan_id")
      .eq("id", user.id)
      .single();

    if (data) setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  // ── Salva perfil ──
  const saveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase
      .from("clients")
      .update({ full_name: profile.full_name, company: profile.company, city: profile.city })
      .eq("id", user.id);

    if (err) { error("Erro ao salvar", err.message); setSaving(false); return; }
    success("Perfil atualizado!", "Suas informações foram salvas.");
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ── Salva notificações ──
  const saveNotif = async () => {
    setSaving(true);
    // Salva no localStorage como preferências (pode migrar para tabela futuramente)
    localStorage.setItem("ecosense_notif", JSON.stringify(notif));
    await new Promise(r => setTimeout(r, 600));
    success("Notificações atualizadas!", "Preferências salvas.");
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ── Salva aparência ──
  const saveAppear = async () => {
    setSaving(true);
    localStorage.setItem("ecosense_appear", JSON.stringify(appear));
    await new Promise(r => setTimeout(r, 600));
    success("Aparência atualizada!", "Preferências salvas.");
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ── Altera senha ──
  const changePassword = async () => {
    if (newPassword !== confirmPassword) { error("Senhas não conferem", "A confirmação deve ser igual à nova senha."); return; }
    if (newPassword.length < 6) { error("Senha muito curta", "Mínimo 6 caracteres."); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) { error("Erro ao alterar senha", err.message); setSaving(false); return; }
    success("Senha alterada!", "Sua nova senha está ativa.");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ── Exclui conta ──
  const deleteAccount = async () => {
    setSaving(true);
    // Chama a API route que usa service_role para deletar o usuário
    const res = await fetch("/api/delete-account", { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      error("Erro ao excluir conta", json.message ?? "Tente novamente.");
      setSaving(false);
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSave = () => {
    if (section === "perfil")       saveProfile();
    if (section === "notificacoes") saveNotif();
    if (section === "aparencia")    saveAppear();
    if (section === "conta")        changePassword();
  };

  // ── Carregando ──
  if (loading) {
    return (
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ width: 220, backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e8ede9", padding: 16 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 52, borderRadius: 10, marginBottom: 6, background: "linear-gradient(90deg, #f0f4f1 25%, #e4ece6 50%, #f0f4f1 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.6s infinite" }} />
          ))}
        </div>
        <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e8ede9", padding: 28 }}>
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      </div>
    );
  }

  const plan = PLAN_LABELS[profile.plan_id] ?? PLAN_LABELS.semente;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#0f1f12", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-syne)", marginBottom: 4 }}>Configurações</h1>
        <p style={{ color: "#7aaa8a", fontSize: 13 }}>Gerencie sua conta e preferências</p>
      </motion.div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* ── Sidebar de navegação ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            width: 220, flexShrink: 0,
            backgroundColor: "#ffffff",
            border: "1px solid #e8ede9",
            borderRadius: 16, padding: 8,
            boxShadow: "0 1px 4px #0f1f1206",
          }}
        >
          {/* Avatar + plano */}
          <div style={{ padding: "12px 12px 16px", borderBottom: "1px solid #f0f4f1", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: "#1a5c2e",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "#fff",
                fontFamily: "var(--font-syne)",
              }}>
                {(profile.full_name || userEmail).charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ color: "#0f1f12", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profile.full_name || "Usuário"}
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4, marginTop: 3,
                  backgroundColor: plan.bg, borderRadius: 999, padding: "1px 8px",
                }}>
                  <Leaf style={{ width: 9, height: 9, color: plan.color }} />
                  <span style={{ fontSize: 10, color: plan.color, fontWeight: 600 }}>{plan.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          {SECTIONS.map(({ id, label, icon: Icon, desc }) => {
            const active = section === id;
            return (
              <motion.button
                key={id}
                whileHover={!active ? { backgroundColor: "#f7faf8" } : {}}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSection(id); setSaved(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: `1px solid ${active ? "#c8e0cf" : "transparent"}`,
                  backgroundColor: active ? "#f0f7f2" : "transparent",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  marginBottom: 2,
                }}
              >
                <Icon style={{ width: 15, height: 15, color: active ? "#1a5c2e" : "#9ab4a2", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: active ? "#1a5c2e" : "#0f1f12", fontSize: 13, fontWeight: active ? 600 : 400 }}>{label}</div>
                </div>
                {active && <ChevronRight style={{ width: 12, height: 12, color: "#1a5c2e" }} />}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Conteúdo da seção ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ flex: 1, backgroundColor: "#ffffff", border: "1px solid #e8ede9", borderRadius: 16, padding: "28px 32px", boxShadow: "0 1px 4px #0f1f1206" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >

              {/* ── PERFIL ── */}
              {section === "perfil" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <SectionTitle icon={User} title="Perfil" desc="Suas informações pessoais" />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Nome completo">
                      <Input value={profile.full_name} onChange={v => setProfile(p => ({ ...p, full_name: v }))} placeholder="Seu nome" icon={User} />
                    </Field>
                    <Field label="Empresa">
                      <Input value={profile.company} onChange={v => setProfile(p => ({ ...p, company: v }))} placeholder="Nome da empresa" icon={Building2} />
                    </Field>
                  </div>

                  <Field label="Cidade">
                    <Input value={profile.city} onChange={v => setProfile(p => ({ ...p, city: v }))} placeholder="Sua cidade" icon={MapPin} />
                  </Field>

                  <Field label="Email" hint="O email não pode ser alterado aqui.">
                    <div style={{ padding: "11px 14px", borderRadius: 10, backgroundColor: "#f4f7f4", border: "1px solid #e8ede9", color: "#9ab4a2", fontSize: 14 }}>
                      {userEmail}
                    </div>
                  </Field>

                  <Field label="Plano atual">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", backgroundColor: plan.bg, borderRadius: 10, border: `1px solid ${plan.color}30` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Leaf style={{ width: 16, height: 16, color: plan.color }} />
                        <span style={{ color: plan.color, fontWeight: 600, fontSize: 14 }}>Plano {plan.name}</span>
                      </div>
                      <span style={{ color: plan.color, fontSize: 12, opacity: 0.7 }}>
                        {profile.plan_id === "ecossistema" ? "Customizado" : profile.plan_id === "semente" ? "Gratuito" : "Ativo"}
                      </span>
                    </div>
                  </Field>

                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f4f1" }}>
                    <SaveButton loading={saving} saved={saved} onClick={handleSave} />
                  </div>
                </div>
              )}

              {/* ── NOTIFICAÇÕES ── */}
              {section === "notificacoes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <SectionTitle icon={Bell} title="Notificações" desc="Configure como e quando receber alertas" />

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ color: "#3d6b4a", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      Notificações por Email
                    </div>
                    <Toggle value={notif.email_alerts} onChange={v => setNotif(n => ({ ...n, email_alerts: v }))} label="Alertas gerais" desc="Receba alertas de anomalias e limiares" />
                    <Toggle value={notif.email_anomalies} onChange={v => setNotif(n => ({ ...n, email_anomalies: v }))} label="Anomalias de sensor" desc="Quando um sensor registrar leitura anômala" />
                    <Toggle value={notif.email_offline} onChange={v => setNotif(n => ({ ...n, email_offline: v }))} label="Estação offline" desc="Quando uma estação parar de enviar dados" />
                  </div>

                  <div>
                    <div style={{ color: "#3d6b4a", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                      Frequência dos Alertas
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {FREQ_OPTIONS.map(opt => (
                        <motion.button
                          key={opt.value}
                          whileHover={{ backgroundColor: notif.alert_frequency !== opt.value ? "#f7faf8" : undefined }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setNotif(n => ({ ...n, alert_frequency: opt.value as any }))}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                            border: `1.5px solid ${notif.alert_frequency === opt.value ? "#1a5c2e" : "#e8ede9"}`,
                            backgroundColor: notif.alert_frequency === opt.value ? "#f0f7f2" : "#fafcfa",
                            fontFamily: "inherit", textAlign: "left",
                          }}
                        >
                          <div>
                            <div style={{ color: "#0f1f12", fontSize: 13, fontWeight: notif.alert_frequency === opt.value ? 600 : 400 }}>{opt.label}</div>
                            <div style={{ color: "#9ab4a2", fontSize: 11, marginTop: 2 }}>{opt.desc}</div>
                          </div>
                          <div style={{
                            width: 16, height: 16, borderRadius: "50%",
                            border: `2px solid ${notif.alert_frequency === opt.value ? "#1a5c2e" : "#c8d8ce"}`,
                            backgroundColor: notif.alert_frequency === opt.value ? "#1a5c2e" : "transparent",
                            flexShrink: 0, transition: "all 0.15s",
                          }} />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f4f1" }}>
                    <SaveButton loading={saving} saved={saved} onClick={handleSave} />
                  </div>
                </div>
              )}

              {/* ── APARÊNCIA ── */}
              {section === "aparencia" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <SectionTitle icon={Palette} title="Aparência" desc="Personalize como o dashboard é exibido" />

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Toggle value={appear.compact_cards} onChange={v => setAppear(a => ({ ...a, compact_cards: v }))} label="Cards compactos" desc="Reduz o tamanho dos cards de sensor" />
                    <Toggle value={appear.show_coordinates} onChange={v => setAppear(a => ({ ...a, show_coordinates: v }))} label="Mostrar coordenadas" desc="Exibe latitude e longitude nas estações" />
                  </div>

                  <div>
                    <div style={{ color: "#3d6b4a", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                      Limite de Leituras nos Gráficos
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[50, 100, 200, 500].map(v => (
                        <motion.button
                          key={v}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setAppear(a => ({ ...a, readings_limit: v }))}
                          style={{
                            flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                            cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500,
                            backgroundColor: appear.readings_limit === v ? "#1a5c2e" : "#f4f7f4",
                            color: appear.readings_limit === v ? "#ffffff" : "#6b8f78",
                            transition: "all 0.15s",
                          }}
                        >
                          {v}
                        </motion.button>
                      ))}
                    </div>
                    <div style={{ color: "#b0c4b8", fontSize: 11, marginTop: 8 }}>Pontos máximos exibidos nos gráficos históricos</div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f4f1" }}>
                    <SaveButton loading={saving} saved={saved} onClick={handleSave} />
                  </div>
                </div>
              )}

              {/* ── CONTA ── */}
              {section === "conta" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <SectionTitle icon={Shield} title="Conta" desc="Segurança e gerenciamento da conta" />

                  {/* Alterar senha */}
                  <div>
                    <div style={{ color: "#3d6b4a", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                      Alterar Senha
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <Field label="Nova senha">
                        <div style={{ position: "relative" }}>
                          <input
                            type={showPass ? "text" : "password"}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="mínimo 6 caracteres"
                            style={{ width: "100%", paddingLeft: 14, paddingRight: 42, paddingTop: 11, paddingBottom: 11, borderRadius: 10, border: "1.5px solid #e0eae4", backgroundColor: "#f8fbf8", color: "#0f1f12", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                            onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                            onBlur={e => (e.target.style.borderColor = "#e0eae4")}
                          />
                          <button onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#b0c4b8" }}>
                            {showPass ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                          </button>
                        </div>
                      </Field>
                      <Field label="Confirmar nova senha">
                        <input
                          type={showPass ? "text" : "password"}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="repita a nova senha"
                          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${confirmPassword && confirmPassword !== newPassword ? "#e05252" : "#e0eae4"}`, backgroundColor: "#f8fbf8", color: "#0f1f12", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                          onFocus={e => (e.target.style.borderColor = "#1a5c2e")}
                          onBlur={e => (e.target.style.borderColor = confirmPassword && confirmPassword !== newPassword ? "#e05252" : "#e0eae4")}
                        />
                        {confirmPassword && confirmPassword !== newPassword && (
                          <span style={{ fontSize: 11, color: "#e05252" }}>As senhas não conferem</span>
                        )}
                      </Field>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                      <SaveButton loading={saving} saved={saved} onClick={handleSave} />
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div style={{ borderTop: "1px solid #f0f4f1", paddingTop: 24 }}>
                    <div style={{ backgroundColor: "#fdf3f3", border: "1px solid #f5c6c6", borderRadius: 14, padding: "20px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <AlertTriangle style={{ width: 16, height: 16, color: "#e05252" }} />
                        <span style={{ color: "#e05252", fontSize: 13, fontWeight: 700 }}>Zona de Perigo</span>
                      </div>
                      <p style={{ color: "#9a6b6b", fontSize: 12, lineHeight: 1.7, marginBottom: 16 }}>
                        Excluir sua conta é uma ação permanente e irreversível. Todos os seus dados, estações, sensores e leituras serão apagados.
                      </p>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input
                          value={deleteConfirm}
                          onChange={e => setDeleteConfirm(e.target.value)}
                          placeholder='Digite "excluir" para confirmar'
                          style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: "1px solid #f5c6c6", backgroundColor: "#fff", color: "#0f1f12", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                        />
                        <motion.button
                          whileHover={deleteConfirm === "excluir" ? { scale: 1.03 } : {}}
                          whileTap={deleteConfirm === "excluir" ? { scale: 0.97 } : {}}
                          disabled={deleteConfirm !== "excluir" || saving}
                          onClick={deleteAccount}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "9px 16px", borderRadius: 8, border: "none",
                            backgroundColor: deleteConfirm === "excluir" ? "#e05252" : "#f5c6c6",
                            color: "#ffffff", fontSize: 13, fontWeight: 600,
                            cursor: deleteConfirm === "excluir" ? "pointer" : "not-allowed",
                            fontFamily: "inherit", transition: "background-color 0.2s",
                          }}
                        >
                          <Trash2 style={{ width: 13, height: 13 }} />
                          Excluir conta
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}