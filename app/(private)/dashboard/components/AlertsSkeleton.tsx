import { Skeleton, SkeletonCard } from "./Skeleton";

export default function AlertsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width={100} height={24} radius={6} />
          <Skeleton width={200} height={14} radius={6} />
        </div>
        <Skeleton width={130} height={36} radius={10} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton width={80}  height={10} radius={4} />
              <Skeleton width={50}  height={28} radius={6} />
              <Skeleton width={100} height={10} radius={4} />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width={80} height={32} radius={999} />
        ))}
      </div>

      {/* Alert rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} style={{ borderRadius: 14, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Skeleton width={36} height={36} radius={10} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton width={260} height={13} radius={5} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Skeleton width={80}  height={10} radius={4} />
                    <Skeleton width={60}  height={10} radius={4} />
                    <Skeleton width={90}  height={10} radius={4} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Skeleton width={70}  height={28} radius={8} />
                <Skeleton width={28}  height={28} radius={8} />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}