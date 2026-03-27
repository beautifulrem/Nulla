// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPayable {
    function debt(address reactiveContract) external view returns (uint256);
}
