// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISafeMinimal} from "../../src/interfaces/ISafeMinimal.sol";

contract FakeModule {
    ISafeMinimal public immutable safe;
    address public immutable controller;
    address public immutable coldSafe;

    address[] public syncedTokens;
    bool[] public syncedStates;

    address public lastRevokedToken;
    address public lastRevokedSpender;
    address public lastSweptToken;
    address public lastSyncedToken;
    bool public lastSyncedEnabled;
    uint256 public syncCalls;
    uint256 public revokeCalls;
    uint256 public sweepCalls;

    constructor(address safe_, address controller_, address coldSafe_) {
        safe = ISafeMinimal(safe_);
        controller = controller_;
        coldSafe = coldSafe_;
    }

    function syncProtectedToken(address token, bool enabled) external {
        lastSyncedToken = token;
        lastSyncedEnabled = enabled;
        syncCalls++;
        syncedTokens.push(token);
        syncedStates.push(enabled);
    }

    function revokeERC20(address token, address spender) external returns (bool) {
        lastRevokedToken = token;
        lastRevokedSpender = spender;
        revokeCalls++;
        return true;
    }

    function sweepERC20(address token) external returns (bool) {
        lastSweptToken = token;
        sweepCalls++;
        return true;
    }
}
