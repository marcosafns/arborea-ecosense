"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { DEFAULT_PLAN_ID } from "@/lib/plans";

function Particle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      initial={{ y: "110%", opacity: 0 }}
      animate={{ y: "-10%", opacity: [0, 0.6, 0.6, 0] }}
      transition={{ duration: 8 + Math.random() * 4, delay, repeat: Infinity, ease: "linear" }}
      style={{
        position: "absolute", left: `${x}%`, bottom: 0,
        width: size, height: size, borderRadius: "50%",
        backgroundColor: "#2d8a4e", filter: "blur(1px)", pointerEvents: "none",
      }}
    />
  );
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  delay: i * 0.7, x: 5 + i * 8, size: 3 + (i % 4) * 2,
}));

// Tradução dos erros do Supabase
const ERROR_MAP: Record<string, string> = {
  "User already registered":                    "Este email já está cadastrado. Faça login.",
  "Invalid login credentials":                  "Email ou senha incorretos.",
  "Email not confirmed":                        "Confirme seu email antes de entrar.",
  "Password should be at least 6 characters":   "A senha deve ter no mínimo 6 caracteres.",
  "Unable to validate email address: invalid format": "Email inválido.",
  "signup_disabled":                            "Cadastro temporariamente desabilitado.",
  "email_address_not_authorized":               "Este email não está autorizado.",
  "over_email_send_rate_limit":                 "Muitas tentativas. Aguarde alguns minutos.",
};

