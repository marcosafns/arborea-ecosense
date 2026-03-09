import { JOURNEY } from "@/constants";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { Calendar } from "lucide-react";

export default function Journey() {
  return (
    <section id="jornada" style={{ backgroundColor: "var(--surface)" }} className="py-28 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <AnimateOnScroll className="mb-20 max-w-xl">
          <span style={{
            color: "#2d8a4e", fontSize: 11, letterSpacing: "0.12em",
            textTransform: "uppercase", fontWeight: 600,
            display: "block", marginBottom: 16,
          }}>
            Nossa Jornada
          </span>
          <h2 style={{
            color: "var(--text-primary)",
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 800, letterSpacing: "-0.03em",
            lineHeight: 1.1, marginBottom: 16,
            fontFamily: "var(--font-syne)",
          }}>
            De uma ideia a um
            <br />
            <span style={{ color: "#1a5c2e" }}>sistema real.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7 }}>
            A Arborea nasceu da vontade de usar tecnologia a serviço da natureza —
            e cada passo dessa jornada reflete esse compromisso.
          </p>
        </AnimateOnScroll>

        {/* Timeline */}
        <div style={{ position: "relative" }}>

          {/* Vertical line */}
          <div style={{
            position: "absolute", left: 19, top: 0, bottom: 0, width: 1,
            background: "linear-gradient(to bottom, #1a5c2e, #1a5c2e44, transparent)",
          }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {JOURNEY.map((item, i) => (
              <AnimateOnScroll key={i} delay={i * 100}>
                <div style={{
                  display: "flex", gap: 32,
                  paddingBottom: i < JOURNEY.length - 1 ? 40 : 0,
                }}>
                  {/* Left — dot + year */}
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    {/* Dot */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, zIndex: 1,
                      backgroundColor: i === 0 ? "#1a5c2e" : "var(--bg-card)",
                      border: `2px solid ${i === 0 ? "#1a5c2e" : "#c8e0cf"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Calendar style={{
                        width: 15, height: 15,
                        color: i === 0 ? "#ffffff" : "#2d8a4e",
                      }} />
                    </div>
                  </div>

                  {/* Right — card */}
                  <div style={{
                    flex: 1, paddingTop: 6,
                    paddingBottom: i < JOURNEY.length - 1 ? 0 : 0,
                  }}>
                    <div style={{
                      backgroundColor: "var(--bg-card)",
                      border: `1px solid ${i === 0 ? "#1a5c2e44" : "var(--border)"}`,
                      borderRadius: 18, padding: "22px 24px",
                      transition: "all 0.25s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    className="journey-card"
                    >
                      {/* Accent left border */}
                      <div style={{
                        position: "absolute", top: 0, left: 0, bottom: 0,
                        width: 3,
                        backgroundColor: "#1a5c2e",
                        opacity: i === 0 ? 0.8 : 0.25,
                        borderRadius: "18px 0 0 18px",
                      }} />

                      <div style={{ paddingLeft: 12 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                          textTransform: "uppercase", color: "#2d8a4e",
                          display: "block", marginBottom: 8,
                          fontFamily: "var(--font-geist-mono)",
                        }}>
                          {item.year}
                        </span>
                        <h3 style={{
                          color: "var(--text-primary)", fontWeight: 700,
                          fontSize: 17, marginBottom: 8,
                          fontFamily: "var(--font-syne)",
                        }}>
                          {item.title}
                        </h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.75 }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .journey-card:hover {
          border-color: #1a5c2e44 !important;
          transform: translateX(4px);
          box-shadow: 0 8px 32px #00000010;
        }
      `}</style>
    </section>
  );
}