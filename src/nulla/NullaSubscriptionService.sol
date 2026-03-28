// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

contract NullaSubscriptionService is Ownable {
    error InvalidSpender();
    error AlreadySubscribed(address spender);
    error NotSubscribed(address spender);

    event Subscribe(address indexed spender);
    event Unsubscribe(address indexed spender);

    mapping(address => bool) public subscribed;

    constructor(address initialOwner) payable Ownable(initialOwner) {}

    function subscribeSpender(address spender) external onlyOwner {
        if (spender == address(0)) revert InvalidSpender();
        if (subscribed[spender]) revert AlreadySubscribed(spender);
        subscribed[spender] = true;
        emit Subscribe(spender);
    }

    function unsubscribeSpender(address spender) external onlyOwner {
        if (!subscribed[spender]) revert NotSubscribed(spender);
        subscribed[spender] = false;
        emit Unsubscribe(spender);
    }
}
