import { Skeleton, SkeletonCard } from "./Skeleton";

export default function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width={160} height={24} radius={6} />
          <Skeleton width={260} height={14} radius={6} />
        </div>
        <Skeleton width={110} height={36} radius={10} />
      </div>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ height: 3, backgroundColor: "#e8ede9", borderRadius: "14px 14px 0 0", position: "absolute", top: 0, left: 0, right: 0 }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 4 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton width={90}  height={10} radius={4} />
                <Skeleton width={50}  height={28} radius={6} />
                <Skeleton width={70}  height={10} radius={4} />
              </div>
              <Skeleton width={38} height={38} radius={10} />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Estação */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Skeleton width={8}  height={8}  radius={999} />
          <Skeleton width={140} height={14} radius={6} />
          <Skeleton width={70}  height={22} radius={999} />
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SensorCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SensorCardSkeleton() {
  return (
    <div style={{
      backgroundColor: "#ffffff", border: "1px solid #e8ede9",
      borderRadius: 16, padding: "18px",
      boxShadow: "0 1px 4px #0f1f1206",
    }}>
      {/* Top bar */}
      <div style={{ height: 3, backgroundColor: "#e8ede9", borderRadius: "16px 16px 0 0", margin: "-18px -18px 16px" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton width={80}  height={10} radius={4} />
          <Skeleton width={110} height={10} radius={4} />
        </div>
        <Skeleton width={44} height={18} radius={999} />
      </div>

      {/* Value */}
      <div style={{ marginBottom: 14 }}>
        <Skeleton width={120} height={36} radius={6} />
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <Skeleton width="100%" height={9}  radius={4} />
            <Skeleton width="70%"  height={13} radius={4} />
          </div>
        ))}
      </div>

      {/* Range bar */}
      <Skeleton width="100%" height={4}  radius={999} style={{ marginBottom: 12 }} />

      {/* Sparkline */}
      <Skeleton width="100%" height={40} radius={6}   style={{ marginBottom: 12 }} />

      {/* Footer */}
      <Skeleton width={130} height={10} radius={4} />
    </div>
  );
}