"use client";

import type { GuardMode } from "../../hooks/guardianTypes";
import { toneForMode } from "./ui";

export function ShieldStateBadge({ mode }: { mode: GuardMode }) {
  const tone = toneForMode(mode);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 14px",
        borderRadius: 999,
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontWeight: 800,
        background: tone.background,
        border: tone.border,
        color: tone.color,
        boxShadow: mode === "SHIELD" ? "0 0 0 6px rgba(255, 112, 93, 0.08)" : "none",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: mode === "SHIELD" ? "var(--accent-risk)" : "var(--accent-safe)",
        }}
      />
      {tone.label}
    </span>
  );
}
