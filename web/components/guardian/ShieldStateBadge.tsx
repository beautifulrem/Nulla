"use client";

import { GuardMode } from "../../hooks/guardianTypes";
import { pill } from "./ui";

export function ShieldStateBadge({ mode }: { mode: GuardMode }) {
  const label = mode === "SHIELD" ? "Shield Mode" : "Monitor Mode";
  const background = mode === "SHIELD" ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)";
  const color = mode === "SHIELD" ? "#fecaca" : "#bbf7d0";

  return <span style={{ ...pill, background, color }}>{label}</span>;
}
