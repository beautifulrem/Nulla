// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";

contract FundModulesForCallbacks is Script {
    uint256 internal constant DEFAULT_DESTINATION_FUNDING = 0.01 ether;

    function run() external {
        uint256 fundingAmount = vm.envOr("DESTINATION_FUNDING", DEFAULT_DESTINATION_FUNDING);

        vm.startBroadcast(vm.envUint("ETH_SEPOLIA_PRIVATE_KEY"));
        (bool ethSuccess,) = vm.envAddress("ETH_MODULE_ADDRESS").call{value: fundingAmount}("");
        require(ethSuccess, "Funding ETH module failed");
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("BASE_SEPOLIA_PRIVATE_KEY"));
        (bool baseSuccess,) = vm.envAddress("BASE_MODULE_ADDRESS").call{value: fundingAmount}("");
        require(baseSuccess, "Funding Base module failed");
        vm.stopBroadcast();
    }
}
