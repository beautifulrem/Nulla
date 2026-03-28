// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ReactiveCrossChainFirewall} from "../../src/nulla/ReactiveCrossChainFirewall.sol";

contract ReactiveCrossChainFirewallTest is Test {
    ReactiveCrossChainFirewall internal firewall;

    uint256 internal constant ETH_CHAIN_ID = 11155111;
    uint256 internal constant BASE_CHAIN_ID = 84532;
    uint256 internal constant CRON_TOPIC = uint256(keccak256("Cron10(uint256)"));

    function setUp() external {
        address[] memory allowedSpenders = new address[](1);
        uint256[] memory allowedCaps = new uint256[](1);
        address[] memory blacklistedSpenders = new address[](1);

        allowedSpenders[0] = address(0xBEEF);
        allowedCaps[0] = 500e6;
        blacklistedSpenders[0] = address(0xDEAD);

        firewall = new ReactiveCrossChainFirewall(
            address(this),
            address(0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0),
            ETH_CHAIN_ID,
            address(0x1111),
            address(0x1010),
            address(0x2020),
            address(0x3030),
            BASE_CHAIN_ID,
            address(0x2222),
            address(0x4040),
            address(0x5050),
            address(0x6060),
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

    function test_IsHighRiskForUnknownSpenderOverCap() external view {
        (bool matched, uint8 reasonMask, uint8 riskScore) =
            firewall.isHighRisk(BASE_CHAIN_ID, address(0x4040), address(0xCAFE), 150e6);

        assertTrue(matched);
        assertEq(reasonMask, 1);
        assertEq(riskScore, 70);
    }

    function test_IsHighRiskForBlacklistedSpender() external view {
        (bool matched, uint8 reasonMask, uint8 riskScore) =
            firewall.isHighRisk(ETH_CHAIN_ID, address(0x1010), address(0xDEAD), 1);

        assertTrue(matched);
        assertEq(reasonMask, 2);
        assertEq(riskScore, 100);
    }

    function test_IsHighRiskIgnoresZeroApproval() external view {
        (bool matched, uint8 reasonMask, uint8 riskScore) =
            firewall.isHighRisk(ETH_CHAIN_ID, address(0x1010), address(0xDEAD), 0);

        assertFalse(matched);
        assertEq(reasonMask, 0);
        assertEq(riskScore, 0);
    }

    function test_ComputeAlertIdDeterministic() external view {
        bytes32 one = firewall.computeAlertId(BASE_CHAIN_ID, address(0x1234), address(0x4040), address(0xCAFE), 1, 2);
        bytes32 two = firewall.computeAlertId(BASE_CHAIN_ID, address(0x1234), address(0x4040), address(0xCAFE), 1, 2);
        assertEq(one, two);
    }

    function test_CronSubscriptionStartsDisabled() external view {
        assertFalse(firewall.cronSubscriptionActive());
        assertEq(firewall.activePendingShieldCount(), 0);
    }
}
