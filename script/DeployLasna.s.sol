// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ReactiveCrossChainFirewall} from "../src/nulla/ReactiveCrossChainFirewall.sol";

// This script is kept as a parameter reference only.
// For real Lasna deployments, use `forge create ...` instead of `forge script ...`
// because constructor-time subscriptions may fail through the script path.
contract DeployLasna is Script {
    address internal constant DEFAULT_OWNER = 0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4;
    address internal constant DEFAULT_SAFE = 0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0;
    uint256 internal constant DEFAULT_CRON10_TOPIC0 =
        0x04463f7c1651e6b9774d7f85c85bb94654e3c46ca79b0c16fb16d4183307b687;
    uint256 internal constant DEFAULT_DEPLOY_VALUE = 3 ether;
    bool internal constant DEFAULT_AUTO_SUBSCRIBE = false;

    function run() external returns (ReactiveCrossChainFirewall firewall) {
        address owner = vm.envOr("DEMO_SAFE_OWNER_ADDRESS", DEFAULT_OWNER);
        address safeAddress = vm.envOr("DEMO_SAFE_SHARED_ADDRESS", DEFAULT_SAFE);

        address[] memory allowedSpenders = new address[](1);
        uint256[] memory allowedCaps = new uint256[](1);
        address[] memory blacklistedSpenders = new address[](1);

        allowedSpenders[0] = vm.envOr("DEFAULT_ALLOWED_SPENDER", address(0));
        allowedCaps[0] = vm.envOr("DEFAULT_ALLOWED_CAP", uint256(100e6));
        blacklistedSpenders[0] = vm.envOr("DEFAULT_BLACKLISTED_SPENDER", address(0));

        uint256 deployValue = vm.envOr("REACTIVE_DEPLOY_VALUE", DEFAULT_DEPLOY_VALUE);
        bool autoSubscribe = vm.envOr("AUTO_SUBSCRIBE", DEFAULT_AUTO_SUBSCRIBE);

        vm.startBroadcast(vm.envUint("LASNA_PRIVATE_KEY"));
        firewall = new ReactiveCrossChainFirewall{value: deployValue}(
            owner,
            safeAddress,
            vm.envUint("ETH_SEPOLIA_CHAIN_ID"),
            vm.envAddress("ETH_SERVICE_ADDRESS"),
            vm.envAddress("ETH_TOKEN_ADDRESS"),
            vm.envAddress("ETH_MODULE_ADDRESS"),
            vm.envAddress("ETH_GUARD_ADDRESS"),
            vm.envUint("BASE_SEPOLIA_CHAIN_ID"),
            vm.envAddress("BASE_SERVICE_ADDRESS"),
            vm.envAddress("BASE_TOKEN_ADDRESS"),
            vm.envAddress("BASE_MODULE_ADDRESS"),
            vm.envAddress("BASE_GUARD_ADDRESS"),
            100e6,
            allowedSpenders,
            allowedCaps,
            blacklistedSpenders,
            vm.envOr("CRON10_TOPIC0", DEFAULT_CRON10_TOPIC0),
            vm.envOr("CRON_TICK_DIVISOR", uint256(10)),
            uint64(vm.envOr("SHIELD_DURATION_TICKS", uint256(10))),
            uint64(vm.envOr("CALLBACK_GAS_LIMIT", uint256(500000)))
        );
        if (autoSubscribe) {
            firewall.configureControlSubscriptions();
        }
        vm.stopBroadcast();
    }
}
