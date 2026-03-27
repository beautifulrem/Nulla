// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {GuardianListener} from "../../src/GuardianListener.sol";

contract GuardianListenerHarness is GuardianListener {
    constructor(address systemContract_, address controller_, uint256 safeChainId_, uint256 controllerChainId_)
        GuardianListener(systemContract_, controller_, safeChainId_, controllerChainId_)
    {}

    function exposedBuildSubscribePayload(address safe) external view returns (bytes memory) {
        return _buildSubscribePayload(safe);
    }

    function exposedBuildUnsubscribePayload(address safe) external view returns (bytes memory) {
        return _buildUnsubscribePayload(safe);
    }

    function exposedBuildApprovalPayload(address safe, address spender, address token, uint256 amount)
        external
        view
        returns (bytes memory)
    {
        return _buildApprovalPayload(safe, spender, token, amount);
    }

    function exposedSubscribeSafe(address safe) external {
        _subscribeSafe(safe);
    }

    function exposedUnsubscribeSafe(address safe) external {
        _unsubscribeSafe(safe);
    }
}
