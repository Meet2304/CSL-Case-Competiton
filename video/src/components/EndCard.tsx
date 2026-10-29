import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BriefcaseBusiness, ClipboardCheck, Sparkles, Users } from "lucide-react";
import { C, EASE_OUT, FONT } from "../theme";
import { FindoeMark } from "./FindoeMark";

const FEATURES = [
  { label: "Family Dashboard", Icon: Users },
  { label: "Asset Claims", Icon: ClipboardCheck },
  { label: "Ask Findoe", Icon: Sparkles },
  { label: "Advisor Workbench", Icon: BriefcaseBusiness },
];
// The row sits where the wordmark resolves, so the features fold straight into it.
const NODE = { w: 360, h: 96, gap: 64, y: 417 };

/**
 * The close: the four features arrive as connected nodes, then fold into the
 * Findoe wordmark with the line "Clarity for families. Context for advisors."
 * Frames are local; `vo` is where the closing line starts.
 */
export const EndCard: React.FC<{
  nodesAt: number;
  stagger: number;
  convergeAt: number;
  tagline1At: number;
  tagline2At: number;
  teamAt: number;
  end: number;
}> = ({ nodesAt, stagger, convergeAt, tagline1At, tagline2At, teamAt, end }) => {
  const frame = useCurrentFrame();
  const ease = Easing.bezier(...EASE_OUT);
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const rowW = FEATURES.length * NODE.w + (FEATURES.length - 1) * NODE.gap;
  const rowX = (1920 - rowW) / 2;
  const converge = interpolate(frame, [convergeAt, convergeAt + 18], [0, 1], {
    easing: Easing.bezier(0.55, 0, 0.25, 1),
    ...clamp,
  });
  const brand = interpolate(frame, [convergeAt + 8, convergeAt + 30], [0, 1], {
    easing: ease,
    ...clamp,
  });
  const fadeOut = interpolate(frame, [end - 14, end], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, opacity: fadeOut }}>
      {/* Feature nodes and their links */}
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0, opacity: 1 - converge }}
      >
        {FEATURES.slice(1).map((_, k) => {
          const i = k + 1;
          const x0 = rowX + (i - 1) * (NODE.w + NODE.gap) + NODE.w;
          const draw = interpolate(
            frame,
            [nodesAt + i * stagger * 30 - 2, nodesAt + i * stagger * 30 + 6],
            [0, 1],
            clamp,
          );
          // A zero-length round-capped line still paints a dot; skip it until it starts drawing.
          if (draw <= 0) return null;
          return (
            <line
              key={i}
              x1={x0 + 6}
              x2={x0 + 6 + (NODE.gap - 12) * draw}
              y1={NODE.y + NODE.h / 2}
              y2={NODE.y + NODE.h / 2}
              stroke={C.orange}
              strokeWidth={4}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {FEATURES.map(({ label, Icon }, i) => {
        const at = nodesAt + i * stagger * 30;
        const show = interpolate(frame, [at, at + 12], [0, 1], { easing: ease, ...clamp });
        const x = rowX + i * (NODE.w + NODE.gap);
        const toCenter = 960 - (x + NODE.w / 2);
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: x,
              top: NODE.y,
              width: NODE.w,
              height: NODE.h,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(255,255,255,0.22)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "0 24px 0 18px",
              boxSizing: "border-box",
              color: C.white,
              fontSize: 30,
              fontWeight: 600,
              whiteSpace: "nowrap",
              opacity: show * (1 - converge),
              translate: `${toCenter * converge}px ${(1 - show) * 16}px`,
              scale: String(1 - 0.55 * converge),
            }}
          >
            <span
              style={{
                width: 58,
                height: 58,
                borderRadius: 99,
                display: "grid",
                placeItems: "center",
                background: i === 2 ? C.orange : "rgba(255,255,255,0.14)",
                flexShrink: 0,
              }}
            >
              <Icon size={30} color={C.white} strokeWidth={2.2} />
            </span>
            {label}
          </div>
        );
      })}

      {/* Wordmark, line and team */}
      <div
        style={{
          position: "absolute",
          top: 395,
          left: 0,
          width: 1920,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 34,
          opacity: brand,
          scale: String(interpolate(brand, [0, 1], [0.9, 1])),
        }}
      >
        <FindoeMark size={128} spin={interpolate(brand, [0, 1], [-25, 0])} />
        <span
          style={{
            fontSize: 140,
            fontWeight: 600,
            color: C.white,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          Findoe
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 600,
          width: 1920,
          textAlign: "center",
          fontSize: 54,
          fontWeight: 500,
          color: C.white,
          letterSpacing: "-0.005em",
        }}
      >
        <span style={{ opacity: interpolate(frame, [tagline1At, tagline1At + 14], [0, 1], clamp) }}>
          Clarity for families.
        </span>{" "}
        <span style={{ opacity: interpolate(frame, [tagline2At, tagline2At + 14], [0, 1], clamp) }}>
          Context for advisors.
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 760,
          width: 1920,
          textAlign: "center",
          fontSize: 30,
          fontWeight: 500,
          color: "rgba(255,255,255,0.72)",
          letterSpacing: "0.01em",
          opacity: interpolate(frame, [teamAt, teamAt + 16], [0, 1], clamp),
        }}
      >
        Team Findoe · Anjali · Khushi · Max · Meet
      </div>
    </AbsoluteFill>
  );
};
