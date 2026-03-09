import { Skeleton, SkeletonCard } from "./Skeleton";
import { SensorCardSkeleton } from "./DashboardSkeleton";

export default function StationDetailSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Skeleton width={90}  height={32} radius={8} />
        <Skeleton width={8}   height={14} radius={4} />
        <Skeleton width={120} height={14} radius={6} />
      </div>

      {/* Header card */}
      <SkeletonCard style={{ borderRadius: 16, padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Skeleton width={52} height={52} radius={14} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Skeleton width={180} height={20} radius={6} />
                <Skeleton width={70}  height={22} radius={999} />
              </div>
              <Skeleton width={240} height={12} radius={5} />
              <Skeleton width={140} height={12} radius={5} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
            <Skeleton width={110} height={36} radius={10} />
            <div style={{ display: "flex", gap: 10 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", minWidth: 80 }}>
                  <Skeleton width={20}  height={20} radius={6} />
                  <Skeleton width={40}  height={18} radius={5} />
                  <Skeleton width={55}  height={10} radius={4} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SkeletonCard>

      {/* Map + sensor list */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Skeleton width="100%" height={300} radius={16} />
        <SkeletonCard style={{ borderRadius: 16, padding: "18px", height: 300 }}>
          <Skeleton width={120} height={14} radius={5} style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Skeleton width={8}   height={8}  radius={999} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Skeleton width={100} height={12} radius={4} />
                    <Skeleton width={70}  height={10} radius={4} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                  <Skeleton width={60} height={11} radius={4} />
                  <Skeleton width={30} height={10} radius={4} />
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>

      {/* Sensor cards */}
      <div>
        <Skeleton width={160} height={14} radius={5} style={{ marginBottom: 16 }} />
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