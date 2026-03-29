import { DEFAULT_POLICY_LABEL } from "@/lib/constants";
import { getMemoryBundle } from "../state/memory";
import { createDefaultChainStates, createDefaultProfile, toGuardianStatusResponse } from "../models/guardian";
import type { ChainStateRecord, GuardianProfileRecord, GuardianStatusResponse, LasnaRuntimeInfo } from "@/lib/types";
import { getServerEnv } from "@/lib/env";
import { resolveRuntimeDeployment } from "../deploy/runtime";
import { getPublicClient } from "../clients/viem";
import { reactiveCrossChainFirewallAbi, safeAbi, shieldGuardAbi } from "@/lib/abis";
import { BASE_SEPOLIA_CHAIN_ID, ETH_SEPOLIA_CHAIN_ID, LASNA_CHAIN_ID, getChainName } from "@/lib/chains";
import { getGuardianActivity } from "./activity";

const STATUS_CACHE_TTL_MS = 8_000;

type StatusCacheStore = typeof globalThis & {
  __nullaStatusCache?: Map<string, { expiresAt: number; value: GuardianStatusResponse }>;
};

function getStatusCache() {
  const store = globalThis as StatusCacheStore;
  if (!store.__nullaStatusCache) {
    store.__nullaStatusCache = new Map();
  }
  return store.__nullaStatusCache;
}

function latestChainTxHash(activity: Awaited<ReturnType<typeof getGuardianActivity>>, chainId: number) {
  return [...activity.timeline].reverse().find((entry) => entry.chainId === chainId && entry.txHash)?.txHash;
}

