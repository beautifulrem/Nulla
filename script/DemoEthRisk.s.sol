// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract DemoEthRisk is Script {
    function run() external {
        vm.startBroadcast(vm.envUint("DEMO_SAFE_OWNER_PRIVATE_KEY"));
        IERC20(vm.envAddress("ETH_TOKEN_ADDRESS")).approve(vm.envAddress("DEMO_RISK_SPENDER"), vm.envUint("DEMO_RISK_AMOUNT"));
        vm.stopBroadcast();
    }
}
