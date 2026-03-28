import type { CSSProperties } from "react";

export const pageShell: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255, 225, 180, 0.25), transparent 28%), radial-gradient(circle at top right, rgba(180, 220, 255, 0.18), transparent 24%), linear-gradient(180deg, #0b1020 0%, #0f172a 45%, #101827 100%)",
  color: "#e5eefc",
};

export const contentWrap: CSSProperties = {
  maxWidth: 1240,
  margin: "0 auto",
  padding: "32px 20px 80px",
};

export const card: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(8, 15, 34, 0.72)",
  backdropFilter: "blur(14px)",
  borderRadius: 24,
  boxShadow: "0 22px 64px rgba(0, 0, 0, 0.28)",
};

export const cardInner: CSSProperties = {
  padding: 20,
};

export const title: CSSProperties = {
  margin: 0,
  fontSize: 18,
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
};

export const subtitle: CSSProperties = {
  margin: "8px 0 0",
  color: "rgba(229, 238, 252, 0.7)",
  fontSize: 14,
  lineHeight: 1.6,
};

export const grid2: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
};

export const grid3: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

export const pill: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
};

export const mono: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};
