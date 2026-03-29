import { useState } from "react";
import { OnboardGuardianInput, OnboardGuardianResult } from "./guardianTypes";

type OnboardState = {
  data: OnboardGuardianResult | null;
  error: string | null;
  loading: boolean;
  submit: (input: OnboardGuardianInput) => Promise<OnboardGuardianResult | null>;
  reset: () => void;
};

function sanitizeInput(input: OnboardGuardianInput): OnboardGuardianInput {
  return {
    ...input,
    safeAddress: input.safeAddress.trim(),
    ownerAddress: input.ownerAddress.trim(),
    tokenEth: input.tokenEth.trim(),
    tokenBase: input.tokenBase.trim(),
    cap: input.cap.trim(),
    allowlist: input.allowlist.map((value) => value.trim()).filter(Boolean),
    blacklist: input.blacklist.map((value) => value.trim()).filter(Boolean),
  };
}

export function useOnboardGuardian(): OnboardState {
  const [data, setData] = useState<OnboardGuardianResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(input: OnboardGuardianInput) {
    setLoading(true);
    setError(null);

    try {
      const payloadInput = sanitizeInput(input);
      const response = await fetch("/api/guardian/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadInput),
      });

      if (!response.ok) {
        let message = `Onboarding failed with status ${response.status}`;
        try {
          const body = (await response.json()) as { error?: string };
          if (body.error) {
            message = body.error;
          }
        } catch {
          // Ignore JSON parsing for non-JSON failures.
        }
        throw new Error(message);
      }

      const payload = (await response.json()) as OnboardGuardianResult;
      setData(payload);
      return payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown onboarding error";
      setError(message);
      setData(null);
      return null;
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
