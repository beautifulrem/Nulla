// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum ProfileStatus {
    Unset,
    PartialConfigured,
    Active
}

enum GuardMode {
    Monitor,
    Shield
}

struct GuardianProfile {
    address safeAddress;
    address owner;
    address moduleEth;
    address moduleBase;
    address guardEth;
    address guardBase;
    address reactiveLasna;
    bytes32 policyHash;
    ProfileStatus status;
}

struct PolicyConfig {
    uint256 cap;
    bool allowed;
    bool blacklisted;
}

struct Alert {
    bytes32 id;
    uint256 sourceChainId;
    address safeAddress;
    address token;
    address spender;
    uint256 amount;
    uint8 reasonMask;
    uint8 riskScore;
    uint64 createdTick;
    uint64 shieldUntilTick;
    bool sourceRevoked;
    bool peerShielded;
    bool resolved;
}

struct PendingShield {
    bytes32 alertId;
    uint256 peerChainId;
    address peerModule;
    address peerGuard;
    uint64 untilTick;
    bool active;
}
