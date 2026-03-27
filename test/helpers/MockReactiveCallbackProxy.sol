// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {GuardianController} from "../../src/GuardianController.sol";

contract MockReactiveCallbackProxy {
    function callApproval(
        GuardianController controller,
        address rvmId,
        address safeAddress,
        address spender,
        address token,
        uint256 amount
    ) external {
        controller.handleApprovalAlert(rvmId, safeAddress, spender, token, amount);
    }

    function callProtocol(
        GuardianController controller,
        address rvmId,
        address safeAddress,
        address protocol,
        address protectedToken,
        bytes32 riskTopic,
        bytes calldata rawData
    ) external {
        controller.handleProtocolAlert(rvmId, safeAddress, protocol, protectedToken, riskTopic, rawData);
    }
}
