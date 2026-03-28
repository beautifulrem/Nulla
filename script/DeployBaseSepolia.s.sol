// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ApprovalFirewallModule} from "../src/nulla/ApprovalFirewallModule.sol";
import {ShieldGuard} from "../src/nulla/ShieldGuard.sol";
import {NullaRegistry} from "../src/nulla/NullaRegistry.sol";
import {NullaSubscriptionService} from "../src/nulla/NullaSubscriptionService.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";

contract DeployBaseSepolia is Script {
    address internal constant DEFAULT_OWNER = 0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4;
    address internal constant DEFAULT_SAFE = 0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0;
    address internal constant BASE_CALLBACK_PROXY = 0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6;
    uint256 internal constant DEFAULT_DESTINATION_DEPLOY_VALUE = 0.01 ether;

    function run()
        external
        returns (
            MockUSDC token,
            NullaRegistry registry,
            NullaSubscriptionService service,
            ShieldGuard guard,
            ApprovalFirewallModule module
        )
    {
        address owner = vm.envOr("DEMO_SAFE_OWNER_ADDRESS", DEFAULT_OWNER);
        address safeAddress = vm.envOr("DEMO_SAFE_SHARED_ADDRESS", DEFAULT_SAFE);
        address callbackProxy = vm.envOr("BASE_SEPOLIA_CALLBACK_PROXY_ADDRESS", BASE_CALLBACK_PROXY);
        address allowedRvmId = vm.envOr("ALLOWED_RVM_ID", owner);
        uint256 destinationDeployValue = vm.envOr("DESTINATION_DEPLOY_VALUE", DEFAULT_DESTINATION_DEPLOY_VALUE);

        vm.startBroadcast(vm.envUint("BASE_SEPOLIA_PRIVATE_KEY"));
        token = new MockUSDC(owner);
        registry = new NullaRegistry(owner);
        service = new NullaSubscriptionService(owner);
        guard = new ShieldGuard(owner, safeAddress, address(token));
        module = new ApprovalFirewallModule{value: destinationDeployValue}(owner, safeAddress, address(guard), callbackProxy, allowedRvmId);
        guard.setModule(address(module));
        vm.stopBroadcast();
    }
}
