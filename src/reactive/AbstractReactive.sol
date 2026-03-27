// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AbstractPayer} from "./AbstractPayer.sol";
import {ISystemContract} from "./ISystemContract.sol";

abstract contract AbstractReactive is AbstractPayer {
    uint256 internal constant REACTIVE_IGNORE = 0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad;

    ISystemContract public immutable service;
    event Callback(uint256 indexed chainId, address indexed target, uint64 indexed gasLimit, bytes payload);

    constructor(address systemContract_) AbstractPayer(systemContract_) {
        service = ISystemContract(systemContract_);
    }

    modifier rnOnly() {
        require(!vm(), "reactive network only");
        _;
    }

    modifier vmOnly() {
        require(vm(), "react vm only");
        _;
    }

    function vm() public view returns (bool) {
        return _detectVm(address(service));
    }

    function _detectVm(address systemContract_) internal view returns (bool isVm) {
        uint256 size;
        assembly {
            size := extcodesize(systemContract_)
        }
        isVm = size == 0;
    }
}
