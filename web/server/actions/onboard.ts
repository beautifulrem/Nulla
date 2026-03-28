import { getAddress } from "viem";
import { DEMO_SAFE_OWNER_ADDRESS, DEMO_SAFE_SHARED_ADDRESS } from "@/lib/constants";
import { getServerEnv } from "@/lib/env";
import type { OnboardGuardianInput, OnboardGuardianResponse } from "@/lib/types";
import { buildGuardianDeploymentPlan } from "../deploy/plan";
import { createDefaultChainStates, createDefaultProfile } from "../models/guardian";
import { upsertMemoryBundle } from "../state/memory";

function assertDemoIdentity(input: OnboardGuardianInput) {
  const safe = getAddress(input.safeAddress);
  const owner = getAddress(input.ownerAddress);
  if (safe !== DEMO_SAFE_SHARED_ADDRESS || owner !== DEMO_SAFE_OWNER_ADDRESS) {
    return false;
  }
  return true;
}

export async function onboardGuardianProfile(input: OnboardGuardianInput): Promise<OnboardGuardianResponse> {
  getServerEnv();

  if (!assertDemoIdentity(input)) {
    throw new Error("This skeleton only accepts the shared demo Safe and owner.");
  }

  const deployment = buildGuardianDeploymentPlan(input);
  const profile = createDefaultProfile(deployment.profileId, deployment.contracts);
  const chains = createDefaultChainStates(profile);

  upsertMemoryBundle({
    profile: { ...deployment.profile, status: "PartialConfigured" },
    chains,
    alerts: [],
    timeline: [],
    nextActions: deployment.nextActions
  });

  return {
    status: "created",
    resumeFrom: "deploy",
    ...deployment
  };
}
