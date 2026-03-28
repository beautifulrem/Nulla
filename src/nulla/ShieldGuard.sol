// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {BaseTransactionGuard} from "safe-smart-account/contracts/base/GuardManager.sol";
import {Enum} from "safe-smart-account/contracts/libraries/Enum.sol";
import {GuardMode, PolicyConfig} from "./NullaTypes.sol";

contract ShieldGuard is BaseTransactionGuard, Ownable {
    error ModuleNotSet();
    error UnauthorizedCaller();
    error BlacklistedSpender(address spender);
    error UnknownSpender(address spender);
    error ApprovalCapExceeded(address spender, uint256 amount, uint256 cap);

    event ModuleSet(address indexed module);
    event PolicyUpdated(address indexed spender, bool allowed, bool blacklisted, uint256 cap);
    event WatchedTokenUpdated(address indexed token);
    event ShieldEntered(bytes32 indexed alertId, uint256 indexed sourceChainId, uint64 untilTick);
    event ShieldExited(bytes32 indexed alertId);

    address public module;
    address public immutable safeAddress;
    address public watchedToken;
    GuardMode public mode;
    uint64 public shieldUntilTick;

    mapping(address => PolicyConfig) private policies;

    constructor(address initialOwner, address safeAddress_, address watchedToken_) Ownable(initialOwner) {
        safeAddress = safeAddress_;
        watchedToken = watchedToken_;
    }

    modifier onlyModuleOrOwner() {
        if (msg.sender != module && msg.sender != owner()) {
            revert UnauthorizedCaller();
        }
        _;
    }

    function setModule(address newModule) external onlyOwner {
        module = newModule;
        emit ModuleSet(newModule);
    }

    function setWatchedToken(address newToken) external onlyOwner {
        watchedToken = newToken;
        emit WatchedTokenUpdated(newToken);
    }

    function setPolicy(address spender, bool allowed, bool blacklisted, uint256 cap) external onlyOwner {
        policies[spender] = PolicyConfig({cap: cap, allowed: allowed, blacklisted: blacklisted});
        emit PolicyUpdated(spender, allowed, blacklisted, cap);
    }

    function getPolicy(address spender) external view returns (PolicyConfig memory) {
        return policies[spender];
    }

    function enterShieldFromModule(bytes32 alertId, uint256 sourceChainId, uint64 untilTick) external onlyModuleOrOwner {
        if (module == address(0)) {
            revert ModuleNotSet();
        }

        mode = GuardMode.Shield;
        shieldUntilTick = untilTick;
        emit ShieldEntered(alertId, sourceChainId, untilTick);
    }

    function exitShieldFromModule(bytes32 alertId) external onlyModuleOrOwner {
        if (module == address(0)) {
            revert ModuleNotSet();
        }

        mode = GuardMode.Monitor;
        shieldUntilTick = 0;
        emit ShieldExited(alertId);
    }

    function isApprovalAllowed(address token, address spender, uint256 amount) public view returns (bool) {
        if (token != watchedToken) {
            return true;
        }

        if (amount == 0) {
            return true;
        }

        PolicyConfig memory policy = policies[spender];
        if (policy.blacklisted) {
            return false;
        }

        if (!policy.allowed) {
            return false;
        }

        return amount <= policy.cap;
    }

    function checkTransaction(
        address to,
        uint256,
        bytes memory data,
        Enum.Operation operation,
        uint256,
        uint256,
        uint256,
        address,
        address payable,
        bytes memory,
        address
    ) external view override {
        if (mode != GuardMode.Shield || operation != Enum.Operation.Call || to != watchedToken || data.length < 68) {
            return;
        }

        bytes4 selector;
        assembly {
            selector := mload(add(data, 32))
        }

        if (selector != IERC20.approve.selector) {
            return;
        }

        (address spender, uint256 amount) = _decodeApprove(data);
        if (amount == 0) {
            return;
        }

        PolicyConfig memory policy = policies[spender];
        if (policy.blacklisted) {
            revert BlacklistedSpender(spender);
        }

        if (!policy.allowed) {
            revert UnknownSpender(spender);
        }

        if (amount > policy.cap) {
            revert ApprovalCapExceeded(spender, amount, policy.cap);
        }
    }

    function checkAfterExecution(bytes32, bool) external pure override {}

    function _decodeApprove(bytes memory data) internal pure returns (address spender, uint256 amount) {
        bytes memory params = new bytes(data.length - 4);
        for (uint256 i = 4; i < data.length; ++i) {
            params[i - 4] = data[i];
        }
        (spender, amount) = abi.decode(params, (address, uint256));
    }
}
