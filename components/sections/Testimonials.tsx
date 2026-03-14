"use client";

import { Quote } from "lucide-react";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

const TESTIMONIALS = [
  { name:"Carlos Mendonça",  role:"Gestor de Parques",              org:"Prefeitura de Campinas",         avatar:"CM", color:"#1a5c2e", quote:"O EcoSense transformou como gerenciamos nossos 12 parques municipais. Antes dependíamos de inspeções manuais semanais. Hoje recebemos alertas em tempo real e tomamos decisões muito mais rápido." },
  { name:"Ana Figueiredo",   role:"Engenheira Ambiental",           org:"EcoConsult SP",                  avatar:"AF", color:"#2a7fd4", quote:"A qualidade dos dados é impressionante. Consigo acompanhar pH, umidade e temperatura do solo de 8 pontos distintos num único dashboard. Economizei pelo menos 20 horas de campo por mês." },
  { name:"Roberto Teixeira", role:"Diretor Técnico",                org:"Fazenda Verde Org.",             avatar:"RT", color:"#c4942a", quote:"Implementamos em nossa área de reflorestamento de 40 hectares. Os alertas de anomalia já nos salvaram duas vezes de problemas sérios com pragas. O retorno sobre o investimento foi imediato." },
  { name:"Priscila Saraiva", role:"Pesquisadora",                   org:"Universidade Federal do Paraná", avatar:"PS", color:"#7a2ad4", quote:"Usamos o EcoSense para nosso projeto de pesquisa com cerrado nativo. A exportação de dados em CSV facilitou muito a integração com nossas ferramentas de análise estatística." },
  { name:"Henrique Lopes",   role:"Sócio Fundador",                 org:"Jardim Botânico Particular",    avatar:"HL", color:"#2ab5a0", quote:"Comecei com o plano Broto e logo precisei migrar para o Floresta. O suporte foi excelente na transição. Hoje monitoro 47 espécies raras com total confiança nos dados." },
  { name:"Fernanda Castelo", role:"Coordenadora de Sustentabilidade", org:"Grupo Agro Verde",            avatar:"FC", color:"#d4622a", quote:"A interface é muito bem feita — minha equipe inteira aprendeu a usar em menos de uma hora. Os gráficos históricos são exatamente o que precisávamos para nossos relatórios de impacto." },
];

export default function Testimonials() {
  return (
    <section id="depoimentos" style={{ backgroundColor: "var(--bg)" }} className="py-16 sm:py-28 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        <AnimateOnScroll className="mb-10 sm:mb-16">
          <span style={{ color: "#2d8a4e", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 16 }}>
            Depoimentos
          </span>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <h2 style={{
              color: "var(--text-primary)", fontSize: "clamp(1.8rem, 5vw, 3.2rem)",
              fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1,
              fontFamily: "var(--font-syne)",
            }}>
              Quem já planta<br />
              <span style={{ color: "#1a5c2e" }}>com a gente.</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 360, lineHeight: 1.7 }}>
              Gestores, pesquisadores e produtores que confiam no EcoSense para proteger suas áreas verdes.
            </p>
          </div>
        </AnimateOnScroll>

        {/* 1 col mobile → auto-fill 300px+ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 16 }}>
          {TESTIMONIALS.map((t, i) => (
            <AnimateOnScroll key={t.name} delay={i * 70}>
              <TestimonialCard {...t} />
            </AnimateOnScroll>
          ))}
        </div>

        {/* Stats — 1 col mobile, 3 col sm+ */}
        <AnimateOnScroll delay={200}>
          <div style={{
            marginTop: 40, display: "grid",
            gap: 1, backgroundColor: "var(--border)",
            border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden",
          }} className="grid-cols-1 sm:grid-cols-3-stats">
            {[
              { value: "98%",    label: "de satisfação dos clientes" },
              { value: "< 2min", label: "tempo médio de resposta ao suporte" },
              { value: "4.9★",   label: "avaliação média na plataforma" },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: "20px 24px", textAlign: "center", backgroundColor: "var(--bg-card)" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#2d8a4e", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.03em", marginBottom: 6 }}>
                  {stat.value}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </div>

      <style>{`
        .grid-cols-1 { grid-template-columns: 1fr; }
        @media (min-width: 640px) { .sm\\:grid-cols-3-stats { grid-template-columns: repeat(3, 1fr) !important; } }
        .testimonial-card:hover {
          border-color: var(--hover-color, #1a5c2e55) !important;
          transform: translateY(-3px);
          box-shadow: 0 12px 40px #00000010;
        }
      `}</style>
    </section>
  );
}

function TestimonialCard({ name, role, org, avatar, color, quote }: typeof TESTIMONIALS[0]) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 18, padding: "24px",
        display: "flex", flexDirection: "column", gap: 20,
        height: "100%", transition: "all 0.25s ease",
        ["--hover-color" as any]: `${color}55`,
      }}
      className="testimonial-card"
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Quote style={{ width: 14, height: 14, color }} />
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.75, flex: 1, fontStyle: "italic" }}>
        "{quote}"
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          backgroundColor: `${color}18`, border: `1px solid ${color}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color,
        }}>
          {avatar}
        </div>
        <div>
          <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>{name}</div>
          <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{role} · {org}</div>
        </div>
      </div>
    </div>
  );
}