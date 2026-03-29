import { z } from "zod";

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

const serverEnvSchema = z.object({
  ETH_SEPOLIA_RPC_URL: z.string().min(1),
  BASE_SEPOLIA_RPC_URL: z.string().min(1),
  LASNA_RPC_URL: z.string().min(1),
  ETH_SEPOLIA_CHAIN_ID: z.coerce.number().int().positive().default(11155111),
  BASE_SEPOLIA_CHAIN_ID: z.coerce.number().int().positive().default(84532),
  LASNA_CHAIN_ID: z.coerce.number().int().positive().default(5318007),
  ETH_SEPOLIA_PRIVATE_KEY: z.string().optional(),
  BASE_SEPOLIA_PRIVATE_KEY: z.string().optional(),
  LASNA_PRIVATE_KEY: z.string().optional(),
  DEMO_SAFE_OWNER_PRIVATE_KEY: z.string().optional(),
  DEMO_SAFE_SHARED_ADDRESS: addressSchema.default("0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0"),
  DEMO_SAFE_OWNER_ADDRESS: addressSchema.default("0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4"),
  ETH_SEPOLIA_CALLBACK_PROXY_ADDRESS: addressSchema.optional(),
  BASE_SEPOLIA_CALLBACK_PROXY_ADDRESS: addressSchema.optional(),
  SAFE_SINGLETON_ADDRESS: addressSchema.optional(),
  SAFE_PROXY_FACTORY_ADDRESS: addressSchema.optional(),
  SAFE_FALLBACK_HANDLER_ADDRESS: addressSchema.optional(),
  NULLA_REGISTRY_ADDRESS: addressSchema.optional(),
  ETH_TOKEN_ADDRESS: addressSchema.optional(),
  BASE_TOKEN_ADDRESS: addressSchema.optional(),
  ETH_SERVICE_ADDRESS: addressSchema.optional(),
  BASE_SERVICE_ADDRESS: addressSchema.optional(),
  ETH_MODULE_ADDRESS: addressSchema.optional(),
  BASE_MODULE_ADDRESS: addressSchema.optional(),
  ETH_GUARD_ADDRESS: addressSchema.optional(),
  BASE_GUARD_ADDRESS: addressSchema.optional(),
  REACTIVE_LASNA_ADDRESS: addressSchema.optional(),
  ETHERSCAN_API_KEY: z.string().optional(),
  BASESCAN_API_KEY: z.string().optional(),
  USE_SAFE_RELAY: z.string().optional(),
  SAFE_RELAY_API_KEY: z.string().optional(),
  SAFE_RELAY_SPONSOR_ADDRESS: addressSchema.optional()
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_ETH_SEPOLIA_CHAIN_ID: z.coerce.number().int().positive().default(11155111),
  NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID: z.coerce.number().int().positive().default(84532),
  NEXT_PUBLIC_LASNA_CHAIN_ID: z.coerce.number().int().positive().default(5318007),
  NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL: z.string().optional(),
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: z.string().optional(),
  NEXT_PUBLIC_LASNA_RPC_URL: z.string().optional(),
  NEXT_PUBLIC_NULLA_REGISTRY_ADDRESS: addressSchema.optional(),
  NEXT_PUBLIC_ETH_TOKEN_ADDRESS: addressSchema.optional(),
  NEXT_PUBLIC_BASE_TOKEN_ADDRESS: addressSchema.optional(),
  NEXT_PUBLIC_DEMO_SAFE_SHARED_ADDRESS: addressSchema.default("0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0"),
  NEXT_PUBLIC_DEMO_SAFE_OWNER_ADDRESS: addressSchema.default("0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4"),
  NEXT_PUBLIC_DEMO_PROFILE_ID: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional()
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getServerEnv(input: NodeJS.ProcessEnv = process.env): ServerEnv {
  return serverEnvSchema.parse(input);
}

export function getPublicEnv(input: NodeJS.ProcessEnv = process.env): PublicEnv {
  return publicEnvSchema.parse(input);
}

export function isDemoSafeAddress(address?: string): boolean {
  return address === "0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0";
}

export function isDemoOwnerAddress(address?: string): boolean {
  return address === "0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4";
}
