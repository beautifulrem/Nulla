// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {stdJson} from "forge-std/StdJson.sol";

contract ExportDeploymentManifest is Script {
    using stdJson for string;
    address internal constant ZERO_ADDRESS = address(0);

    function run() external {
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/deployments/nulla-demo.json");
        string memory jsonKey = "nulla";

        jsonKey.serialize("registry", vm.envOr("NULLA_REGISTRY_ADDRESS", ZERO_ADDRESS));
        jsonKey.serialize("ethToken", vm.envOr("ETH_TOKEN_ADDRESS", ZERO_ADDRESS));
        jsonKey.serialize("baseToken", vm.envOr("BASE_TOKEN_ADDRESS", ZERO_ADDRESS));
        jsonKey.serialize("ethModule", vm.envOr("ETH_MODULE_ADDRESS", ZERO_ADDRESS));
        jsonKey.serialize("baseModule", vm.envOr("BASE_MODULE_ADDRESS", ZERO_ADDRESS));
        jsonKey.serialize("ethGuard", vm.envOr("ETH_GUARD_ADDRESS", ZERO_ADDRESS));
        jsonKey.serialize("baseGuard", vm.envOr("BASE_GUARD_ADDRESS", ZERO_ADDRESS));
        jsonKey.serialize("reactiveLasna", vm.envOr("REACTIVE_LASNA_ADDRESS", ZERO_ADDRESS));
        jsonKey.write(path);
    }
}
