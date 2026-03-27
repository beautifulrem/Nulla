// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

import {GuardianController} from "../src/GuardianController.sol";
import {IERC20Minimal} from "../src/interfaces/IERC20Minimal.sol";
import {ISafeMinimal} from "../src/interfaces/ISafeMinimal.sol";
import {ISafeScriptMinimal} from "../src/interfaces/ISafeScriptMinimal.sol";

contract RegisterPolicyAndDemo is Script {
    function run() external {
        uint256 ownerPk = vm.envUint("SAFE_OWNER_PRIVATE_KEY");
        address safeAddress = vm.envAddress("SAFE_ADDRESS");
        address controllerAddress = vm.envAddress("GUARDIAN_CONTROLLER_ADDRESS");
        address module = vm.envAddress("GUARDIAN_MODULE_ADDRESS");
        address coldSafe = vm.envAddress("COLD_WALLET_ADDRESS");
        address token = vm.envAddress("MOCK_ERC20_ADDRESS");
        address badSpender = vm.envAddress("MOCK_BAD_SPENDER_ADDRESS");

        ISafeScriptMinimal safe = ISafeScriptMinimal(safeAddress);
        GuardianController.TokenRule[] memory rules = new GuardianController.TokenRule[](1);
        rules[0] = GuardianController.TokenRule({autoRevoke: true, sweepable: false, maxAllowance: 100 ether});

        address[] memory whitelist = new address[](0);
        address[] memory tokens = new address[](1);
        tokens[0] = token;

        bytes memory registerData = abi.encodeWithSelector(
            GuardianController.registerPolicy.selector, module, coldSafe, whitelist, tokens, rules
        );
        _execSingleSig(ownerPk, safe, controllerAddress, 0, registerData, uint8(ISafeMinimal.Operation.Call));

        bytes memory approveData = abi.encodeWithSelector(IERC20Minimal.approve.selector, badSpender, 1_000 ether);
        _execSingleSig(ownerPk, safe, token, 0, approveData, uint8(ISafeMinimal.Operation.Call));
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
