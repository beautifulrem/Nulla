// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {GuardianModule} from "../../src/GuardianModule.sol";
import {IERC20Minimal} from "../../src/interfaces/IERC20Minimal.sol";
import {ISafeMinimal} from "../../src/interfaces/ISafeMinimal.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {MockSafe} from "../helpers/MockSafe.sol";

contract GuardianModuleTest is Test {
    MockSafe internal safe;
    MockERC20 internal token;
    GuardianModule internal module;

    address internal controller = address(0xC0FFEE);
    address internal coldSafe = address(0xBEEF);
    address internal spender = address(0xBAD);

    event ProtectedTokenSynced(address indexed token, bool enabled);
    event ERC20Revoked(address indexed safe, address indexed token, address indexed spender);
    event ERC20Swept(address indexed safe, address indexed token, uint256 amount, address indexed coldSafe);

    function setUp() public {
        safe = new MockSafe();
        token = new MockERC20("Token", "TOK");
        module = new GuardianModule(address(safe), controller, coldSafe);
        token.mint(address(safe), 1_000 ether);
    }

    function test_ConstructorRejectsZeroAddresses() public {
        vm.expectRevert("zero address");
        new GuardianModule(address(0), controller, coldSafe);

        vm.expectRevert("zero address");
        new GuardianModule(address(safe), address(0), coldSafe);

        vm.expectRevert("zero address");
        new GuardianModule(address(safe), controller, address(0));
    }

    function test_OnlyControllerCanSyncProtectedToken() public {
        vm.expectRevert("controller only");
        module.syncProtectedToken(address(token), true);
    }

    function test_SyncProtectedTokenAsController() public {
        vm.expectEmit(true, false, false, true);
        emit ProtectedTokenSynced(address(token), true);
        vm.prank(controller);
        module.syncProtectedToken(address(token), true);
        assertTrue(module.protectedToken(address(token)));
    }

    function test_SyncProtectedTokenCanDisableProtection() public {
        vm.prank(controller);
        module.syncProtectedToken(address(token), true);

        vm.expectEmit(true, false, false, true);
        emit ProtectedTokenSynced(address(token), false);
        vm.prank(controller);
        module.syncProtectedToken(address(token), false);

        assertFalse(module.protectedToken(address(token)));
    }

    function test_RevokeRejectsUnprotectedToken() public {
        vm.prank(controller);
        vm.expectRevert("token not protected");
        module.revokeERC20(address(token), spender);
    }

    function test_RevokeEncodesApproveZero() public {
        vm.prank(controller);
        module.syncProtectedToken(address(token), true);

        vm.expectEmit(true, true, true, false);
        emit ERC20Revoked(address(safe), address(token), spender);
        vm.prank(controller);
        module.revokeERC20(address(token), spender);

        assertEq(safe.lastTo(), address(token));
        assertEq(safe.lastValue(), 0);
        assertEq(uint256(safe.lastOperation()), uint256(ISafeMinimal.Operation.Call));
        assertEq(safe.lastData(), abi.encodeWithSelector(IERC20Minimal.approve.selector, spender, 0));
    }

    function test_RevokeRevertsWhenSafeFails() public {
        vm.prank(controller);
        module.syncProtectedToken(address(token), true);
        safe.setForceModuleFailure(true);

        vm.prank(controller);
        vm.expectRevert("revoke failed");
        module.revokeERC20(address(token), spender);
    }

    function test_SweepTransfersFullBalanceToColdSafe() public {
        vm.prank(controller);
        module.syncProtectedToken(address(token), true);

        vm.expectEmit(true, true, false, true);
        emit ERC20Swept(address(safe), address(token), 1_000 ether, coldSafe);
        vm.prank(controller);
        module.sweepERC20(address(token));

        assertEq(safe.lastTo(), address(token));
        assertEq(safe.lastValue(), 0);
        assertEq(token.balanceOf(coldSafe), 1_000 ether);
        assertEq(token.balanceOf(address(safe)), 0);
    }

    function test_SweepRevertsWhenNoBalance() public {
        MockERC20 other = new MockERC20("Other", "OTH");
        vm.prank(controller);
        module.syncProtectedToken(address(other), true);

        vm.prank(controller);
        vm.expectRevert("nothing to sweep");
        module.sweepERC20(address(other));
    }

    function test_SweepRevertsWhenSafeFails() public {
        vm.prank(controller);
        module.syncProtectedToken(address(token), true);
        safe.setForceModuleFailure(true);

        vm.prank(controller);
        vm.expectRevert("sweep failed");
        module.sweepERC20(address(token));
    }

    function testFuzz_RevokeEncodesApproveZeroForAnySpender(address fuzzSpender) public {
        vm.prank(controller);
        module.syncProtectedToken(address(token), true);

        vm.prank(controller);
        module.revokeERC20(address(token), fuzzSpender);

        assertEq(safe.lastTo(), address(token));
        assertEq(safe.lastData(), abi.encodeWithSelector(IERC20Minimal.approve.selector, fuzzSpender, 0));
    }

    function testFuzz_SweepTransfersArbitraryPositiveBalance(uint96 amount) public {
        amount = uint96(bound(uint256(amount), 1, type(uint96).max));

        MockERC20 fuzzToken = new MockERC20("Fuzz", "FUZ");
        fuzzToken.mint(address(safe), amount);

        vm.prank(controller);
        module.syncProtectedToken(address(fuzzToken), true);

        vm.prank(controller);
        module.sweepERC20(address(fuzzToken));

        assertEq(fuzzToken.balanceOf(coldSafe), amount);
        assertEq(fuzzToken.balanceOf(address(safe)), 0);
    }
}
