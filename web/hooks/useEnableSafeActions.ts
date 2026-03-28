import { useState } from "react";
import { OnboardGuardianResult } from "./guardianTypes";
import { executeSafeNextAction } from "../lib/safe";

type SafeActionStep = {
  id: string;
  chainId: number;
  title: string;
  description: string;
  to: string;
  data: string;
  value: string;
  hash?: string | null;
  completed: boolean;
  executing: boolean;
  error?: string | null;
};

export function useEnableSafeActions(result: OnboardGuardianResult | null) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [executing, setExecuting] = useState<Record<string, boolean>>({});

  const steps: SafeActionStep[] =
    result?.nextActions.map((action, index) => {
      const id = `${action.chainId}:${action.title}:${index}`;
      return {
      id,
      chainId: action.chainId,
      title: action.title,
      description: action.description,
      to: action.to,
      data: action.data,
      value: action.value,
      hash: hashes[id] ?? action.hash ?? null,
      completed: Boolean(completed[id]),
      executing: Boolean(executing[id]),
      error: errors[id] ?? null
    };
    }) ?? [];

  function markCompleted(id: string, hash?: string) {
    setCompleted((current) => ({ ...current, [id]: true }));
    if (hash) {
      setHashes((current) => ({ ...current, [id]: hash }));
    }
  }

  function reset() {
    setCompleted({});
    setHashes({});
    setErrors({});
    setExecuting({});
  }

  async function executeStep(id: string, safeAddress: string, ownerAddress: string) {
    const step = steps.find((item) => item.id === id);
    if (!step) {
      throw new Error(`Unknown Safe action: ${id}`);
    }

    setExecuting((current) => ({ ...current, [id]: true }));
    setErrors((current) => ({ ...current, [id]: null }));

    try {
      const hash = await executeSafeNextAction(
        {
          chainId: step.chainId as never,
          label: step.title,
          description: step.description,
          to: step.to as never,
          data: step.data as never,
          value: BigInt(step.value)
        },
        safeAddress,
        ownerAddress
      );
      markCompleted(id, hash);
      return hash;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to execute Safe action";
      setErrors((current) => ({ ...current, [id]: message }));
      throw error;
    } finally {
      setExecuting((current) => ({ ...current, [id]: false }));
    }
  }

  return { steps, markCompleted, executeStep, reset };
}
