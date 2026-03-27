// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AbstractCallback} from "./reactive/AbstractCallback.sol";
import {ISafeMinimal} from "./interfaces/ISafeMinimal.sol";

interface IGuardianModuleLike {
    function safe() external view returns (ISafeMinimal);

    function controller() external view returns (address);

    function coldSafe() external view returns (address);

    function syncProtectedToken(address token, bool enabled) external;

    function revokeERC20(address token, address spender) external returns (bool);

    function sweepERC20(address token) external returns (bool);
}

contract GuardianController is AbstractCallback {
    address public constant DEFAULT_CALLBACK_PROXY = 0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA;

    struct TokenRule {
        bool autoRevoke;
        bool sweepable;
        uint256 maxAllowance;
    }

    struct Policy {
        address module;
        address coldSafe;
        bool active;
    }

    mapping(address => Policy) public policyOf;
    mapping(address => mapping(address => bool)) public spenderAllowed;
    mapping(address => mapping(address => TokenRule)) public tokenRuleOf;

    mapping(address => address[]) private whitelistSpendersOf;
    mapping(address => address[]) private protectedTokensOf;

    event PolicyRegistered(address indexed safe, address indexed module, address indexed coldSafe);
    event PolicyRemoved(address indexed safe);
    event ApprovalAlertHandled(
        address indexed safe, address indexed token, address indexed spender, uint256 amount, bool revoked
    );
    event ProtocolAlertHandled(
        address indexed safe, address indexed protocol, address indexed token, bytes32 riskTopic, bool swept
    );

    error InvalidModule(address module);
    error ModuleNotEnabled(address safeAddress, address module);
    error LengthMismatch();

    constructor() AbstractCallback(DEFAULT_CALLBACK_PROXY) {}

    function registerPolicy(
        address module,
        address coldSafe,
        address[] calldata whitelist_,
        address[] calldata tokens,
        TokenRule[] calldata rules
    ) external {
        address safeAddress = msg.sender;
        if (module == address(0) || coldSafe == address(0)) {
            revert InvalidModule(module);
        }
        if (tokens.length != rules.length) {
            revert LengthMismatch();
        }

        IGuardianModuleLike moduleLike = IGuardianModuleLike(module);
        if (address(moduleLike.safe()) != safeAddress) {
            revert InvalidModule(module);
        }
        if (moduleLike.controller() != address(this)) {
            revert InvalidModule(module);
        }
        if (moduleLike.coldSafe() != coldSafe) {
            revert InvalidModule(module);
        }
        if (!ISafeMinimal(safeAddress).isModuleEnabled(module)) {
            revert ModuleNotEnabled(safeAddress, module);
        }

        if (policyOf[safeAddress].active) {
            _clearPolicy(safeAddress, policyOf[safeAddress].module);
        }

        policyOf[safeAddress] = Policy({module: module, coldSafe: coldSafe, active: true});

        for (uint256 i = 0; i < whitelist_.length; i++) {
            address spender = whitelist_[i];
            if (!spenderAllowed[safeAddress][spender]) {
                spenderAllowed[safeAddress][spender] = true;
                whitelistSpendersOf[safeAddress].push(spender);
            }
        }

        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            tokenRuleOf[safeAddress][token] = rules[i];
            protectedTokensOf[safeAddress].push(token);
            moduleLike.syncProtectedToken(token, true);
        }

        emit PolicyRegistered(safeAddress, module, coldSafe);
    }

    function removePolicy() external {
        Policy memory p = policyOf[msg.sender];
        if (!p.active) {
            return;
        }

        _clearPolicy(msg.sender, p.module);
        emit PolicyRemoved(msg.sender);
    }

    function handleApprovalAlert(
        address actualRvmId,
        address safeAddress,
        address spender,
        address token,
        uint256 amount
    ) external authorizedSenderOnly rvmIdOnly(actualRvmId) {
        if (amount == 0) {
            return;
        }

        Policy memory p = policyOf[safeAddress];
        if (!p.active) {
            return;
        }

        TokenRule memory rule = tokenRuleOf[safeAddress][token];
        if (!rule.autoRevoke) {
            emit ApprovalAlertHandled(safeAddress, token, spender, amount, false);
            return;
        }

        bool risky = !spenderAllowed[safeAddress][spender] || amount > rule.maxAllowance;
        if (!risky) {
            emit ApprovalAlertHandled(safeAddress, token, spender, amount, false);
            return;
        }

        IGuardianModuleLike(p.module).revokeERC20(token, spender);
        emit ApprovalAlertHandled(safeAddress, token, spender, amount, true);
    }

    function handleProtocolAlert(
        address actualRvmId,
        address safeAddress,
        address protocol,
        address protectedToken,
        bytes32 riskTopic,
        bytes calldata
    ) external authorizedSenderOnly rvmIdOnly(actualRvmId) {
        Policy memory p = policyOf[safeAddress];
        if (!p.active) {
            return;
        }

        TokenRule memory rule = tokenRuleOf[safeAddress][protectedToken];
        if (!rule.sweepable) {
            emit ProtocolAlertHandled(safeAddress, protocol, protectedToken, riskTopic, false);
            return;
        }

        IGuardianModuleLike(p.module).sweepERC20(protectedToken);
        emit ProtocolAlertHandled(safeAddress, protocol, protectedToken, riskTopic, true);
    }

    function getWhitelistSpenders(address safeAddress) external view returns (address[] memory) {
        return whitelistSpendersOf[safeAddress];
    }

    function getProtectedTokens(address safeAddress) external view returns (address[] memory) {
        return protectedTokensOf[safeAddress];
    }

    function _clearPolicy(address safeAddress, address module) internal {
        address[] storage spenders = whitelistSpendersOf[safeAddress];
        for (uint256 i = 0; i < spenders.length; i++) {
            spenderAllowed[safeAddress][spenders[i]] = false;
        }
        delete whitelistSpendersOf[safeAddress];

        address[] storage tokens = protectedTokensOf[safeAddress];
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            delete tokenRuleOf[safeAddress][token];
            IGuardianModuleLike(module).syncProtectedToken(token, false);
        }
        delete protectedTokensOf[safeAddress];

        delete policyOf[safeAddress];
    }
}
