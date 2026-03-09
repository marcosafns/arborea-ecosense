import { Skeleton, SkeletonCard } from "./Skeleton";

export default function StationsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width={120} height={24} radius={6} />
          <Skeleton width={200} height={14} radius={6} />
        </div>
        <Skeleton width={130} height={36} radius={10} />
      </div>

      {/* Station cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} style={{ borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Skeleton width={48} height={48} radius={13} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <Skeleton width={150} height={16} radius={5} />
                <Skeleton width={220} height={12} radius={5} />
                <div style={{ display: "flex", gap: 6 }}>
                  <Skeleton width={60}  height={20} radius={999} />
                  <Skeleton width={80}  height={20} radius={999} />
                  <Skeleton width={50}  height={20} radius={999} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Skeleton width={70}  height={32} radius={8} />
              <Skeleton width={36}  height={32} radius={8} />
            </div>
          </div>

          {/* Sensor chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 16, borderTop: "1px solid #f0f4f1" }}>
            {Array.from({ length: 8 }).map((_, j) => (
              <Skeleton key={j} width={90} height={26} radius={8} />
            ))}
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}