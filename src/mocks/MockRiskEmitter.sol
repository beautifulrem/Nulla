// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockRiskEmitter {
    event Paused(address indexed protocol);
    event EmergencyShutdown(address indexed protocol);
    event Upgraded(address indexed implementation);

    function emitPaused(address protocol) external {
        emit Paused(protocol);
    }

    function emitEmergencyShutdown(address protocol) external {
        emit EmergencyShutdown(protocol);
    }

    function emitUpgraded(address implementation) external {
        emit Upgraded(implementation);
    }
}
