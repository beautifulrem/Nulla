// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20Minimal} from "./interfaces/IERC20Minimal.sol";
import {ISafeMinimal} from "./interfaces/ISafeMinimal.sol";

contract GuardianModule {
    ISafeMinimal public immutable safe;
    address public immutable controller;
    address public immutable coldSafe;

    mapping(address => bool) public protectedToken;

    event ProtectedTokenSynced(address indexed token, bool enabled);
    event ERC20Revoked(address indexed safe, address indexed token, address indexed spender);
    event ERC20Swept(address indexed safe, address indexed token, uint256 amount, address indexed coldSafe);

    modifier onlyController() {
        require(msg.sender == controller, "controller only");
        _;
    }

    constructor(address safe_, address controller_, address coldSafe_) {
        require(safe_ != address(0) && controller_ != address(0) && coldSafe_ != address(0), "zero address");
        safe = ISafeMinimal(safe_);
        controller = controller_;
        coldSafe = coldSafe_;
    }

    function syncProtectedToken(address token, bool enabled) external onlyController {
        protectedToken[token] = enabled;
        emit ProtectedTokenSynced(token, enabled);
    }

    function revokeERC20(address token, address spender) external onlyController returns (bool ok) {
        require(protectedToken[token], "token not protected");

        bytes memory data = abi.encodeWithSelector(IERC20Minimal.approve.selector, spender, 0);
        ok = safe.execTransactionFromModule(token, 0, data, ISafeMinimal.Operation.Call);
        require(ok, "revoke failed");

        emit ERC20Revoked(address(safe), token, spender);
    }

    function sweepERC20(address token) external onlyController returns (bool ok) {
        require(protectedToken[token], "token not protected");

        uint256 bal = IERC20Minimal(token).balanceOf(address(safe));
        require(bal > 0, "nothing to sweep");

        bytes memory data = abi.encodeWithSelector(IERC20Minimal.transfer.selector, coldSafe, bal);
        ok = safe.execTransactionFromModule(token, 0, data, ISafeMinimal.Operation.Call);
        require(ok, "sweep failed");

        emit ERC20Swept(address(safe), token, bal, coldSafe);
    }
}
