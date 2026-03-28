// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {NullaRegistry} from "../src/nulla/NullaRegistry.sol";
import {GuardianProfile, ProfileStatus} from "../src/nulla/NullaTypes.sol";

contract RegisterProfile is Script {
    function run() external returns (bytes32 profileId) {
        address safeAddress = vm.envAddress("DEMO_SAFE_SHARED_ADDRESS");
        address owner = vm.envAddress("DEMO_SAFE_OWNER_ADDRESS");
        bytes32 policyHash = keccak256("Policy #1: Unknown spender approval > 100 MockUSDC");
        profileId = keccak256(abi.encode(safeAddress, owner, policyHash, vm.envUint("ETH_SEPOLIA_CHAIN_ID"), vm.envUint("BASE_SEPOLIA_CHAIN_ID")));

        GuardianProfile memory profile = GuardianProfile({
            safeAddress: safeAddress,
            owner: owner,
            moduleEth: vm.envAddress("ETH_MODULE_ADDRESS"),
            moduleBase: vm.envAddress("BASE_MODULE_ADDRESS"),
            guardEth: vm.envAddress("ETH_GUARD_ADDRESS"),
            guardBase: vm.envAddress("BASE_GUARD_ADDRESS"),
            reactiveLasna: vm.envAddress("REACTIVE_LASNA_ADDRESS"),
            policyHash: policyHash,
            status: ProfileStatus.PartialConfigured
        });

        vm.startBroadcast(vm.envUint("BASE_SEPOLIA_PRIVATE_KEY"));
        NullaRegistry(vm.envAddress("NULLA_REGISTRY_ADDRESS")).registerProfile(profileId, profile);
        vm.stopBroadcast();
    }
}
