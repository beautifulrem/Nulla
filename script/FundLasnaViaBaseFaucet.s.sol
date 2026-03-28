// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";

contract FundLasnaViaBaseFaucet is Script {
    address internal constant BASE_SEPOLIA_REACTIVE_FAUCET = 0x2afaFD298b23b62760711756088F75B7409f5967;
    uint256 internal constant DEFAULT_FAUCET_VALUE = 0.1 ether;

    function run() external {
        uint256 faucetValue = vm.envOr("REACTIVE_FAUCET_VALUE", DEFAULT_FAUCET_VALUE);

        vm.startBroadcast(vm.envUint("BASE_SEPOLIA_PRIVATE_KEY"));
        (bool success,) = BASE_SEPOLIA_REACTIVE_FAUCET.call{value: faucetValue}(
            abi.encodeWithSignature("request(address)", vm.envAddress("REACTIVE_LASNA_ADDRESS"))
        );
        require(success, "Base faucet funding failed");
        vm.stopBroadcast();
    }
}
