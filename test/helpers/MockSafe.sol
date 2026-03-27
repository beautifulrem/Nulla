// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISafeMinimal} from "../../src/interfaces/ISafeMinimal.sol";
import {ISafeScriptMinimal} from "../../src/interfaces/ISafeScriptMinimal.sol";

contract MockSafe is ISafeMinimal, ISafeScriptMinimal {
    mapping(address => bool) public moduleEnabled;

    bool public forceModuleFailure;
    address public lastTo;
    uint256 public lastValue;
    bytes public lastData;
    Operation public lastOperation;

    uint256 public override nonce;

    function setExecShouldSucceed(bool value) external {
        forceModuleFailure = !value;
    }

    function setForceModuleFailure(bool value) external {
        forceModuleFailure = value;
    }

    function enableModule(address module) external override {
        moduleEnabled[module] = true;
    }

    function disableModule(address module) external {
        moduleEnabled[module] = false;
    }

    function isModuleEnabled(address module) external view override returns (bool) {
        return moduleEnabled[module];
    }

    function execTransactionFromModule(address to, uint256 value, bytes calldata data, Operation operation)
        external
        override
        returns (bool success)
    {
        lastTo = to;
        lastValue = value;
        lastData = data;
        lastOperation = operation;

        if (forceModuleFailure) {
            return false;
        }

        (success,) = to.call{value: value}(data);
    }

    function execCall(address to, uint256 value, bytes calldata data) external returns (bool success) {
        (success,) = to.call{value: value}(data);
    }

    function getTransactionHash(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address refundReceiver,
        uint256 _nonce
    ) external pure override returns (bytes32) {
        return keccak256(
            abi.encode(to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce)
        );
    }

    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        uint8,
        uint256,
        uint256,
        uint256,
        address,
        address,
        bytes calldata
    ) external payable override returns (bool success) {
        nonce++;
        (success,) = to.call{value: value}(data);
    }
}
