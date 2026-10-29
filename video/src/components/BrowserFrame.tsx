import React from "react";
import { AbsoluteFill } from "remotion";
import { Lock } from "lucide-react";
import { FRAME, VIEWPORT, pageTransform, type Camera } from "../camera";
import { C, FONT } from "../theme";

export type FrameLayer = {
  key: string;
  /** An <Img> or <Video> sized 1920x1080 (CSS px of the capture). */
  content: React.ReactNode;
  camera: Camera;
  opacity?: number;
};

/**
 * A clean browser window holding real app captures. Each layer has its own
 * camera (zoom/pan over the 1920x1080 page), so a crossfade between two shots
 * can also change framing. `overlay` renders in composition space, clipped to
 * the page viewport; `children` render unclipped on top.
 */
export const BrowserFrame: React.FC<{
  url: string;
  layers: FrameLayer[];
  overlay?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ url, layers, overlay, children }) => {
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: FRAME.x,
          top: FRAME.y,
          width: FRAME.w,
          height: FRAME.h + FRAME.chrome,
          borderRadius: FRAME.radius,
          boxShadow: "0 40px 90px rgba(2, 10, 30, 0.55), 0 8px 24px rgba(2, 10, 30, 0.35)",
          background: C.surface,
        }}
      />
      <Chrome url={url} />
      <div
        style={{
          position: "absolute",
          left: VIEWPORT.x,
          top: VIEWPORT.y,
          width: VIEWPORT.w,
          height: VIEWPORT.h,
          overflow: "hidden",
          borderBottomLeftRadius: FRAME.radius,
          borderBottomRightRadius: FRAME.radius,
          background: C.surface,
        }}
      >
        {layers.map((l) =>
          (l.opacity ?? 1) <= 0 ? null : (
            <div
              key={l.key}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 1920,
                height: 1080,
                transformOrigin: "0 0",
                transform: pageTransform(l.camera),
                opacity: l.opacity ?? 1,
              }}
            >
              {l.content}
            </div>
          ),
        )}
      </div>
      {overlay ? <ViewportClip>{overlay}</ViewportClip> : null}
      {children}
    </AbsoluteFill>
  );
};

/** Clips composition-space overlays to the page viewport. */
export const ViewportClip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      clipPath: `inset(${VIEWPORT.y}px ${1920 - VIEWPORT.x - VIEWPORT.w}px ${
        1080 - VIEWPORT.y - VIEWPORT.h
      }px ${VIEWPORT.x}px round 0 0 ${FRAME.radius}px ${FRAME.radius}px)`,
    }}
  >
    {children}
  </AbsoluteFill>
);

const Chrome: React.FC<{ url: string }> = ({ url }) => (
  <div
    style={{
      position: "absolute",
      left: FRAME.x,
      top: FRAME.y,
      width: FRAME.w,
      height: FRAME.chrome,
      borderTopLeftRadius: FRAME.radius,
      borderTopRightRadius: FRAME.radius,
      background: "linear-gradient(#f4f6f9, #e9edf2)",
      borderBottom: `1px solid ${C.line}`,
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      boxSizing: "border-box",
    }}
  >
    <div style={{ display: "flex", gap: 9 }}>
      {["#f26b5e", "#f5be4f", "#5fc454"].map((c) => (
        <span
          key={c}
          style={{ width: 13, height: 13, borderRadius: 99, background: c, opacity: 0.85 }}
        />
      ))}
    </div>
    <div
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        height: 30,
        minWidth: 520,
        padding: "0 18px",
        borderRadius: 9,
        background: C.white,
        border: `1px solid ${C.line}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: FONT,
        fontSize: 17,
        fontWeight: 500,
        color: C.muted,
        boxSizing: "border-box",
      }}
    >
      <Lock size={14} strokeWidth={2.4} color={C.muted} />
      {url}
    </div>
  </div>
);
