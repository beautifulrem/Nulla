import { describe, expect, it } from "vitest";

type WebEnv = {
  NEXT_PUBLIC_ETH_SEPOLIA_CHAIN_ID: string;
  NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID: string;
  NEXT_PUBLIC_LASNA_CHAIN_ID: string;
  NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL: string;
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: string;
  NEXT_PUBLIC_LASNA_RPC_URL: string;
  NEXT_PUBLIC_NULLA_REGISTRY_ADDRESS: string;
  NEXT_PUBLIC_DEMO_SAFE_SHARED_ADDRESS: string;
  NEXT_PUBLIC_DEMO_SAFE_OWNER_ADDRESS: string;
};

function validateWebEnv(env: Partial<WebEnv>): string[] {
  const required: (keyof WebEnv)[] = [
    "NEXT_PUBLIC_ETH_SEPOLIA_CHAIN_ID",
    "NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID",
    "NEXT_PUBLIC_LASNA_CHAIN_ID",
    "NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL",
    "NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL",
    "NEXT_PUBLIC_LASNA_RPC_URL",
    "NEXT_PUBLIC_NULLA_REGISTRY_ADDRESS",
    "NEXT_PUBLIC_DEMO_SAFE_SHARED_ADDRESS",
    "NEXT_PUBLIC_DEMO_SAFE_OWNER_ADDRESS",
  ];

  return required.filter((key) => !env[key]).map(String);
}

describe("web env contract", () => {
  it("requires the demo safe and chain config", () => {
    const missing = validateWebEnv({});
    expect(missing).toEqual([
      "NEXT_PUBLIC_ETH_SEPOLIA_CHAIN_ID",
      "NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID",
      "NEXT_PUBLIC_LASNA_CHAIN_ID",
      "NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL",
      "NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL",
      "NEXT_PUBLIC_LASNA_RPC_URL",
      "NEXT_PUBLIC_NULLA_REGISTRY_ADDRESS",
      "NEXT_PUBLIC_DEMO_SAFE_SHARED_ADDRESS",
      "NEXT_PUBLIC_DEMO_SAFE_OWNER_ADDRESS",
    ]);
  });

  it("accepts the fixed demo safe topology", () => {
    const missing = validateWebEnv({
      NEXT_PUBLIC_ETH_SEPOLIA_CHAIN_ID: "11155111",
      NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID: "84532",
      NEXT_PUBLIC_LASNA_CHAIN_ID: "5318007",
      NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL: "https://example.eth",
      NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: "https://example.base",
      NEXT_PUBLIC_LASNA_RPC_URL: "https://example.lasna",
      NEXT_PUBLIC_NULLA_REGISTRY_ADDRESS: "0x0000000000000000000000000000000000000001",
      NEXT_PUBLIC_DEMO_SAFE_SHARED_ADDRESS: "0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0",
      NEXT_PUBLIC_DEMO_SAFE_OWNER_ADDRESS: "0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4",
    });

    expect(missing).toEqual([]);
  });
});
