import { useState } from "react";
import { OnboardGuardianInput, OnboardGuardianResult } from "./guardianTypes";

type OnboardState = {
  data: OnboardGuardianResult | null;
  error: string | null;
  loading: boolean;
  submit: (input: OnboardGuardianInput) => Promise<OnboardGuardianResult | null>;
  reset: () => void;
};

const FALLBACK_RESULT: OnboardGuardianResult = {
  profileId: "0x0000000000000000000000000000000000000000000000000000000000000000",
  moduleEth: "",
  moduleBase: "",
  guardEth: "",
  guardBase: "",
  reactiveLasna: "",
  nextActions: [],
};

export function useOnboardGuardian(): OnboardState {
  const [data, setData] = useState<OnboardGuardianResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(input: OnboardGuardianInput) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/guardian/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Onboarding failed with status ${response.status}`);
      }

      const payload = (await response.json()) as OnboardGuardianResult;
      setData(payload);
      return payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown onboarding error";
      setError(message);
      setData(FALLBACK_RESULT);
      return FALLBACK_RESULT;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setData(null);
    setError(null);
    setLoading(false);
  }

  return { data, error, loading, submit, reset };
}
