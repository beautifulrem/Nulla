// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {ApprovalFirewallModule} from "../../src/nulla/ApprovalFirewallModule.sol";
import {ReactiveCrossChainFirewall} from "../../src/nulla/ReactiveCrossChainFirewall.sol";
import {ShieldGuard} from "../../src/nulla/ShieldGuard.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";
import {MockSafe} from "../mocks/MockSafe.sol";
import {IReactive} from "reactive-lib/interfaces/IReactive.sol";

contract CrossChainFlowTest is Test {
    uint256 internal constant ETH_CHAIN_ID = 11155111;
    uint256 internal constant BASE_CHAIN_ID = 84532;
    uint256 internal constant CRON_TOPIC = uint256(keccak256("Cron10(uint256)"));

    address internal constant SAFE_ADDRESS = 0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0;
    address internal callbackProxy = address(0xCB);
    address internal rvmId = address(this);
    address internal spender = address(0xCAFE);

    MockSafe internal safeEth;
    MockSafe internal safeBase;
    MockUSDC internal tokenEth;
    MockUSDC internal tokenBase;
    ShieldGuard internal guardEth;
    ShieldGuard internal guardBase;
    ApprovalFirewallModule internal moduleEth;
    ApprovalFirewallModule internal moduleBase;
    ReactiveCrossChainFirewall internal firewall;

    function setUp() external {
        safeEth = new MockSafe();
        safeBase = new MockSafe();

        tokenEth = new MockUSDC(address(this));
        tokenBase = new MockUSDC(address(this));
        tokenBase.mint(address(safeBase), 1_000_000e6);

        guardEth = new ShieldGuard(address(this), address(safeEth), address(tokenEth));
        guardBase = new ShieldGuard(address(this), address(safeBase), address(tokenBase));
        moduleEth = new ApprovalFirewallModule(address(this), address(safeEth), address(guardEth), callbackProxy, rvmId);
        moduleBase = new ApprovalFirewallModule(address(this), address(safeBase), address(guardBase), callbackProxy, rvmId);
        guardEth.setModule(address(moduleEth));
        guardBase.setModule(address(moduleBase));
        safeEth.enableModule(address(moduleEth));
        safeBase.enableModule(address(moduleBase));

        address[] memory allowedSpenders = new address[](0);
        uint256[] memory allowedCaps = new uint256[](0);
        address[] memory blacklistedSpenders = new address[](0);

        firewall = new ReactiveCrossChainFirewall(
            address(this),
            SAFE_ADDRESS,
            ETH_CHAIN_ID,
            address(0x1111),
            address(tokenEth),
            address(moduleEth),
            address(guardEth),
            BASE_CHAIN_ID,
            address(0x2222),
            address(tokenBase),
            address(moduleBase),
            address(guardBase),
            100e6,
            allowedSpenders,
            allowedCaps,
            blacklistedSpenders,
            CRON_TOPIC,
            10,
            10,
            500_000
        );
    }

    function test_BaseRiskCanDriveRevokeAndPeerShield() external {
        vm.roll(2_000);
        vm.prank(address(safeBase));
        tokenBase.approve(spender, 250e6);

        IReactive.LogRecord memory log = IReactive.LogRecord({
            chain_id: BASE_CHAIN_ID,
            _contract: address(tokenBase),
            topic_0: uint256(keccak256("Approval(address,address,uint256)")),
            topic_1: uint256(uint160(SAFE_ADDRESS)),
            topic_2: uint256(uint160(spender)),
            topic_3: 0,
            data: abi.encode(uint256(250e6)),
            block_number: 100,
            op_code: 0,
            block_hash: 0,
            tx_hash: 111,
            log_index: 1
        });

        vm.recordLogs();
        firewall.react(log);
        Vm.Log[] memory entries = vm.getRecordedLogs();
        assertGt(entries.length, 0);

        bytes32 alertId = firewall.computeAlertId(BASE_CHAIN_ID, SAFE_ADDRESS, address(tokenBase), spender, 111, 1);
        uint64 untilTick = firewall.getPendingShield(alertId).untilTick;
        assertEq(untilTick, uint64(block.number / 10 + 10));
        assertTrue(firewall.cronSubscriptionActive());
        assertEq(firewall.activePendingShieldCount(), 1);
    }

    function test_ZeroApprovalDoesNotCreatePendingShield() external {
        vm.roll(2_000);

        IReactive.LogRecord memory log = IReactive.LogRecord({
            chain_id: BASE_CHAIN_ID,
            _contract: address(tokenBase),
            topic_0: uint256(keccak256("Approval(address,address,uint256)")),
            topic_1: uint256(uint160(SAFE_ADDRESS)),
            topic_2: uint256(uint160(spender)),
            topic_3: 0,
            data: abi.encode(uint256(0)),
            block_number: 100,
            op_code: 0,
            block_hash: 0,
            tx_hash: 222,
            log_index: 2
        });

        firewall.react(log);

        bytes32 alertId = firewall.computeAlertId(BASE_CHAIN_ID, SAFE_ADDRESS, address(tokenBase), spender, 222, 2);
        assertFalse(firewall.getPendingShield(alertId).active);
        assertFalse(firewall.cronSubscriptionActive());
        assertEq(firewall.activePendingShieldCount(), 0);
    }

    function test_CronDeletesExpiredPendingShieldAndUnsubscribes() external {
        vm.roll(2_000);
        vm.prank(address(safeBase));
        tokenBase.approve(spender, 250e6);

        IReactive.LogRecord memory approvalLog = IReactive.LogRecord({
            chain_id: BASE_CHAIN_ID,
            _contract: address(tokenBase),
            topic_0: uint256(keccak256("Approval(address,address,uint256)")),
            topic_1: uint256(uint160(SAFE_ADDRESS)),
            topic_2: uint256(uint160(spender)),
            topic_3: 0,
            data: abi.encode(uint256(250e6)),
            block_number: 100,
            op_code: 0,
            block_hash: 0,
            tx_hash: 333,
            log_index: 3
        });

        firewall.react(approvalLog);

        bytes32 alertId = firewall.computeAlertId(BASE_CHAIN_ID, SAFE_ADDRESS, address(tokenBase), spender, 333, 3);
        assertTrue(firewall.getPendingShield(alertId).active);
        assertTrue(firewall.cronSubscriptionActive());
        assertEq(firewall.activePendingShieldCount(), 1);

        vm.roll(2_200);

        IReactive.LogRecord memory cronLog = IReactive.LogRecord({
            chain_id: 0,
            _contract: address(0),
            topic_0: CRON_TOPIC,
            topic_1: 0,
            topic_2: 0,
            topic_3: 0,
            data: "",
            block_number: 0,
            op_code: 0,
            block_hash: 0,
            tx_hash: 444,
            log_index: 4
        });

        firewall.react(cronLog);

        assertFalse(firewall.getPendingShield(alertId).active);
        assertFalse(firewall.cronSubscriptionActive());
        assertEq(firewall.activePendingShieldCount(), 0);
    }
}
