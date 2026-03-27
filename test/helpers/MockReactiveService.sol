// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISystemContract} from "../../src/reactive/ISystemContract.sol";

contract MockReactiveService is ISystemContract {
    struct CallRecord {
        bool subscribeCall;
        uint256 chainId;
        address contractAddress;
        uint256 topic0;
        uint256 topic1;
        uint256 topic2;
        uint256 topic3;
    }

    CallRecord[] public records;

    function subscribe(
        uint256 chainId,
        address contractAddress,
        uint256 topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3
    ) external override {
        records.push(CallRecord(true, chainId, contractAddress, topic0, topic1, topic2, topic3));
    }

    function unsubscribe(
        uint256 chainId,
        address contractAddress,
        uint256 topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3
    ) external override {
        records.push(CallRecord(false, chainId, contractAddress, topic0, topic1, topic2, topic3));
    }

    function recordsLength() external view returns (uint256) {
        return records.length;
    }
}
