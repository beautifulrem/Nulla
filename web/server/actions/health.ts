import { getServerEnv } from "@/lib/env";
import { listMemoryBundles } from "../state/memory";
import { loadDeploymentManifest } from "../deploy/manifest";
import { resolveRuntimeDeployment } from "../deploy/runtime";

export async function getHealthStatus() {
  try {
    const env = getServerEnv();
    const manifest = loadDeploymentManifest();
    const runtime = resolveRuntimeDeployment();
    return {
      ok: true,
      chains: {
        ethSepolia: Boolean(env.ETH_SEPOLIA_RPC_URL),
        baseSepolia: Boolean(env.BASE_SEPOLIA_RPC_URL),
        lasna: Boolean(env.LASNA_RPC_URL)
      },
      manifestLoaded: Boolean(manifest),
      realAddressesReady: runtime.hasRealAddresses,
      profiles: listMemoryBundles().length
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown env error",
      profiles: listMemoryBundles().length
    };
  }
}
