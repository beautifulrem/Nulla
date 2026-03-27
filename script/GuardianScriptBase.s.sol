// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {console2, Script} from "forge-std/Script.sol";

import {GuardianController} from "../src/GuardianController.sol";
import {GuardianListener} from "../src/GuardianListener.sol";
import {GuardianModule} from "../src/GuardianModule.sol";
import {MockBadSpender} from "../src/mocks/MockBadSpender.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockRiskEmitter} from "../src/mocks/MockRiskEmitter.sol";
import {ISafeMinimal} from "../src/interfaces/ISafeMinimal.sol";
import {ISafeScriptMinimal} from "../src/interfaces/ISafeScriptMinimal.sol";

abstract contract GuardianScriptBase is Script {
    address internal constant ZERO_ADDRESS = address(0);

    struct EnvConfig {
        string sepoliaRpcUrl;
        string reactiveRpcUrl;
        uint256 sepoliaChainId;
        uint256 reactiveChainId;
        uint256 deployerPrivateKey;
        address deployerAddress;
        uint256 safeOwnerPrivateKey;
        address safeOwnerAddress;
        address safeAddress;
        uint256 coldWalletPrivateKey;
        address coldWalletAddress;
        string etherscanApiKey;
        address sepoliaCallbackProxy;
        address lasnaCallbackProxy;
        address reactiveSystemContract;
    }

    function _loadEnv() internal view returns (EnvConfig memory cfg) {
        cfg.sepoliaRpcUrl = vm.envString("SEPOLIA_RPC_URL");
        cfg.reactiveRpcUrl = vm.envString("REACTIVE_RPC_URL");
        cfg.sepoliaChainId = vm.envUint("SEPOLIA_CHAIN_ID");
        cfg.reactiveChainId = vm.envUint("REACTIVE_CHAIN_ID");
        cfg.deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        cfg.deployerAddress = vm.envAddress("DEPLOYER_ADDRESS");
        cfg.safeOwnerPrivateKey = vm.envUint("SAFE_OWNER_PRIVATE_KEY");
        cfg.safeOwnerAddress = vm.envAddress("SAFE_OWNER_ADDRESS");
        cfg.safeAddress = vm.envAddress("SAFE_ADDRESS");
        cfg.coldWalletPrivateKey = vm.envUint("COLD_WALLET_PRIVATE_KEY");
        cfg.coldWalletAddress = vm.envAddress("COLD_WALLET_ADDRESS");
        cfg.etherscanApiKey = vm.envString("ETHERSCAN_API_KEY");
        cfg.sepoliaCallbackProxy = vm.envAddress("SEPOLIA_CALLBACK_PROXY");
        cfg.lasnaCallbackProxy = vm.envAddress("LASNA_CALLBACK_PROXY");
        cfg.reactiveSystemContract = vm.envAddress("REACTIVE_SYSTEM_CONTRACT");
    }

    function _guardController() internal view returns (address) {
        return vm.envAddress("GUARDIAN_CONTROLLER_ADDRESS");
    }

    function _guardModule() internal view returns (address) {
        return vm.envAddress("GUARDIAN_MODULE_ADDRESS");
    }

    function _listenerAddress() internal view returns (address) {
        return vm.envAddress("GUARDIAN_LISTENER_ADDRESS");
    }

    function _mockTokenAddress() internal view returns (address) {
        return vm.envAddress("MOCK_ERC20_ADDRESS");
    }

    function _badSpenderAddress() internal view returns (address) {
        return vm.envAddress("MOCK_BAD_SPENDER_ADDRESS");
    }

    function _riskEmitterAddress() internal view returns (address) {
        return vm.envAddress("MOCK_RISK_EMITTER_ADDRESS");
    }

    function _approvalAmount() internal view returns (uint256) {
        try vm.envUint("DANGEROUS_APPROVAL_AMOUNT") returns (uint256 amount) {
            return amount;
        } catch {
            return 1_000 ether;
        }
    }

    function _policyLimit() internal view returns (uint256) {
        try vm.envUint("TOKEN_MAX_ALLOWANCE") returns (uint256 amount) {
            return amount;
        } catch {
            return 100 ether;
        }
    }

    function _executeSafeTx(
        EnvConfig memory cfg,
        address to,
        uint256 value,
        bytes memory data,
        ISafeMinimal.Operation operation
    ) internal returns (bool success) {
        ISafeScriptMinimal safe = ISafeScriptMinimal(cfg.safeAddress);
        uint256 nonce = safe.nonce();
        bytes32 txHash =
            safe.getTransactionHash(to, value, data, uint8(operation), 0, 0, 0, ZERO_ADDRESS, ZERO_ADDRESS, nonce);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(cfg.safeOwnerPrivateKey, txHash);
        bytes memory signatures = abi.encodePacked(r, s, v);

        vm.startBroadcast(cfg.safeOwnerPrivateKey);
        success =
            safe.execTransaction(to, value, data, uint8(operation), 0, 0, 0, ZERO_ADDRESS, ZERO_ADDRESS, signatures);
        vm.stopBroadcast();
    }

    function _logDeploymentSummary(
        GuardianController controller,
        GuardianModule module,
        MockERC20 token,
        MockBadSpender badSpender,
        MockRiskEmitter riskEmitter
    ) internal view {
        console2.log("GuardianController", address(controller));
        console2.log("GuardianModule", address(module));
        console2.log("MockERC20", address(token));
        console2.log("MockBadSpender", address(badSpender));
        console2.log("MockRiskEmitter", address(riskEmitter));
    }

    function _logListenerSummary(GuardianListener listener) internal view {
        console2.log("GuardianListener", address(listener));
    }
}
