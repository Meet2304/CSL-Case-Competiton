import React from "react";
import { C } from "../theme";

// The same faceted four-point spark as the app's FindoeLogo (src/components/brand/FindoeLogo.tsx).
const arms: { points: string; fill: string }[] = [
  { points: "12,3 10.3,10.3 12,12", fill: "rgba(255,255,255,1)" },
  { points: "12,3 13.7,10.3 12,12", fill: C.orange },
  { points: "21,12 13.7,10.3 12,12", fill: "rgba(255,255,255,0.85)" },
  { points: "21,12 13.7,13.7 12,12", fill: "rgba(255,255,255,0.55)" },
  { points: "12,21 13.7,13.7 12,12", fill: "rgba(255,255,255,0.7)" },
  { points: "12,21 10.3,13.7 12,12", fill: "rgba(255,255,255,0.4)" },
  { points: "3,12 10.3,13.7 12,12", fill: "rgba(255,255,255,0.6)" },
  { points: "3,12 10.3,10.3 12,12", fill: "rgba(255,255,255,0.9)" },
];

/** Findoe's logo tile. `spin` turns the spark (degrees); `tile` false draws the spark alone. */
export const FindoeMark: React.FC<{ size: number; spin?: number; tile?: boolean }> = ({
  size,
  spin = 0,
  tile = true,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    {tile ? <rect width="24" height="24" rx="7" fill={C.navy} /> : null}
    <g transform={`rotate(${spin} 12 12)`}>
      {arms.map((a) => (
        <polygon key={a.points} points={a.points} fill={a.fill} />
      ))}
    </g>
    <circle cx="18.6" cy="5.4" r="1.25" fill={C.orange} />
  </svg>
);
