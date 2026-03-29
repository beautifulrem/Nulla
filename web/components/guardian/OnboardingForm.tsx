"use client";

import type { CSSProperties, ReactNode } from "react";
import type { OnboardGuardianInput } from "../../hooks/guardianTypes";
import { card, cardGlow, cardInner, fieldInput, fieldLabel, primaryButton, subtitle, tertiaryButton, title } from "./ui";

type Props = {
  form: OnboardGuardianInput;
  onChange: <K extends keyof OnboardGuardianInput>(key: K, value: OnboardGuardianInput[K]) => void;
  onListChange: (key: "allowlist" | "blacklist", index: number, value: string) => void;
  onListAdd: (key: "allowlist" | "blacklist") => void;
  onListRemove: (key: "allowlist" | "blacklist", index: number) => void;
  onSubmit: () => void;
  submitting?: boolean;
};

function listEditor(
  key: "allowlist" | "blacklist",
  values: string[],
  onListChange: Props["onListChange"],
  onListAdd: Props["onListAdd"],
  onListRemove: Props["onListRemove"],
) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {values.map((value, index) => (
        <div key={`${key}-${index}`} style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
          <input
            value={value}
            onChange={(event) => onListChange(key, index, event.target.value)}
            placeholder={`${key} spender ${index + 1}`}
            style={{ ...fieldInput, flex: 1 }}
          />
          <button type="button" onClick={() => onListRemove(key, index)} style={smallGhostButton}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onListAdd(key)} style={tertiaryButton}>
        Add {key}
      </button>
    </div>
  );
}

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
    <section style={{ ...card, minHeight: 760 }}>
      <div style={cardGlow} />
      <div style={{ ...cardInner, position: "relative", display: "grid", gap: 22 }}>
        <div>
          <h2 style={title}>Enable Guardian Mode</h2>
          <p style={subtitle}>
            Configure the protected Safe once. The backend will compose the cross-chain actions and
            the Safe owner only signs the exact required steps.
          </p>
        </div>

        <FieldGroup label="Protected Safe" description="The same Safe address and owner across Ethereum Sepolia and Base Sepolia.">
          <Field label="Safe address">
            <input value={form.safeAddress} onChange={(event) => onChange("safeAddress", event.target.value)} style={fieldInput} />
          </Field>
          <Field label="Owner address">
            <input value={form.ownerAddress} onChange={(event) => onChange("ownerAddress", event.target.value)} style={fieldInput} />
          </Field>
        </FieldGroup>

        <FieldGroup label="Watched Tokens" description="The token contracts whose approval events are monitored by the Reactive control plane.">
          <Field label="Ethereum token">
            <input value={form.tokenEth} onChange={(event) => onChange("tokenEth", event.target.value)} style={fieldInput} />
          </Field>
          <Field label="Base token">
            <input value={form.tokenBase} onChange={(event) => onChange("tokenBase", event.target.value)} style={fieldInput} />
          </Field>
        </FieldGroup>

        <FieldGroup label="Risk Policy" description="Define the cap and the spender lists that decide whether an approval becomes a cross-chain security event.">
          <Field label="Approval cap">
            <input value={form.cap} onChange={(event) => onChange("cap", event.target.value)} style={fieldInput} />
          </Field>
          <Field label="Allowlist">{listEditor("allowlist", form.allowlist, onListChange, onListAdd, onListRemove)}</Field>
          <Field label="Blacklist">{listEditor("blacklist", form.blacklist, onListChange, onListAdd, onListRemove)}</Field>
        </FieldGroup>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          style={{
            ...primaryButton,
            width: "100%",
            opacity: submitting ? 0.75 : 1,
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          {submitting ? "Composing Guardian Mode..." : "Enable Guardian Mode"}
        </button>
      </div>
    </section>
  );
}

function FieldGroup({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        display: "grid",
        gap: 14,
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.03)",
        padding: 18,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <div style={fieldLabel}>{label}</div>
        <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{description}</div>
      </div>
      <div style={{ display: "grid", gap: 14 }}>{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

const smallGhostButton: CSSProperties = {
  ...tertiaryButton,
  minHeight: 48,
  padding: "0 14px",
};
