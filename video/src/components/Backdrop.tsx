import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";

// Large faint facets, echoing the app's FacetBackdrop behind its blue headers.
const FACETS: { points: string; o: number }[] = [
  { points: "0,0 640,0 0,520", o: 0.05 },
  { points: "1920,0 1280,0 1920,600", o: 0.045 },
  { points: "0,1080 760,1080 0,420", o: 0.035 },
  { points: "1920,1080 1180,1080 1920,380", o: 0.05 },
  { points: "720,0 1240,0 980,300", o: 0.025 },
];

/** The soft navy stage every scene sits on. Drifts very slowly so it never feels frozen. */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 140) * 10;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 90% at 50% 38%, ${C.blue800} 0%, ${C.blue950} 55%, ${C.navy} 100%)`,
      }}
    >
      <svg width={1920} height={1080} style={{ position: "absolute", translate: `${drift}px 0px` }}>
        {FACETS.map((f) => (
          <polygon key={f.points} points={f.points} fill="#ffffff" opacity={f.o} />
        ))}
      </svg>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(80% 70% at 50% 50%, transparent 60%, rgba(2,8,22,0.45) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
