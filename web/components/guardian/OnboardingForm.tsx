"use client";

import type { CSSProperties } from "react";
import { OnboardGuardianInput } from "../../hooks/guardianTypes";
import { card, cardInner, subtitle, title } from "./ui";

type Props = {
  form: OnboardGuardianInput;
  onChange: <K extends keyof OnboardGuardianInput>(key: K, value: OnboardGuardianInput[K]) => void;
  onListChange: (key: "allowlist" | "blacklist", index: number, value: string) => void;
  onListAdd: (key: "allowlist" | "blacklist") => void;
  onListRemove: (key: "allowlist" | "blacklist", index: number) => void;
  onSubmit: () => void;
  submitting?: boolean;
};

function renderList(
  key: "allowlist" | "blacklist",
  values: string[],
  onListChange: Props["onListChange"],
  onListAdd: Props["onListAdd"],
  onListRemove: Props["onListRemove"],
) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {values.map((value, index) => (
        <div key={`${key}-${index}`} style={{ display: "flex", gap: 8 }}>
          <input
            value={value}
            onChange={(event) => onListChange(key, index, event.target.value)}
            placeholder={`${key} spender ${index + 1}`}
            style={inputStyle}
          />
          <button type="button" onClick={() => onListRemove(key, index)} style={ghostButtonStyle}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onListAdd(key)} style={ghostButtonStyle}>
        Add {key}
      </button>
    </div>
  );
}

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "#e5eefc",
  padding: "12px 14px",
};

const ghostButtonStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#e5eefc",
  padding: "12px 14px",
  cursor: "pointer",
};

export function OnboardingForm({
  form,
  onChange,
  onListChange,
  onListAdd,
  onListRemove,
  onSubmit,
  submitting,
}: Props) {
  return (
    <section style={card}>
      <div style={cardInner}>
        <h2 style={title}>Enable Guardian Mode</h2>
        <p style={subtitle}>One submission, then the backend composes the Safe actions you need.</p>
        <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 13 }}>Safe address</span>
            <input value={form.safeAddress} onChange={(event) => onChange("safeAddress", event.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 13 }}>Owner address</span>
            <input value={form.ownerAddress} onChange={(event) => onChange("ownerAddress", event.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 13 }}>Ethereum token</span>
            <input value={form.tokenEth} onChange={(event) => onChange("tokenEth", event.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 13 }}>Base token</span>
            <input value={form.tokenBase} onChange={(event) => onChange("tokenBase", event.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 13 }}>Approval cap</span>
            <input value={form.cap} onChange={(event) => onChange("cap", event.target.value)} style={inputStyle} />
          </label>
          <div style={{ display: "grid", gap: 12 }}>
            <span style={{ fontSize: 13 }}>Allowlist</span>
            {renderList("allowlist", form.allowlist, onListChange, onListAdd, onListRemove)}
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <span style={{ fontSize: 13 }}>Blacklist</span>
            {renderList("blacklist", form.blacklist, onListChange, onListAdd, onListRemove)}
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            style={{
              ...ghostButtonStyle,
              background: "linear-gradient(135deg, #f5b87a 0%, #8ad3ff 100%)",
              color: "#0b1020",
              fontWeight: 700,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Creating Guardian Mode..." : "Enable Guardian Mode"}
          </button>
        </div>
      </div>
    </section>
  );
}
