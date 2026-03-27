// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

import {ISafeMinimal} from "../src/interfaces/ISafeMinimal.sol";
import {ISafeScriptMinimal} from "../src/interfaces/ISafeScriptMinimal.sol";

contract EnableModule is Script {
    function run() external {
        uint256 ownerPk = vm.envUint("SAFE_OWNER_PRIVATE_KEY");
        address safeAddress = vm.envAddress("SAFE_ADDRESS");
        address module = vm.envAddress("GUARDIAN_MODULE_ADDRESS");

        ISafeScriptMinimal safe = ISafeScriptMinimal(safeAddress);
        bytes memory data = abi.encodeWithSelector(ISafeMinimal.enableModule.selector, module);
        _execSingleSig(ownerPk, safe, safeAddress, 0, data, uint8(ISafeMinimal.Operation.Call));
    }

    function _execSingleSig(
        uint256 ownerPk,
        ISafeScriptMinimal safe,
        address to,
        uint256 value,
        bytes memory data,
        uint8 operation
    ) internal {
        uint256 safeNonce = safe.nonce();
        bytes32 txHash = safe.getTransactionHash(to, value, data, operation, 0, 0, 0, address(0), address(0), safeNonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPk, txHash);
        bytes memory signatures = abi.encodePacked(r, s, v);

        vm.startBroadcast(ownerPk);
        bool ok = safe.execTransaction(to, value, data, operation, 0, 0, 0, address(0), address(0), signatures);
        vm.stopBroadcast();

        require(ok, "safe transaction failed");
    }
}
