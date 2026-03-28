import fs from "node:fs";
import path from "node:path";
import { getAddress } from "viem";
import type { Address } from "viem";

export interface DeploymentManifest {
  registry?: Address;
  ethToken?: Address;
  baseToken?: Address;
  ethService?: Address;
  baseService?: Address;
  ethModule?: Address;
  baseModule?: Address;
  ethGuard?: Address;
  baseGuard?: Address;
  reactiveLasna?: Address;
}

function normalizeAddress(value?: string): Address | undefined {
  return value ? getAddress(value) : undefined;
}

export function getDeploymentManifestPath(): string {
  return path.resolve(process.cwd(), "..", "deployments", "nulla-demo.json");
}

export function loadDeploymentManifest(): DeploymentManifest | null {
  const manifestPath = getDeploymentManifestPath();
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, string | undefined>;
  return {
    registry: normalizeAddress(parsed.registry),
    ethToken: normalizeAddress(parsed.ethToken),
    baseToken: normalizeAddress(parsed.baseToken),
    ethService: normalizeAddress(parsed.ethService),
    baseService: normalizeAddress(parsed.baseService),
    ethModule: normalizeAddress(parsed.ethModule),
    baseModule: normalizeAddress(parsed.baseModule),
    ethGuard: normalizeAddress(parsed.ethGuard),
    baseGuard: normalizeAddress(parsed.baseGuard),
    reactiveLasna: normalizeAddress(parsed.reactiveLasna)
  };
}
