// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {AbstractCallback} from "reactive-lib/abstract-base/AbstractCallback.sol";
import {ISafe} from "safe-smart-account/contracts/interfaces/ISafe.sol";
import {Enum} from "safe-smart-account/contracts/libraries/Enum.sol";
import {Alert} from "./NullaTypes.sol";
import {ShieldGuard} from "./ShieldGuard.sol";

contract ApprovalFirewallModule is AbstractCallback, Ownable {
    error InvalidRvmId(address provided);
    error SafeExecutionFailed();
    error UnauthorizedCaller();

    event ApprovalRevoked(bytes32 indexed alertId, address indexed token, address indexed spender, uint256 amount);
    event ShieldEntered(bytes32 indexed alertId, uint256 indexed sourceChainId, uint64 untilTick, uint8 riskScore);
    event ShieldExited(bytes32 indexed alertId);

    ISafe public immutable safe;
    ShieldGuard public immutable guard;
    address public immutable callbackProxy;
    address public allowedRvmId;

    mapping(bytes32 => Alert) private alerts;

    constructor(
        address initialOwner,
        address safeAddress,
        address guardAddress,
        address callbackProxyAddress,
        address initialAllowedRvmId
    ) payable AbstractCallback(callbackProxyAddress) Ownable(initialOwner) {
        safe = ISafe(payable(safeAddress));
        guard = ShieldGuard(guardAddress);
        callbackProxy = callbackProxyAddress;
        allowedRvmId = initialAllowedRvmId;
    }

    modifier onlyCallback(address rvmId) {
        if (msg.sender != callbackProxy) {
            revert UnauthorizedCaller();
        }
        if (allowedRvmId != address(0) && rvmId != allowedRvmId) {
            revert InvalidRvmId(rvmId);
        }
        _;
    }

    function setAllowedRvmId(address newAllowedRvmId) external onlyOwner {
        allowedRvmId = newAllowedRvmId;
    }

    function revokeApproval(
        address rvmId,
        bytes32 alertId,
        address token,
        address spender,
        uint256 amount,
        uint8 reasonMask,
        uint8 riskScore
    ) external onlyCallback(rvmId) {
        bytes memory data = abi.encodeCall(IERC20.approve, (spender, 0));
        bool success = safe.execTransactionFromModule(token, 0, data, Enum.Operation.Call);
        if (!success) {
            revert SafeExecutionFailed();
        }

        Alert storage alert = alerts[alertId];
        alert.id = alertId;
        alert.safeAddress = address(safe);
        alert.token = token;
        alert.spender = spender;
        alert.amount = amount;
        alert.reasonMask = reasonMask;
        alert.riskScore = riskScore;
        alert.sourceRevoked = true;

        emit ApprovalRevoked(alertId, token, spender, amount);
    }

    function enterShield(
        address rvmId,
        bytes32 alertId,
        uint256 sourceChainId,
        uint64 untilTick,
        uint8 riskScore
    ) external onlyCallback(rvmId) {
        guard.enterShieldFromModule(alertId, sourceChainId, untilTick);

        Alert storage alert = alerts[alertId];
        alert.id = alertId;
        alert.safeAddress = address(safe);
        alert.riskScore = riskScore;
        alert.peerShielded = true;
        alert.shieldUntilTick = untilTick;

        emit ShieldEntered(alertId, sourceChainId, untilTick, riskScore);
    }

    function exitShield(address rvmId, bytes32 alertId) external onlyCallback(rvmId) {
        guard.exitShieldFromModule(alertId);
        alerts[alertId].resolved = true;
        emit ShieldExited(alertId);
    }

    function getAlert(bytes32 alertId) external view returns (Alert memory) {
        return alerts[alertId];
    }
}
