export * from "./abis";
export * from "./chains";
export * from "./constants";
export * from "./types";

import type { ContractAddressBook } from "./types";
import { DEMO_SAFE_SHARED_ADDRESS } from "./constants";
import { zeroAddress } from "viem";

export function buildDemoContractAddressBook(overrides: Partial<ContractAddressBook> = {}): ContractAddressBook {
  return {
    registry: overrides.registry,
    safeAddress: overrides.safeAddress ?? DEMO_SAFE_SHARED_ADDRESS,
    serviceEth: overrides.serviceEth ?? zeroAddress,
    serviceBase: overrides.serviceBase ?? zeroAddress,
    moduleEth: overrides.moduleEth ?? zeroAddress,
    moduleBase: overrides.moduleBase ?? zeroAddress,
    guardEth: overrides.guardEth ?? zeroAddress,
    guardBase: overrides.guardBase ?? zeroAddress,
    reactiveLasna: overrides.reactiveLasna ?? zeroAddress
  };
}
