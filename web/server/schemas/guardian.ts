import { z } from "zod";
import { DEMO_SAFE_OWNER_ADDRESS, DEMO_SAFE_SHARED_ADDRESS } from "@/lib/constants";

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

export const guardianOnboardSchema = z.object({
  safeAddress: addressSchema.default(DEMO_SAFE_SHARED_ADDRESS),
  ownerAddress: addressSchema.default(DEMO_SAFE_OWNER_ADDRESS),
  tokenEth: addressSchema,
  tokenBase: addressSchema,
  allowlist: z.array(addressSchema).default([]),
  blacklist: z.array(addressSchema).default([]),
  cap: z.coerce.bigint().default(100n * 1_000_000n)
});

export type GuardianOnboardInput = z.infer<typeof guardianOnboardSchema>;
