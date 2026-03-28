// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ReactiveCrossChainFirewall} from "../src/nulla/ReactiveCrossChainFirewall.sol";

contract SubscribeLasna is Script {
    function run() external {
        vm.startBroadcast(vm.envUint("LASNA_PRIVATE_KEY"));
        ReactiveCrossChainFirewall(payable(vm.envAddress("REACTIVE_LASNA_ADDRESS"))).configureControlSubscriptions();
        vm.stopBroadcast();
    }
}
