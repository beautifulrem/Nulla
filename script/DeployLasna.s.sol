// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {GuardianListener} from "../src/GuardianListener.sol";
import {GuardianScriptBase} from "./GuardianScriptBase.s.sol";

contract DeployLasnaScript is GuardianScriptBase {
    function run() external returns (GuardianListener listener) {
        EnvConfig memory cfg = _loadEnv();
        vm.createSelectFork(cfg.reactiveRpcUrl);

        vm.startBroadcast(cfg.deployerPrivateKey);
        listener = new GuardianListener(
            cfg.reactiveSystemContract, _guardController(), cfg.sepoliaChainId, cfg.sepoliaChainId
        );
        vm.stopBroadcast();

        _logListenerSummary(listener);
    }
}
