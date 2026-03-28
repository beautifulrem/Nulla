import { useState } from "react";
import { DEFAULT_ONBOARD_FORM, OnboardGuardianInput } from "./guardianTypes";

export function useGuardianSetupForm(initial: Partial<OnboardGuardianInput> = {}) {
  const [form, setForm] = useState<OnboardGuardianInput>({
    ...DEFAULT_ONBOARD_FORM,
    ...initial,
    allowlist: initial.allowlist ?? DEFAULT_ONBOARD_FORM.allowlist,
    blacklist: initial.blacklist ?? DEFAULT_ONBOARD_FORM.blacklist,
  });

  function updateField<K extends keyof OnboardGuardianInput>(key: K, value: OnboardGuardianInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateListField(key: "allowlist" | "blacklist", index: number, value: string) {
    setForm((current) => {
      const next = [...current[key]];
      next[index] = value;
      return { ...current, [key]: next };
    });
  }

  function addListItem(key: "allowlist" | "blacklist") {
    setForm((current) => ({ ...current, [key]: [...current[key], ""] }));
  }

  function removeListItem(key: "allowlist" | "blacklist", index: number) {
    setForm((current) => {
      const next = current[key].filter((_, itemIndex) => itemIndex !== index);
      return { ...current, [key]: next.length ? next : [""] };
    });
  }

  function reset() {
    setForm(DEFAULT_ONBOARD_FORM);
  }

  return {
    form,
    updateField,
    updateListField,
    addListItem,
    removeListItem,
    reset,
  };
}
