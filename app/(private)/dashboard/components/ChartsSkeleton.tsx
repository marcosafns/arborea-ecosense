import { Skeleton, SkeletonCard } from "./Skeleton";

export default function ChartsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width={140} height={24} radius={6} />
          <Skeleton width={220} height={14} radius={6} />
        </div>
        <Skeleton width={160} height={36} radius={10} />
      </div>

      {/* Charts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} style={{ borderRadius: 16, padding: "20px" }}>
            {/* Chart header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton width={100} height={14} radius={4} />
                <Skeleton width={60}  height={11} radius={4} />
              </div>
              {/* Range selector */}
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} width={30} height={26} radius={6} />
                ))}
              </div>
            </div>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <Skeleton width="80%" height={9}  radius={4} />
                  <Skeleton width="60%" height={16} radius={4} />
                </div>
              ))}
            </div>
            {/* Chart area */}
            <Skeleton width="100%" height={160} radius={10} />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}