export const DEMO_SAFE_SHARED_ADDRESS = "0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0" as const;
export const DEMO_SAFE_OWNER_ADDRESS = "0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4" as const;
export const DEMO_PROFILE_ID =
  (process.env.NEXT_PUBLIC_DEMO_PROFILE_ID as `0x${string}` | undefined) ??
  "0xe5fd559fcb5fd437c4efdfabfe7138e5ef4a92912bf3c7c2d170292cf5e322c9";
export const DEMO_TOKEN_SYMBOL = "MockUSDC";
export const DEFAULT_UNKNOWN_SPENDER_CAP = 100n * 1_000_000n;
export const DEFAULT_SHIELD_TICKS = 10n;
export const DEFAULT_POLICY_LABEL = "Unknown spender approval > 100 MockUSDC";
export const DEFAULT_RISK_SPENDER = "0x301E4F2bA24b4C009BfDCc5F7F192f6A0f9C8e8d" as const;
