// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {NullaSubscriptionService} from "../../src/nulla/NullaSubscriptionService.sol";

contract NullaSubscriptionServiceTest is Test {
    NullaSubscriptionService internal service;
    address internal spender = address(0xCAFE);

    function setUp() external {
        service = new NullaSubscriptionService(address(this));
    }

    function test_SubscribeAndUnsubscribeSpender() external {
        service.subscribeSpender(spender);
        assertTrue(service.subscribed(spender));

        service.unsubscribeSpender(spender);
        assertFalse(service.subscribed(spender));
    }
}
