// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Enum} from "safe-smart-account/contracts/libraries/Enum.sol";

contract MockSafe {
    mapping(address => bool) public modules;
    address public guard;

    event ModuleExecution(address indexed module, address indexed to, bytes data, bool success);

    function enableModule(address module) external {
        modules[module] = true;
    }

    function setGuard(address newGuard) external {
        guard = newGuard;
    }

    function isModuleEnabled(address module) external view returns (bool) {
        return modules[module];
    }

    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) external returns (bool success) {
        require(modules[msg.sender], "module not enabled");
        require(operation == Enum.Operation.Call, "unsupported operation");
        (success,) = to.call{value: value}(data);
        emit ModuleExecution(msg.sender, to, data, success);
    }
}
