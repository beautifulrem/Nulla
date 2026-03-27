// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AbstractReactive} from "./reactive/AbstractReactive.sol";
import {LogRecord} from "./reactive/ReactiveStructs.sol";

contract GuardianListener is AbstractReactive {
    uint256 public constant REACTIVE_CHAIN_ID = 5_318_007;
    address internal constant RVM_ID_PLACEHOLDER = address(0);
    address public immutable controller;
    address public immutable owner;
    uint256 public immutable safeChainId;
    uint256 public immutable controllerChainId;

    uint64 public constant CALLBACK_GAS_LIMIT = 1_000_000;

    uint256 public constant APPROVAL_TOPIC0 = uint256(keccak256("Approval(address,address,uint256)"));
    uint256 public constant POLICY_REGISTERED_TOPIC0 = uint256(keccak256("PolicyRegistered(address,address,address)"));
    uint256 public constant POLICY_REMOVED_TOPIC0 = uint256(keccak256("PolicyRemoved(address)"));

    modifier callbackOnly(address evmId) {
        require(msg.sender == address(service), "service only");
        require(evmId == owner, "invalid callback owner");
        _;
    }

    constructor(address systemContract_, address controller_, uint256 safeChainId_, uint256 controllerChainId_)
        payable
        AbstractReactive(systemContract_)
    {
        controller = controller_;
        owner = msg.sender;
        safeChainId = safeChainId_;
        controllerChainId = controllerChainId_;

        if (!vm()) {
            service.subscribe(
                controllerChainId_,
                controller_,
                POLICY_REGISTERED_TOPIC0,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
            service.subscribe(
                controllerChainId_,
                controller_,
                POLICY_REMOVED_TOPIC0,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    function subscribeSafe(address rvmId, address safeAddress) external rnOnly callbackOnly(rvmId) {
        _subscribeSafe(safeAddress);
    }

    function unsubscribeSafe(address rvmId, address safeAddress) external rnOnly callbackOnly(rvmId) {
        _unsubscribeSafe(safeAddress);
    }

    function react(LogRecord calldata log) external vmOnly {
        if (log.topic_0 == POLICY_REGISTERED_TOPIC0) {
            emit Callback(
                REACTIVE_CHAIN_ID,
                address(this),
                CALLBACK_GAS_LIMIT,
                _buildSubscribePayload(address(uint160(log.topic_1)))
            );
            return;
        }

        if (log.topic_0 == POLICY_REMOVED_TOPIC0) {
            emit Callback(
                REACTIVE_CHAIN_ID,
                address(this),
                CALLBACK_GAS_LIMIT,
                _buildUnsubscribePayload(address(uint160(log.topic_1)))
            );
            return;
        }

        if (log.topic_0 == APPROVAL_TOPIC0) {
            emit Callback(
                controllerChainId,
                controller,
                CALLBACK_GAS_LIMIT,
                _buildApprovalPayload(
                    address(uint160(log.topic_1)),
                    address(uint160(log.topic_2)),
                    log._contract,
                    abi.decode(log.data, (uint256))
                )
            );
        }
    }

    function _subscribeSafe(address safeAddress) internal {
        service.subscribe(
            safeChainId, address(0), APPROVAL_TOPIC0, uint256(uint160(safeAddress)), REACTIVE_IGNORE, REACTIVE_IGNORE
        );
    }

    function _unsubscribeSafe(address safeAddress) internal {
        service.unsubscribe(
            safeChainId, address(0), APPROVAL_TOPIC0, uint256(uint160(safeAddress)), REACTIVE_IGNORE, REACTIVE_IGNORE
        );
    }

    function _buildSubscribePayload(address safeAddress) internal view returns (bytes memory) {
        return abi.encodeWithSignature("subscribeSafe(address,address)", RVM_ID_PLACEHOLDER, safeAddress);
    }

    function _buildUnsubscribePayload(address safeAddress) internal view returns (bytes memory) {
        return abi.encodeWithSignature("unsubscribeSafe(address,address)", RVM_ID_PLACEHOLDER, safeAddress);
    }

    function _buildApprovalPayload(address safeAddress, address spender, address token, uint256 amount)
        internal
        view
        returns (bytes memory)
    {
        return abi.encodeWithSignature(
            "handleApprovalAlert(address,address,address,address,uint256)",
            RVM_ID_PLACEHOLDER,
            safeAddress,
            spender,
            token,
            amount
        );
    }
}
