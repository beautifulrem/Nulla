// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {NullaRegistry} from "../../src/nulla/NullaRegistry.sol";
import {GuardianProfile, ProfileStatus} from "../../src/nulla/NullaTypes.sol";

contract NullaRegistryTest is Test {
    NullaRegistry internal registry;

    function setUp() external {
        registry = new NullaRegistry(address(this));
    }

    function test_RegisterAndFetchProfile() external {
        bytes32 profileId = keccak256("profile");
        GuardianProfile memory profile = GuardianProfile({
            safeAddress: address(0x1234),
            owner: address(0x5678),
            moduleEth: address(0x1001),
            moduleBase: address(0x1002),
            guardEth: address(0x1003),
            guardBase: address(0x1004),
            reactiveLasna: address(0x1005),
            policyHash: keccak256("policy"),
            status: ProfileStatus.Active
        });

        registry.registerProfile(profileId, profile);

        GuardianProfile memory stored = registry.getProfile(profileId);
        assertEq(stored.safeAddress, profile.safeAddress);
        assertTrue(registry.isProfileActive(profileId));
        assertEq(registry.getProfileIdBySafe(profile.safeAddress), profileId);
    }
}
