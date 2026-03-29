import type { CSSProperties } from "react";
import { getExplorerTxUrl } from "../../lib/chains";

export const pageShell: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 12% 18%, rgba(86, 182, 255, 0.18), transparent 24%), radial-gradient(circle at 88% 14%, rgba(255, 173, 86, 0.16), transparent 22%), radial-gradient(circle at 50% 100%, rgba(35, 57, 120, 0.32), transparent 44%), linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-surface) 46%, var(--bg-shell) 100%)",
  color: "var(--text-primary)",
};

export const contentWrap: CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: "40px 22px 96px",
};

export const card: CSSProperties = {
  position: "relative",
  border: "1px solid var(--border-strong)",
  background:
    "linear-gradient(180deg, rgba(15, 24, 49, 0.92) 0%, rgba(10, 16, 35, 0.88) 100%)",
  backdropFilter: "blur(18px)",
  borderRadius: 28,
  boxShadow: "0 28px 90px rgba(0, 0, 0, 0.38)",
  overflow: "hidden",
};

export const cardInner: CSSProperties = {
  padding: 24,
};

export const cardGlow: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at top right, rgba(86, 182, 255, 0.14), transparent 26%), radial-gradient(circle at left center, rgba(255, 173, 86, 0.1), transparent 30%)",
};

export const heroGrid: CSSProperties = {
  display: "grid",
  gap: 18,
};

export const grid2: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18,
};

export const grid3: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 18,
};

export const eyebrow: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

export const title: CSSProperties = {
  margin: 0,
  fontSize: 18,
  lineHeight: 1.15,
  letterSpacing: "-0.03em",
  fontFamily: "var(--font-heading)",
};

export const subtitle: CSSProperties = {
  margin: "8px 0 0",
  color: "var(--text-secondary)",
  fontSize: 14,
  lineHeight: 1.65,
};

export const heroTitle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(42px, 7vw, 78px)",
  lineHeight: 0.92,
  letterSpacing: "-0.06em",
  fontFamily: "var(--font-heading)",
  maxWidth: 980,
};

export const heroCopy: CSSProperties = {
  margin: 0,
  maxWidth: 820,
  fontSize: 18,
  lineHeight: 1.75,
  color: "var(--text-secondary)",
};

export const pill: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 13px",
  borderRadius: 999,
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  border: "1px solid var(--border-soft)",
  background: "var(--panel-soft)",
  color: "var(--text-secondary)",
};

export const mono: CSSProperties = {
  fontFamily: "var(--font-mono)",
};

export const wrapAnywhere: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export const monoWrap: CSSProperties = {
  ...mono,
  ...wrapAnywhere,
};

export const primaryButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 50,
  padding: "0 18px",
  borderRadius: 16,
  background: "linear-gradient(135deg, var(--accent-hot) 0%, var(--accent-cool) 100%)",
  color: "#07101f",
  fontWeight: 800,
  letterSpacing: "-0.02em",
  textDecoration: "none",
  boxShadow: "0 12px 34px rgba(86, 182, 255, 0.18)",
};

export const secondaryButton: CSSProperties = {
  ...primaryButton,
  background: "rgba(255,255,255,0.05)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-soft)",
  boxShadow: "none",
};

export const tertiaryButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0 14px",
  borderRadius: 14,
  border: "1px solid var(--border-soft)",
  background: "rgba(255,255,255,0.03)",
  color: "var(--text-primary)",
  fontWeight: 700,
  cursor: "pointer",
};

export const fieldLabel: CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

export const fieldInput: CSSProperties = {
  width: "100%",
  minWidth: 0,
  borderRadius: 16,
  border: "1px solid var(--border-soft)",
  background: "rgba(255,255,255,0.035)",
  color: "var(--text-primary)",
  padding: "13px 14px",
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
};

export const panelSoft: CSSProperties = {
  borderRadius: 20,
  border: "1px solid var(--border-soft)",
  background: "var(--panel-soft)",
  padding: 16,
};

export const metricValue: CSSProperties = {
  marginTop: 6,
  fontSize: 24,
  fontWeight: 800,
  letterSpacing: "-0.04em",
  fontFamily: "var(--font-heading)",
};

export const metricLabel: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

export const timelineTrack: CSSProperties = {
  display: "grid",
  gap: 14,
  marginTop: 18,
};

export function formatAddress(address?: string | null, leading = 6, trailing = 4) {
  if (!address) return "Pending";
  if (address.length <= leading + trailing + 2) return address;
  return `${address.slice(0, leading + 2)}…${address.slice(-trailing)}`;
}

export function toneForMode(mode: "MONITOR" | "SHIELD") {
  return mode === "SHIELD"
    ? {
        background: "rgba(255, 111, 92, 0.18)",
        border: "1px solid rgba(255, 111, 92, 0.32)",
        color: "#ffd0c7",
        label: "Shield Mode",
      }
    : {
        background: "rgba(89, 231, 161, 0.14)",
        border: "1px solid rgba(89, 231, 161, 0.28)",
        color: "#c5ffe4",
        label: "Monitor Mode",
      };
}

export function txLink(chainId: number, hash?: string | null) {
  if (!hash) return undefined;
  return getExplorerTxUrl(chainId, hash);
}
