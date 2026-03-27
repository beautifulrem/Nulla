// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {GuardianController} from "../src/GuardianController.sol";
import {GuardianModule} from "../src/GuardianModule.sol";
import {MockBadSpender} from "../src/mocks/MockBadSpender.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockRiskEmitter} from "../src/mocks/MockRiskEmitter.sol";
import {GuardianScriptBase} from "./GuardianScriptBase.s.sol";

contract DeploySepoliaScript is GuardianScriptBase {
    function run()
        external
        returns (
            GuardianController controller,
            GuardianModule module,
            MockERC20 token,
            MockBadSpender badSpender,
            MockRiskEmitter riskEmitter
        )
    {
        EnvConfig memory cfg = _loadEnv();
        vm.createSelectFork(cfg.sepoliaRpcUrl);

        vm.startBroadcast(cfg.deployerPrivateKey);
        controller = new GuardianController();
        token = new MockERC20("Guardian Demo Token", "GDT");
        badSpender = new MockBadSpender();
        riskEmitter = new MockRiskEmitter();
        module = new GuardianModule(cfg.safeAddress, address(controller), cfg.coldWalletAddress);
        vm.stopBroadcast();

        _logDeploymentSummary(controller, module, token, badSpender, riskEmitter);
    }
}