async function readLasnaRuntime(reactiveAddress: `0x${string}`): Promise<LasnaRuntimeInfo | undefined> {
  try {
    const client = getPublicClient(LASNA_CHAIN_ID);
    const [currentBlockNumber, cronTickDivisor, shieldDurationTicks] = await Promise.all([
      client.getBlockNumber(),
      client.readContract({
        address: reactiveAddress,
        abi: reactiveCrossChainFirewallAbi,
        functionName: "cronTickDivisor",
      }),
      client.readContract({
        address: reactiveAddress,
        abi: reactiveCrossChainFirewallAbi,
        functionName: "shieldDurationTicks",
      }),
    ]);

    const divisor = BigInt(cronTickDivisor);
    return {
      currentBlockNumber,
      currentTick: divisor > 0n ? currentBlockNumber / divisor : 0n,
      cronTickDivisor: divisor,
      shieldDurationTicks: BigInt(shieldDurationTicks),
      secondsPerBlock: 8,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return undefined;
  }
}

export async function getGuardianStatus(profileId: `0x${string}`): Promise<GuardianStatusResponse> {
  getServerEnv();
  const cached = getStatusCache().get(profileId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const bundle = getMemoryBundle(profileId);
  const runtime = resolveRuntimeDeployment(bundle?.profile);
  const runtimeProfile = bundle?.profile ?? createDefaultProfile(profileId, runtime.contracts);

  if (runtime.hasRealAddresses) {
    try {
      const activityPromise = getGuardianActivity(profileId).catch(() => ({
        profileId,
        alerts: [],
        timeline: []
      }));

      const [ethModuleEnabled, baseModuleEnabled, ethMode, baseMode, ethShieldUntilTick, baseShieldUntilTick, activity, lasnaRuntime] = await Promise.all([
        getPublicClient(ETH_SEPOLIA_CHAIN_ID).readContract({
          address: runtimeProfile.safeAddress,
          abi: safeAbi,
          functionName: "isModuleEnabled",
          args: [runtime.contracts.moduleEth]
        }),
        getPublicClient(BASE_SEPOLIA_CHAIN_ID).readContract({
          address: runtimeProfile.safeAddress,
          abi: safeAbi,
          functionName: "isModuleEnabled",
          args: [runtime.contracts.moduleBase]
        }),
        getPublicClient(ETH_SEPOLIA_CHAIN_ID).readContract({
          address: runtime.contracts.guardEth,
          abi: shieldGuardAbi,
          functionName: "mode"
        }),
        getPublicClient(BASE_SEPOLIA_CHAIN_ID).readContract({
          address: runtime.contracts.guardBase,
          abi: shieldGuardAbi,
          functionName: "mode"
        }),
        getPublicClient(ETH_SEPOLIA_CHAIN_ID).readContract({
          address: runtime.contracts.guardEth,
          abi: shieldGuardAbi,
          functionName: "shieldUntilTick"
        }),
        getPublicClient(BASE_SEPOLIA_CHAIN_ID).readContract({
          address: runtime.contracts.guardBase,
          abi: shieldGuardAbi,
          functionName: "shieldUntilTick"
        }),
        activityPromise,
        readLasnaRuntime(runtime.contracts.reactiveLasna as `0x${string}`),
      ]);

      const chains: ChainStateRecord[] = [
        {
          chainId: ETH_SEPOLIA_CHAIN_ID,
          chainName: getChainName(ETH_SEPOLIA_CHAIN_ID),
          safeAddress: runtimeProfile.safeAddress,
          moduleAddress: runtime.contracts.moduleEth,
          guardAddress: runtime.contracts.guardEth,
          moduleEnabled: Boolean(ethModuleEnabled),
          guardMode: Number(ethMode) === 1 ? "Shield" : "Monitor",
          shieldUntilTick: BigInt(ethShieldUntilTick),
          lastAlertId: activity.alerts.at(-1)?.alertId,
          lastTxHash: latestChainTxHash(activity, ETH_SEPOLIA_CHAIN_ID)
        },
        {
          chainId: BASE_SEPOLIA_CHAIN_ID,
          chainName: getChainName(BASE_SEPOLIA_CHAIN_ID),
          safeAddress: runtimeProfile.safeAddress,
          moduleAddress: runtime.contracts.moduleBase,
          guardAddress: runtime.contracts.guardBase,
          moduleEnabled: Boolean(baseModuleEnabled),
          guardMode: Number(baseMode) === 1 ? "Shield" : "Monitor",
          shieldUntilTick: BigInt(baseShieldUntilTick),
          lastAlertId: activity.alerts.at(-1)?.alertId,
          lastTxHash: latestChainTxHash(activity, BASE_SEPOLIA_CHAIN_ID)
        }
      ];

      const profile: GuardianProfileRecord = {
        ...runtimeProfile,
        moduleEth: runtime.contracts.moduleEth,
        moduleBase: runtime.contracts.moduleBase,
        guardEth: runtime.contracts.guardEth,
        guardBase: runtime.contracts.guardBase,
        reactiveLasna: runtime.contracts.reactiveLasna,
        status: chains.every((chain) => chain.moduleEnabled) ? "Active" : "PartialConfigured"
      };

      const response = {
        profileId,
        profile,
        chains,
        armed: profile.status === "Active",
        shieldEth: chains.some((chain) => chain.chainId === ETH_SEPOLIA_CHAIN_ID && chain.guardMode === "Shield"),
        shieldBase: chains.some((chain) => chain.chainId === BASE_SEPOLIA_CHAIN_ID && chain.guardMode === "Shield"),
        lastAlert: activity.alerts.at(-1),
        policySummary: DEFAULT_POLICY_LABEL,
        lasnaRuntime,
      };
      getStatusCache().set(profileId, {
        expiresAt: Date.now() + STATUS_CACHE_TTL_MS,
        value: response,
      });
      return response;
    } catch {
      const response = {
        profileId,
        profile: {
          ...runtimeProfile,
          moduleEth: runtime.contracts.moduleEth,
          moduleBase: runtime.contracts.moduleBase,
          guardEth: runtime.contracts.guardEth,
          guardBase: runtime.contracts.guardBase,
          reactiveLasna: runtime.contracts.reactiveLasna
        },
        chains: bundle?.chains ?? createDefaultChainStates(runtimeProfile),
        armed: (bundle?.profile.status ?? runtimeProfile.status) === "Active",
        shieldEth: (bundle?.chains ?? []).some((chain) => chain.chainId === ETH_SEPOLIA_CHAIN_ID && chain.guardMode === "Shield"),
        shieldBase: (bundle?.chains ?? []).some((chain) => chain.chainId === BASE_SEPOLIA_CHAIN_ID && chain.guardMode === "Shield"),
        lastAlert: bundle?.alerts.at(-1),
        policySummary: DEFAULT_POLICY_LABEL,
        lasnaRuntime: undefined,
      };
      getStatusCache().set(profileId, {
        expiresAt: Date.now() + STATUS_CACHE_TTL_MS,
        value: response,
      });
      return response;
    }
  }

  if (bundle) {
    const response = {
      profileId,
      profile: bundle.profile,
      chains: bundle.chains,
      armed: bundle.profile.status === "Active",
      shieldEth: bundle.chains.some((chain) => chain.chainId === 11155111 && chain.guardMode === "Shield"),
      shieldBase: bundle.chains.some((chain) => chain.chainId === 84532 && chain.guardMode === "Shield"),
      lastAlert: bundle.alerts.at(-1),
      policySummary: DEFAULT_POLICY_LABEL,
      lasnaRuntime: undefined,
    };
    getStatusCache().set(profileId, {
      expiresAt: Date.now() + STATUS_CACHE_TTL_MS,
      value: response,
    });
    return response;
  }

  const runtimeOnly = resolveRuntimeDeployment();
  const profile = createDefaultProfile(profileId, runtimeOnly.contracts);
  const chains = createDefaultChainStates(profile);
  const response = toGuardianStatusResponse(profile, chains);
  getStatusCache().set(profileId, {
    expiresAt: Date.now() + STATUS_CACHE_TTL_MS,
    value: response,
  });
  return response;
}
