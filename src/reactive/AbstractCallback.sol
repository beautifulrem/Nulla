// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AbstractPayer} from "./AbstractPayer.sol";

abstract contract AbstractCallback is AbstractPayer {
    address public immutable rvmId;

    error UnauthorizedRvmId(address actualRvmId, address expectedRvmId);

    constructor(address callbackSender_) AbstractPayer(callbackSender_) {
        rvmId = msg.sender;
    }

    modifier rvmIdOnly(address actualRvmId) {
        if (actualRvmId != rvmId) {
            revert UnauthorizedRvmId(actualRvmId, rvmId);
        }
        _;
    }
}
