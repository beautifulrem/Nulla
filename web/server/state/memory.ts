import type { Address } from "viem";
import type { AlertRecord, ChainStateRecord, GuardianProfileRecord, NextAction, TimelineEntry } from "@/lib/types";

export interface MemoryGuardianBundle {
  profile: GuardianProfileRecord;
  chains: ChainStateRecord[];
  alerts: AlertRecord[];
  timeline: TimelineEntry[];
  nextActions: NextAction[];
}

type GlobalStore = typeof globalThis & {
  __nullaStore?: {
    bundles: Map<string, MemoryGuardianBundle>;
  };
};

function getGlobalStore(): NonNullable<GlobalStore["__nullaStore"]> {
  const g = globalThis as GlobalStore;
  if (!g.__nullaStore) {
    g.__nullaStore = {
      bundles: new Map<string, MemoryGuardianBundle>()
    };
  }
  return g.__nullaStore;
}

export function getMemoryBundle(profileId: string): MemoryGuardianBundle | undefined {
  return getGlobalStore().bundles.get(profileId);
}

export function upsertMemoryBundle(bundle: MemoryGuardianBundle): MemoryGuardianBundle {
  getGlobalStore().bundles.set(bundle.profile.profileId, bundle);
  return bundle;
}

export function listMemoryBundles(): MemoryGuardianBundle[] {
  return [...getGlobalStore().bundles.values()];
}

export function updateMemoryBundle(profileId: string, updater: (bundle: MemoryGuardianBundle | undefined) => MemoryGuardianBundle): MemoryGuardianBundle {
  const next = updater(getMemoryBundle(profileId));
  getGlobalStore().bundles.set(profileId, next);
  return next;
}

export function createEmptyChainState(
  chainId: number,
  chainName: string,
  safeAddress: Address,
  moduleAddress: Address,
  guardAddress: Address
): ChainStateRecord {
  return {
    chainId: chainId as ChainStateRecord["chainId"],
    chainName,
    safeAddress,
    moduleAddress,
    guardAddress,
    moduleEnabled: false,
    guardMode: "Monitor",
    shieldUntilTick: 0n
  };
}
