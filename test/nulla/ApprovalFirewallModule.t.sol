// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ApprovalFirewallModule} from "../../src/nulla/ApprovalFirewallModule.sol";
import {ShieldGuard} from "../../src/nulla/ShieldGuard.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";
import {MockSafe} from "../mocks/MockSafe.sol";

contract ApprovalFirewallModuleTest is Test {
    address internal owner = address(this);
    address internal callbackProxy = address(0xCB);
    address internal allowedRvmId = address(0xA11CE);
    address internal spender = address(0xDEAD);

    MockSafe internal safe;
    ShieldGuard internal guard;
    ApprovalFirewallModule internal module;
    MockUSDC internal token;

    function setUp() external {
        safe = new MockSafe();
        token = new MockUSDC(owner);
        token.mint(address(safe), 1_000_000e6);

        guard = new ShieldGuard(owner, address(safe), address(token));
        module = new ApprovalFirewallModule(owner, address(safe), address(guard), callbackProxy, allowedRvmId);
        guard.setModule(address(module));
        safe.enableModule(address(module));
    }

    function test_RevokeApprovalViaModule() external {
        vm.prank(address(safe));
        token.approve(spender, 250e6);
        assertEq(token.allowance(address(safe), spender), 250e6);

        vm.prank(callbackProxy);
        module.revokeApproval(allowedRvmId, bytes32("risk"), address(token), spender, 250e6, 1, 70);

        assertEq(token.allowance(address(safe), spender), 0);
    }

    function test_EnterAndExitShield() external {
        vm.prank(callbackProxy);
        module.enterShield(allowedRvmId, bytes32("risk"), 84532, 100, 70);
        assertEq(uint256(guard.mode()), 1);

        vm.prank(callbackProxy);
        module.exitShield(allowedRvmId, bytes32("risk"));
        assertEq(uint256(guard.mode()), 0);
    }
}
