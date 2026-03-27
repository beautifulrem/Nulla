// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPayable} from "./IPayable.sol";

abstract contract AbstractPayer {
    address public immutable callbackSender;
    IPayable public immutable vendor;

    mapping(address => bool) internal senders;

    error UnauthorizedSender(address sender);
    error InsufficientFunds(uint256 balance, uint256 requested);
    error TransferFailed();

    constructor(address callbackSender_) {
        callbackSender = callbackSender_;
        vendor = IPayable(callbackSender_);
        addAuthorizedSender(callbackSender_);
    }

    modifier authorizedSenderOnly() {
        if (!senders[msg.sender]) {
            revert UnauthorizedSender(msg.sender);
        }
        _;
    }

    function pay(uint256 amount) external authorizedSenderOnly {
        _pay(payable(msg.sender), amount);
    }

    function coverDebt() external {
        _pay(payable(callbackSender), vendor.debt(address(this)));
    }

    receive() external payable {}

    function addAuthorizedSender(address sender) internal {
        senders[sender] = true;
    }

    function removeAuthorizedSender(address sender) internal {
        senders[sender] = false;
    }

    function _pay(address payable recipient, uint256 amount) internal {
        if (address(this).balance < amount) {
            revert InsufficientFunds(address(this).balance, amount);
        }
        if (amount == 0) {
            return;
        }

        (bool success,) = recipient.call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
    }
}
