import { CSSProperties } from "react";

interface SkeletonProps {
  width?:  string | number;
  height?: string | number;
  radius?: number;
  style?:  CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, radius = 8, style }: SkeletonProps) {
  return (
    <>
      <div
        className="skeleton-pulse"
        style={{
          width, height, borderRadius: radius,
          backgroundColor: "var(--skeleton-base, #e8ede9)",
          flexShrink: 0,
          ...style,
        }}
      />
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .skeleton-pulse {
          background-image: linear-gradient(
            90deg,
            var(--skeleton-base, #e8ede9) 25%,
            var(--skeleton-shine, #f4f7f4) 50%,
            var(--skeleton-base, #e8ede9) 75%
          );
          background-size: 800px 100%;
          animation: skeleton-shimmer 1.6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

// Card genérico com padding
export function SkeletonCard({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      backgroundColor: "#ffffff",
      border: "1px solid #e8ede9",
      borderRadius: 14,
      padding: "18px 20px",
      boxShadow: "0 1px 4px #0f1f1206",
      ...style,
    }}>
      {children}
    </div>
  );
}