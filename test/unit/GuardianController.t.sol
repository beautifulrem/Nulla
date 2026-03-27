// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {GuardianController} from "../../src/GuardianController.sol";
import {FakeModule} from "../helpers/FakeModule.sol";
import {MockSafe} from "../helpers/MockSafe.sol";

contract GuardianControllerTest is Test {
    MockSafe internal safe;
    GuardianController internal controller;
    FakeModule internal module;

    address internal listenerOwner = address(0xA11CE);
    address internal coldSafe = address(0xC01D);
    address internal whiteSpender = address(0x1111);
    address internal badSpender = address(0x2222);
    address internal token = address(0x3333);
    address internal otherToken = address(0x3334);
    address internal protocol = address(0x4444);
    address internal callbackSender;
    address internal expectedRvmId;

    function setUp() public {
        safe = new MockSafe();
        vm.prank(listenerOwner);
        controller = new GuardianController();
        module = new FakeModule(address(safe), address(controller), coldSafe);
        safe.enableModule(address(module));
        callbackSender = controller.callbackSender();
        expectedRvmId = controller.rvmId();
    }

    function test_RegisterPolicyStoresPolicyAndSyncsToken() public {
        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: true, sweepable: false, maxAllowance: 100});

        address[] memory whitelist = new address[](1);
        whitelist[0] = whiteSpender;

        address[] memory tokens = new address[](1);
        tokens[0] = token;

        vm.prank(address(safe));
        controller.registerPolicy(address(module), coldSafe, whitelist, tokens, rules);

        (address storedModule, address storedColdSafe, bool active) = controller.policyOf(address(safe));
        assertEq(storedModule, address(module));
        assertEq(storedColdSafe, coldSafe);
        assertTrue(active);
        assertTrue(controller.spenderAllowed(address(safe), whiteSpender));
        (bool autoRevoke, bool sweepable, uint256 maxAllowance) = controller.tokenRuleOf(address(safe), token);
        assertTrue(autoRevoke);
        assertFalse(sweepable);
        assertEq(maxAllowance, 100);
        assertEq(module.syncCalls(), 1);
        assertEq(module.lastSyncedToken(), token);
        assertTrue(module.lastSyncedEnabled());
    }

    function testFuzz_RegisterPolicyStoresArbitraryRule(
        bool autoRevoke,
        bool sweepable,
        uint96 maxAllowance,
        address fuzzSpender,
        address fuzzToken
    ) public {
        vm.assume(fuzzToken != address(0));

        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] =
            GuardianController.TokenRule({autoRevoke: autoRevoke, sweepable: sweepable, maxAllowance: maxAllowance});

        address[] memory whitelist = new address[](1);
        whitelist[0] = fuzzSpender;

        address[] memory tokens = new address[](1);
        tokens[0] = fuzzToken;

        vm.prank(address(safe));
        controller.registerPolicy(address(module), coldSafe, whitelist, tokens, rules);

        (bool storedAutoRevoke, bool storedSweepable, uint256 storedMaxAllowance) =
            controller.tokenRuleOf(address(safe), fuzzToken);
        assertEq(storedAutoRevoke, autoRevoke);
        assertEq(storedSweepable, sweepable);
        assertEq(storedMaxAllowance, uint256(maxAllowance));
        assertTrue(controller.spenderAllowed(address(safe), fuzzSpender));
    }

    function test_RegisterPolicyRequiresEnabledModule() public {
        MockSafe otherSafe = new MockSafe();
        FakeModule otherModule = new FakeModule(address(otherSafe), address(controller), coldSafe);

        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: true, sweepable: false, maxAllowance: 100});
        address[] memory whitelist = new address[](0);
        address[] memory tokens = new address[](1);
        tokens[0] = token;

        vm.prank(address(otherSafe));
        vm.expectRevert(
            abi.encodeWithSelector(
                GuardianController.ModuleNotEnabled.selector, address(otherSafe), address(otherModule)
            )
        );
        controller.registerPolicy(address(otherModule), coldSafe, whitelist, tokens, rules);
    }

    function test_RegisterPolicyRejectsMismatchedArrayLengths() public {
        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](0);
        address[] memory whitelist = new address[](0);
        address[] memory tokens = new address[](1);
        tokens[0] = token;

        vm.prank(address(safe));
        vm.expectRevert(GuardianController.LengthMismatch.selector);
        controller.registerPolicy(address(module), coldSafe, whitelist, tokens, rules);
    }

    function test_RegisterPolicyRejectsModuleBoundToDifferentSafe() public {
        FakeModule wrongModule = new FakeModule(address(otherToken), address(controller), coldSafe);

        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: true, sweepable: false, maxAllowance: 100});
        address[] memory whitelist = new address[](0);
        address[] memory tokens = new address[](1);
        tokens[0] = token;

        vm.prank(address(safe));
        vm.expectRevert(abi.encodeWithSelector(GuardianController.InvalidModule.selector, address(wrongModule)));
        controller.registerPolicy(address(wrongModule), coldSafe, whitelist, tokens, rules);
    }

    function test_RegisterPolicyRejectsModuleBoundToDifferentController() public {
        FakeModule wrongModule = new FakeModule(address(safe), address(0x1234), coldSafe);

        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: true, sweepable: false, maxAllowance: 100});
        address[] memory whitelist = new address[](0);
        address[] memory tokens = new address[](1);
        tokens[0] = token;

        safe.enableModule(address(wrongModule));

        vm.prank(address(safe));
        vm.expectRevert(abi.encodeWithSelector(GuardianController.InvalidModule.selector, address(wrongModule)));
        controller.registerPolicy(address(wrongModule), coldSafe, whitelist, tokens, rules);
    }

    function test_RegisterPolicyRejectsModuleBoundToDifferentColdSafe() public {
        FakeModule wrongModule = new FakeModule(address(safe), address(controller), address(0x9999));

        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: true, sweepable: false, maxAllowance: 100});
        address[] memory whitelist = new address[](0);
        address[] memory tokens = new address[](1);
        tokens[0] = token;

        safe.enableModule(address(wrongModule));

        vm.prank(address(safe));
        vm.expectRevert(abi.encodeWithSelector(GuardianController.InvalidModule.selector, address(wrongModule)));
        controller.registerPolicy(address(wrongModule), coldSafe, whitelist, tokens, rules);
    }

    function test_RegisterPolicyReplacesPreviousWhitelistAndRules() public {
        _registerDefaultPolicy();

        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: false, sweepable: true, maxAllowance: 77});

        address[] memory whitelist = new address[](1);
        whitelist[0] = badSpender;

        address[] memory tokens = new address[](1);
        tokens[0] = otherToken;

        vm.prank(address(safe));
        controller.registerPolicy(address(module), coldSafe, whitelist, tokens, rules);

        assertFalse(controller.spenderAllowed(address(safe), whiteSpender));
        assertTrue(controller.spenderAllowed(address(safe), badSpender));

        (bool oldAutoRevoke,, uint256 oldMaxAllowance) = controller.tokenRuleOf(address(safe), token);
        assertFalse(oldAutoRevoke);
        assertEq(oldMaxAllowance, 0);

        (bool newAutoRevoke, bool newSweepable, uint256 newMaxAllowance) =
            controller.tokenRuleOf(address(safe), otherToken);
        assertFalse(newAutoRevoke);
        assertTrue(newSweepable);
        assertEq(newMaxAllowance, 77);

        assertEq(module.syncCalls(), 3);
        assertEq(module.syncedTokens(0), token);
        assertTrue(module.syncedStates(0));
        assertEq(module.syncedTokens(1), token);
        assertFalse(module.syncedStates(1));
        assertEq(module.syncedTokens(2), otherToken);
        assertTrue(module.syncedStates(2));
    }

    function test_RemovePolicyNoOpsWhenMissingPolicy() public {
        controller.removePolicy();

        (address storedModule,, bool active) = controller.policyOf(address(this));
        assertEq(storedModule, address(0));
        assertFalse(active);
        assertEq(module.syncCalls(), 0);
    }

    function test_RemovePolicyClearsWhitelistAndTokenRules() public {
        _registerDefaultPolicy();

        vm.prank(address(safe));
        controller.removePolicy();

        (address storedModule,, bool active) = controller.policyOf(address(safe));
        assertEq(storedModule, address(0));
        assertFalse(active);
        assertFalse(controller.spenderAllowed(address(safe), whiteSpender));
        (bool autoRevoke, bool sweepable, uint256 maxAllowance) = controller.tokenRuleOf(address(safe), token);
        assertFalse(autoRevoke);
        assertFalse(sweepable);
        assertEq(maxAllowance, 0);
        assertEq(controller.getWhitelistSpenders(address(safe)).length, 0);
        assertEq(controller.getProtectedTokens(address(safe)).length, 0);
        assertEq(module.syncCalls(), 2);
        assertEq(module.lastSyncedToken(), token);
        assertFalse(module.lastSyncedEnabled());
    }

    function test_HandleApprovalAlertRequiresAuthorizedSender() public {
        _registerDefaultPolicy();

        vm.expectRevert(abi.encodeWithSignature("UnauthorizedSender(address)", address(this)));
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, token, 200);
    }

    function test_HandleApprovalAlertRequiresExpectedRvmId() public {
        _registerDefaultPolicy();

        vm.expectRevert(abi.encodeWithSignature("UnauthorizedRvmId(address,address)", address(0xDEAD), listenerOwner));
        vm.prank(callbackSender);
        controller.handleApprovalAlert(address(0xDEAD), address(safe), badSpender, token, 200);
    }

    function test_HandleApprovalAlertIgnoresZeroAmount() public {
        _registerDefaultPolicy();

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, token, 0);
        assertEq(module.revokeCalls(), 0);
    }

    function test_HandleApprovalAlertDoesNotRevokeSafeApproval() public {
        _registerDefaultPolicy();

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), whiteSpender, token, 100);
        assertEq(module.revokeCalls(), 0);
    }

    function test_HandleApprovalAlertRevokesUnknownSpender() public {
        _registerDefaultPolicy();

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, token, 50);
        assertEq(module.revokeCalls(), 1);
        assertEq(module.lastRevokedToken(), token);
        assertEq(module.lastRevokedSpender(), badSpender);
    }

    function test_HandleApprovalAlertRevokesOverLimitApproval() public {
        _registerDefaultPolicy();

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), whiteSpender, token, 101);
        assertEq(module.revokeCalls(), 1);
    }

    function test_HandleApprovalAlertNoOpWhenAutoRevokeDisabled() public {
        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: false, sweepable: false, maxAllowance: 100});

        address[] memory whitelist = new address[](0);
        address[] memory tokens = new address[](1);
        tokens[0] = token;

        vm.prank(address(safe));
        controller.registerPolicy(address(module), coldSafe, whitelist, tokens, rules);

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, token, 500);
        assertEq(module.revokeCalls(), 0);
    }

    function test_HandleApprovalAlertNoOpWhenMissingPolicy() public {
        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, token, 500);
        assertEq(module.revokeCalls(), 0);
    }

    function test_HandleApprovalAlertNoOpWhenTokenNotTracked() public {
        _registerDefaultPolicy();

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), badSpender, otherToken, 500);
        assertEq(module.revokeCalls(), 0);
    }

    function test_HandleProtocolAlertTriggersSweepWhenSweepable() public {
        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: true, sweepable: true, maxAllowance: 100});

        address[] memory whitelist = new address[](0);
        address[] memory tokens = new address[](1);
        tokens[0] = token;

        vm.prank(address(safe));
        controller.registerPolicy(address(module), coldSafe, whitelist, tokens, rules);

        vm.prank(callbackSender);
        controller.handleProtocolAlert(expectedRvmId, address(safe), protocol, token, keccak256("Paused"), "");
        assertEq(module.sweepCalls(), 1);
        assertEq(module.lastSweptToken(), token);
    }

    function test_HandleProtocolAlertNoOpWhenUnsweepable() public {
        _registerDefaultPolicy();

        vm.prank(callbackSender);
        controller.handleProtocolAlert(expectedRvmId, address(safe), protocol, token, keccak256("Paused"), "");
        assertEq(module.sweepCalls(), 0);
    }

    function test_HandleProtocolAlertNoOpWhenMissingPolicy() public {
        vm.prank(callbackSender);
        controller.handleProtocolAlert(expectedRvmId, address(safe), protocol, token, keccak256("Paused"), "");
        assertEq(module.sweepCalls(), 0);
    }

    function testFuzz_WhitelistedApprovalWithinLimitDoesNotRevoke(uint96 amount) public {
        amount = uint96(bound(uint256(amount), 1, 100));
        _registerDefaultPolicy();

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), whiteSpender, token, amount);
        assertEq(module.revokeCalls(), 0);
    }

    function testFuzz_WhitelistedApprovalOverLimitRevokes(uint96 amount) public {
        amount = uint96(bound(uint256(amount), 101, type(uint96).max));
        _registerDefaultPolicy();

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), whiteSpender, token, amount);
        assertEq(module.revokeCalls(), 1);
        assertEq(module.lastRevokedSpender(), whiteSpender);
    }

    function testFuzz_NonWhitelistedApprovalRevokesForAnyPositiveAmount(uint96 amount, address fuzzSpender) public {
        amount = uint96(bound(uint256(amount), 1, type(uint96).max));
        vm.assume(fuzzSpender != whiteSpender);
        _registerDefaultPolicy();

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), fuzzSpender, token, amount);
        assertEq(module.revokeCalls(), 1);
        assertEq(module.lastRevokedSpender(), fuzzSpender);
    }

    function testFuzz_ZeroAmountNeverRevokes(address fuzzSpender, address fuzzToken) public {
        _registerDefaultPolicy();

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), fuzzSpender, fuzzToken, 0);
        assertEq(module.revokeCalls(), 0);
    }

    function testFuzz_UnknownTokenNeverRevokesForAnyPositiveAmount(address fuzzSpender, uint96 amount) public {
        _registerDefaultPolicy();

        address fuzzToken = address(uint160(uint256(keccak256(abi.encodePacked(fuzzSpender, amount, "unknown-token")))));
        vm.assume(fuzzToken != token);
        amount = uint96(bound(uint256(amount), 1, type(uint96).max));

        vm.prank(callbackSender);
        controller.handleApprovalAlert(expectedRvmId, address(safe), fuzzSpender, fuzzToken, uint256(amount));
        assertEq(module.revokeCalls(), 0);
    }

    function _registerDefaultPolicy() internal {
        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: true, sweepable: false, maxAllowance: 100});

        address[] memory whitelist = new address[](1);
        whitelist[0] = whiteSpender;

        address[] memory tokens = new address[](1);
        tokens[0] = token;

        vm.prank(address(safe));
        controller.registerPolicy(address(module), coldSafe, whitelist, tokens, rules);
    }
}
