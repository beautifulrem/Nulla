// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ShieldGuard} from "../../src/nulla/ShieldGuard.sol";
import {Enum} from "safe-smart-account/contracts/libraries/Enum.sol";

contract ShieldGuardTest is Test {
    ShieldGuard internal guard;
    address internal owner = address(this);
    address internal module = address(0xABCD);
    address internal safe = address(0x1234);
    address internal token = address(0x9999);
    address internal spender = address(0xBEEF);

    function setUp() external {
        guard = new ShieldGuard(owner, safe, token);
        guard.setModule(module);
        guard.setPolicy(spender, true, false, 100e6);
    }

    function test_ShieldAllowsZeroApproval() external view {
        assertTrue(guard.isApprovalAllowed(token, spender, 0));
    }

    function test_ShieldRejectsUnknownSpender() external {
        vm.prank(module);
        guard.enterShieldFromModule(bytes32("a"), 84532, 10);

        bytes memory data = abi.encodeWithSignature("approve(address,uint256)", address(0xCAFE), 1);
        vm.expectRevert();
        guard.checkTransaction(token, 0, data, Enum.Operation.Call, 0, 0, 0, address(0), payable(address(0)), "", owner);
    }

    function test_ShieldAllowsConfiguredSpenderWithinCap() external {
        vm.prank(module);
        guard.enterShieldFromModule(bytes32("a"), 84532, 10);

        bytes memory data = abi.encodeWithSignature("approve(address,uint256)", spender, 10e6);
        guard.checkTransaction(token, 0, data, Enum.Operation.Call, 0, 0, 0, address(0), payable(address(0)), "", owner);
    }
}
