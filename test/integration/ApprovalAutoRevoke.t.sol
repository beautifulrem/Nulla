// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {GuardianController} from "../../src/GuardianController.sol";
import {GuardianModule} from "../../src/GuardianModule.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {MockSafe} from "../helpers/MockSafe.sol";

contract ApprovalAutoRevokeIntegrationTest is Test {
    MockSafe internal safe;
    MockERC20 internal token;
    MockERC20 internal otherToken;
    GuardianController internal controller;
    GuardianModule internal module;

    address internal listenerOwner = address(0xA11CE);
    address internal coldSafe = address(0xBEEF);
    address internal whitelistedSpender = address(0x1111);
    address internal badSpender = address(0x2222);
    address internal callbackSender;
    address internal expectedRvmId;

    function setUp() public {
        safe = new MockSafe();
        vm.prank(listenerOwner);
        controller = new GuardianController();
        module = new GuardianModule(address(safe), address(controller), coldSafe);
        token = new MockERC20("Token", "TOK");
        otherToken = new MockERC20("Other", "OTH");
        callbackSender = controller.callbackSender();
        expectedRvmId = controller.rvmId();

        safe.enableModule(address(module));
        token.mint(address(safe), 1_000 ether);
        otherToken.mint(address(safe), 1_000 ether);

        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: true, sweepable: false, maxAllowance: 100 ether});

        address[] memory whitelist = new address[](1);
        whitelist[0] = whitelistedSpender;

        address[] memory tokens = new address[](1);
        tokens[0] = address(token);

        vm.prank(address(safe));
        controller.registerPolicy(address(module), coldSafe, whitelist, tokens, rules);
    }

    function test_DangerousApprovalIsRevokedToZero() public {
        bool ok =
            safe.execCall(address(token), 0, abi.encodeWithSelector(token.approve.selector, badSpender, 500 ether));
        assertTrue(ok);
        assertEq(token.allowance(address(safe), badSpender), 500 ether);

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, address(token), 500 ether);
        assertEq(token.allowance(address(safe), badSpender), 0);
    }

    function test_SafeApprovalStaysUntouched() public {
        bool ok = safe.execCall(
            address(token), 0, abi.encodeWithSelector(token.approve.selector, whitelistedSpender, 100 ether)
        );
        assertTrue(ok);

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), whitelistedSpender, address(token), 100 ether);
        assertEq(token.allowance(address(safe), whitelistedSpender), 100 ether);
    }

    function test_WhitelistedSpenderOverLimitStillGetsRevoked() public {
        bool ok = safe.execCall(
            address(token), 0, abi.encodeWithSelector(token.approve.selector, whitelistedSpender, 250 ether)
        );
        assertTrue(ok);

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), whitelistedSpender, address(token), 250 ether);
        assertEq(token.allowance(address(safe), whitelistedSpender), 0);
    }

    function test_SecondZeroAmountAlertDoesNotUndoRevocation() public {
        bool ok =
            safe.execCall(address(token), 0, abi.encodeWithSelector(token.approve.selector, badSpender, 500 ether));
        assertTrue(ok);

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, address(token), 500 ether);
        assertEq(token.allowance(address(safe), badSpender), 0);

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, address(token), 0);
        assertEq(token.allowance(address(safe), badSpender), 0);
    }

    function test_UntrackedTokenApprovalIsIgnored() public {
        bool ok = safe.execCall(
            address(otherToken), 0, abi.encodeWithSelector(otherToken.approve.selector, badSpender, 500 ether)
        );
        assertTrue(ok);

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, address(otherToken), 500 ether);
        assertEq(otherToken.allowance(address(safe), badSpender), 500 ether);
    }

    function test_RemovePolicyStopsAutomaticAction() public {
        vm.prank(address(safe));
        controller.removePolicy();

        bool ok =
            safe.execCall(address(token), 0, abi.encodeWithSelector(token.approve.selector, badSpender, 250 ether));
        assertTrue(ok);

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, address(token), 250 ether);
        assertEq(token.allowance(address(safe), badSpender), 250 ether);
    }

    function testFuzz_DangerousApprovalOverLimitRevokes(uint96 amount) public {
        amount = uint96(bound(uint256(amount), 101 ether, type(uint96).max));

        bool ok = safe.execCall(address(token), 0, abi.encodeWithSelector(token.approve.selector, badSpender, amount));
        assertTrue(ok);
        assertEq(token.allowance(address(safe), badSpender), amount);

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, address(token), amount);
        assertEq(token.allowance(address(safe), badSpender), 0);
    }

    function testFuzz_WhitelistedApprovalWithinLimitStays(uint96 amount) public {
        amount = uint96(bound(uint256(amount), 0, 100 ether));

        bool ok = safe.execCall(
            address(token), 0, abi.encodeWithSelector(token.approve.selector, whitelistedSpender, amount)
        );
        assertTrue(ok);

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), whitelistedSpender, address(token), amount);
        assertEq(token.allowance(address(safe), whitelistedSpender), amount);
    }

    function testFuzz_ReRegisteringPolicyUpdatesLiveAllowanceLimit(uint96 newLimit, uint96 amount) public {
        newLimit = uint96(bound(uint256(newLimit), 0, 500 ether));
        amount = uint96(bound(uint256(amount), 0, 500 ether));

        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: true, sweepable: false, maxAllowance: newLimit});

        address[] memory whitelist = new address[](1);
        whitelist[0] = whitelistedSpender;

        address[] memory tokens = new address[](1);
        tokens[0] = address(token);

        vm.prank(address(safe));
        controller.registerPolicy(address(module), coldSafe, whitelist, tokens, rules);

        bool ok = safe.execCall(
            address(token), 0, abi.encodeWithSelector(token.approve.selector, whitelistedSpender, amount)
        );
        assertTrue(ok);

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), whitelistedSpender, address(token), amount);

        uint256 expectedAllowance = amount > newLimit ? 0 : amount;
        assertEq(token.allowance(address(safe), whitelistedSpender), expectedAllowance);
    }
}