function translateError(msg: string): string {
  return ERROR_MAP[msg] ?? msg ?? "Ocorreu um erro. Tente novamente.";
}

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [mode,         setMode]         = useState<"login" | "register">("login");
  const [focused,      setFocused]      = useState<string | null>(null);
  const [mounted,      setMounted]      = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true); setError(""); setSuccess("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard";

      } else {
        // ── Cadastro ──
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;

        // Cria o perfil na tabela clients com plano Semente (UUID real)
        if (data.user) {
          const { error: profileErr } = await supabase
            .from("clients")
            .upsert({
              id:       data.user.id,
              plan_id:  DEFAULT_PLAN_ID,   // UUID do plano Semente
              full_name: "",
              company:  "",
              city:     "",
            }, { onConflict: "id", ignoreDuplicates: true });

          if (profileErr) {
            console.error("Erro ao criar perfil:", profileErr.message);
          }
        }

        // Se confirmação de email está desabilitada, vai direto pro dashboard
        if (data.session) {
          window.location.href = "/dashboard";
        } else {
          setSuccess("Verifique seu email para confirmar o cadastro!");
        }
      }
    } catch (err: any) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const isReady = email.length > 0 && password.length >= 6;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#ffffff", fontFamily: "var(--font-dm-sans, system-ui)" }}>

      {/* Painel esquerdo */}
      <div
        className="hidden lg:flex"
        style={{
          width: "48%", backgroundColor: "#0a1a0f",
          position: "relative", overflow: "hidden",
          flexDirection: "column", justifyContent: "space-between",
          padding: "44px 52px",
        }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(#1a5c2e10 1px, transparent 1px), linear-gradient(90deg, #1a5c2e10 1px, transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-120px", left: "-80px", width: 500, height: 500, background: "radial-gradient(circle, #1a5c2e40 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "20%", right: "-60px", width: 300, height: 300, background: "radial-gradient(circle, #2d8a4e18 0%, transparent 65%)", pointerEvents: "none" }} />

        {mounted && (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ position: "relative", zIndex: 1 }}>
          <img src="/img/ecosense-logo1.svg" alt="Arborea EcoSense" style={{ height: 36, width: "auto" }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #1a5c2e60", borderRadius: 999, padding: "5px 14px", marginBottom: 32 }}>
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80", display: "block" }} />
            <span style={{ color: "#4ade80", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>Sistema operacional</span>
          </div>

          <h2 style={{ color: "#ffffff", fontSize: 42, fontWeight: 800, lineHeight: 1.1, marginBottom: 20, fontFamily: "var(--font-syne)", letterSpacing: "-0.02em" }}>
            Sua floresta,<br />
            <span style={{ background: "linear-gradient(135deg, #4ade80, #1a5c2e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              em tempo real.
            </span>
          </h2>

          <p style={{ color: "#4a7a5a", fontSize: 14, lineHeight: 1.8, maxWidth: 300 }}>
            Sensores inteligentes + painel interativo. Monitore temperatura, pH, umidade e muito mais direto do seu smartphone.
          </p>
        </motion.div>
      </div>

      {/* Painel direito */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", backgroundColor: "#ffffff", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(#1a5c2e08 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" }} />

        {/* Logo mobile */}
        <div className="lg:hidden" style={{ marginBottom: 40, display: "flex", alignItems: "center", position: "relative", zIndex: 1 }}>
          <img src="/img/ecosense-logo1.svg" alt="Arborea EcoSense" style={{ height: 30, width: "auto", filter: "brightness(0) saturate(0) invert(17%) sepia(40%) saturate(800%) hue-rotate(95deg) brightness(40%)" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", backgroundColor: "#f4f7f4", borderRadius: 14, padding: 4, marginBottom: 36, gap: 4 }}>
            {(["login", "register"] as const).map((tab) => (
              <button key={tab} onClick={() => { setMode(tab); setError(""); setSuccess(""); }} style={{
                flex: 1, padding: "10px 0", borderRadius: 11, fontSize: 13,
                fontWeight: mode === tab ? 600 : 400, cursor: "pointer", transition: "all 0.2s",
                backgroundColor: mode === tab ? "#ffffff" : "transparent",
                color: mode === tab ? "#0a1a0f" : "#7aaa8a",
                border: mode === tab ? "1px solid #ddeae0" : "1px solid transparent",
                boxShadow: mode === tab ? "0 2px 8px #0f2d1a0d" : "none", fontFamily: "inherit",
              }}>
                {tab === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ marginBottom: 32 }}>
              <h1 style={{ color: "#0a1a0f", fontSize: 28, fontWeight: 800, marginBottom: 6, fontFamily: "var(--font-syne)", letterSpacing: "-0.02em" }}>
                {mode === "login" ? "Bem-vindo de volta" : "Comece agora"}
              </h1>
              <p style={{ color: "#7aaa8a", fontSize: 14 }}>
                {mode === "login" ? "Acesse o painel da sua área verde" : "Crie sua conta e monitore em minutos"}
              </p>
            </motion.div>
          </AnimatePresence>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#3d6b4a", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: focused === "email" ? "#1a5c2e" : "#b0c4b8", transition: "color 0.2s" }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                  placeholder="seu@email.com"
                  style={{ width: "100%", paddingLeft: 42, paddingRight: 16, paddingTop: 13, paddingBottom: 13, borderRadius: 12, border: `1.5px solid ${focused === "email" ? "#1a5c2e" : "#e0eae4"}`, backgroundColor: focused === "email" ? "#fafcfa" : "#f8fbf8", color: "#0a1a0f", fontSize: 14, outline: "none", transition: "all 0.2s", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#3d6b4a", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Senha</label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: focused === "password" ? "#1a5c2e" : "#b0c4b8", transition: "color 0.2s" }} />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                  placeholder="mínimo 6 caracteres"
                  style={{ width: "100%", paddingLeft: 42, paddingRight: 46, paddingTop: 13, paddingBottom: 13, borderRadius: 12, border: `1.5px solid ${focused === "password" ? "#1a5c2e" : "#e0eae4"}`, backgroundColor: focused === "password" ? "#fafcfa" : "#f8fbf8", color: "#0a1a0f", fontSize: 14, outline: "none", transition: "all 0.2s", boxSizing: "border-box", fontFamily: "inherit" }}
                />
                <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#b0c4b8", display: "flex", alignItems: "center", padding: 0, transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#1a5c2e")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#b0c4b8")}>
                  {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>

              {mode === "register" && password.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: 8, display: "flex", gap: 4, alignItems: "center" }}>
                  {[1, 2, 3, 4].map((level) => {
                    const strength = password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
                    return <div key={level} style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor: level <= strength ? strength <= 1 ? "#e05252" : strength <= 2 ? "#c4942a" : strength <= 3 ? "#1a9e4a" : "#1a5c2e" : "#e0eae4", transition: "background-color 0.3s" }} />;
                  })}
                  <span style={{ fontSize: 10, color: "#9ab4a2", marginLeft: 4, whiteSpace: "nowrap" }}>
                    {password.length < 6 ? "fraca" : password.length < 10 ? "razoável" : /[A-Z]/.test(password) && /[0-9]/.test(password) ? "forte" : "boa"}
                  </span>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  style={{ fontSize: 12, padding: "10px 14px", borderRadius: 10, color: "#c0392b", backgroundColor: "#fdf3f3", border: "1px solid #f5c6c6", margin: 0 }}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, padding: "10px 14px", borderRadius: 10, color: "#1a5c2e", backgroundColor: "#f0faf3", border: "1px solid #b8ddc8" }}>
                  <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={isReady && !loading ? { scale: 1.015, boxShadow: "0 8px 32px #1a5c2e50" } : {}}
              whileTap={isReady && !loading ? { scale: 0.985 } : {}}
              onClick={handleSubmit} disabled={loading || !isReady}
              style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: isReady && !loading ? "linear-gradient(135deg, #1a5c2e, #2d8a4e)" : "#e0eae4", color: isReady && !loading ? "#ffffff" : "#a0b8a8", fontSize: 14, fontWeight: 700, cursor: loading || !isReady ? "not-allowed" : "pointer", transition: "all 0.25s", boxShadow: isReady && !loading ? "0 4px 20px #1a5c2e33" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.01em", fontFamily: "inherit", marginTop: 4 }}
            >
              {loading ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><Loader2 style={{ width: 15, height: 15 }} /></motion.div>{mode === "login" ? "Entrando..." : "Criando conta..."}</>
              ) : (
                <>{mode === "login" ? "Entrar na plataforma" : "Criar conta grátis"}<ArrowRight style={{ width: 15, height: 15 }} /></>
              )}
            </motion.button>
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link href="/" style={{ color: "#b0c4b8", fontSize: 12, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e: any) => (e.target.style.color = "#1a5c2e")}
              onMouseLeave={(e: any) => (e.target.style.color = "#b0c4b8")}>
              ← Voltar ao site
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}