// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {AbstractReactive} from "reactive-lib/abstract-base/AbstractReactive.sol";
import {IReactive} from "reactive-lib/interfaces/IReactive.sol";
import {PendingShield, PolicyConfig} from "./NullaTypes.sol";

contract ReactiveCrossChainFirewall is AbstractReactive, Ownable {
    error InvalidConfiguration();
    error UnauthorizedReactiveCaller(address caller);
    error CallbackOnly();
    error WrongRvmId(address evmId);

    event RiskDetected(
        bytes32 indexed alertId,
        uint256 indexed originChainId,
        address indexed token,
        address spender,
        uint256 amount,
        uint8 reasonMask,
        uint8 riskScore
    );

    uint8 public constant REASON_UNKNOWN_SPENDER = 1;
    uint8 public constant REASON_BLACKLISTED_SPENDER = 2;
    uint8 public constant REASON_OVER_LIMIT = 4;

    uint256 public constant SUBSCRIBE_TOPIC_0 = uint256(keccak256("Subscribe(address)"));
    uint256 public constant UNSUBSCRIBE_TOPIC_0 = uint256(keccak256("Unsubscribe(address)"));

    struct ChainConfig {
        address serviceConfig;
        address token;
        address module;
        address guard;
        uint256 unknownSpenderCap;
        bool exists;
    }

    address public immutable safeAddress;
    uint256 public immutable reactiveChainId;
    uint256 public immutable chainIdA;
    uint256 public immutable chainIdB;
    uint256 public immutable callbackGasLimit;
    uint256 public immutable approvalTopic0;
    uint256 public immutable cronTopic0;
    uint256 public immutable cronTickDivisor;
    uint64 public immutable shieldDurationTicks;

    mapping(uint256 => ChainConfig) private chainConfigs;
    mapping(uint256 => mapping(address => PolicyConfig)) private policies;
    mapping(bytes32 => PendingShield) private pendingShields;
    mapping(bytes32 => uint256) private pendingShieldIndexPlusOne;
    bytes32[] private pendingShieldIds;
    bool public controlSubscriptionsConfigured;
    bool public cronSubscriptionActive;
    uint256 public activePendingShieldCount;

    constructor(
        address initialOwner,
        address safeAddress_,
        uint256 chainIdA_,
        address serviceA_,
        address tokenA,
        address moduleA,
        address guardA,
        uint256 chainIdB_,
        address serviceB_,
        address tokenB,
        address moduleB,
        address guardB,
        uint256 unknownSpenderCap,
        address[] memory allowedSpenders,
        uint256[] memory allowedCaps,
        address[] memory blacklistedSpenders,
        uint256 cronTopic0_,
        uint256 cronTickDivisor_,
        uint64 shieldDurationTicks_,
        uint64 callbackGasLimit_
    ) payable Ownable(initialOwner) {
        if (
            safeAddress_ == address(0) ||
            serviceA_ == address(0) ||
            serviceB_ == address(0) ||
            tokenA == address(0) ||
            tokenB == address(0) ||
            moduleA == address(0) ||
            moduleB == address(0) ||
            guardA == address(0) ||
            guardB == address(0) ||
            chainIdA_ == chainIdB_ ||
            cronTickDivisor_ == 0 ||
            allowedSpenders.length != allowedCaps.length
        ) {
            revert InvalidConfiguration();
        }

        safeAddress = safeAddress_;
        reactiveChainId = block.chainid;
        chainIdA = chainIdA_;
        chainIdB = chainIdB_;
        callbackGasLimit = callbackGasLimit_;
        approvalTopic0 = uint256(keccak256("Approval(address,address,uint256)"));
        cronTopic0 = cronTopic0_;
        cronTickDivisor = cronTickDivisor_;
        shieldDurationTicks = shieldDurationTicks_;

        chainConfigs[chainIdA_] = ChainConfig({
            serviceConfig: serviceA_,
            token: tokenA,
            module: moduleA,
            guard: guardA,
            unknownSpenderCap: unknownSpenderCap,
            exists: true
        });
        chainConfigs[chainIdB_] = ChainConfig({
            serviceConfig: serviceB_,
            token: tokenB,
            module: moduleB,
            guard: guardB,
            unknownSpenderCap: unknownSpenderCap,
            exists: true
        });

        for (uint256 i = 0; i < allowedSpenders.length; ++i) {
            if (allowedSpenders[i] == address(0)) continue;
            policies[chainIdA_][allowedSpenders[i]] =
                PolicyConfig({cap: allowedCaps[i], allowed: true, blacklisted: false});
            policies[chainIdB_][allowedSpenders[i]] =
                PolicyConfig({cap: allowedCaps[i], allowed: true, blacklisted: false});
        }

        for (uint256 i = 0; i < blacklistedSpenders.length; ++i) {
            if (blacklistedSpenders[i] == address(0)) continue;
            policies[chainIdA_][blacklistedSpenders[i]].blacklisted = true;
            policies[chainIdB_][blacklistedSpenders[i]].blacklisted = true;
        }

        if (!vm) {
            _subscribeControl(chainIdA_, serviceA_);
            _subscribeControl(chainIdB_, serviceB_);
            controlSubscriptionsConfigured = true;
        }
    }

    modifier callbackOnly(address evmId) {
        if (msg.sender != address(service)) revert CallbackOnly();
        if (evmId != owner()) revert WrongRvmId(evmId);
        _;
    }

    function configureControlSubscriptions() external rnOnly onlyOwner {
        if (controlSubscriptionsConfigured) return;

        _subscribeControl(chainIdA, chainConfigs[chainIdA].serviceConfig);
        _subscribeControl(chainIdB, chainConfigs[chainIdB].serviceConfig);
        controlSubscriptionsConfigured = true;
    }

    function subscribeSpender(address evmId, uint256 originChainId, address spender) external rnOnly callbackOnly(evmId) {
        service.subscribe(originChainId, address(0), approvalTopic0, REACTIVE_IGNORE, uint256(uint160(spender)), REACTIVE_IGNORE);
    }

    function unsubscribeSpender(address evmId, uint256 originChainId, address spender) external rnOnly callbackOnly(evmId) {
        service.unsubscribe(originChainId, address(0), approvalTopic0, REACTIVE_IGNORE, uint256(uint160(spender)), REACTIVE_IGNORE);
    }

    function enableCronSubscription(address evmId) external rnOnly callbackOnly(evmId) {
        if (cronSubscriptionActive) return;
        service.subscribe(0, address(SERVICE_ADDR), cronTopic0, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        cronSubscriptionActive = true;
    }

    function disableCronSubscription(address evmId) external rnOnly callbackOnly(evmId) {
        if (!cronSubscriptionActive) return;
        service.unsubscribe(0, address(SERVICE_ADDR), cronTopic0, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        cronSubscriptionActive = false;
    }

    function react(IReactive.LogRecord calldata log) external override {
        if (vm) {
            if (msg.sender != owner()) revert UnauthorizedReactiveCaller(msg.sender);
        } else if (msg.sender != address(SERVICE_ADDR)) {
            revert UnauthorizedReactiveCaller(msg.sender);
        }

        if (log.topic_0 == cronTopic0) {
            _handleCron(log);
            return;
        }

        if (log.topic_0 == SUBSCRIBE_TOPIC_0 || log.topic_0 == UNSUBSCRIBE_TOPIC_0) {
            _handleControlEvent(log);
            return;
        }

        ChainConfig memory config = chainConfigs[log.chain_id];
        if (!config.exists || log._contract != config.token || log.topic_0 != approvalTopic0) return;

        address ownerFromLog = address(uint160(log.topic_1));
        if (ownerFromLog != safeAddress) return;

        address spender = address(uint160(log.topic_2));
        uint256 amount = abi.decode(log.data, (uint256));
        (bool matched, uint8 reasonMask, uint8 riskScore) = isHighRisk(log.chain_id, config.token, spender, amount);
        if (!matched) return;

        bytes32 alertId = computeAlertId(log.chain_id, safeAddress, config.token, spender, log.tx_hash, log.log_index);
        emit RiskDetected(alertId, log.chain_id, config.token, spender, amount, reasonMask, riskScore);

        _emitSourceRevoke(log.chain_id, config.module, alertId, config.token, spender, amount, reasonMask, riskScore);

        (uint256 peerChainId, ChainConfig memory peerConfig) = _peerConfig(log.chain_id);
        uint64 untilTick = _currentTick() + shieldDurationTicks;
        _emitPeerShield(peerChainId, peerConfig.module, alertId, log.chain_id, untilTick, riskScore);

        _storePendingShield(
            alertId,
            PendingShield({
            alertId: alertId,
            peerChainId: peerChainId,
            peerModule: peerConfig.module,
            peerGuard: peerConfig.guard,
            untilTick: untilTick,
            active: true
            })
        );
    }

    function computeAlertId(
        uint256 originChainId,
        address safeAddress_,
        address token,
        address spender,
        uint256 txHash,
        uint256 logIndex
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(originChainId, safeAddress_, token, spender, txHash, logIndex));
    }

    function isHighRisk(
        uint256 chainId,
        address,
        address spender,
        uint256 amount
    ) public view returns (bool matched, uint8 reasonMask, uint8 riskScore) {
        if (amount == 0) {
            return (false, 0, 0);
        }

        ChainConfig memory config = chainConfigs[chainId];
        PolicyConfig memory policy = policies[chainId][spender];

        if (policy.blacklisted) {
            reasonMask |= REASON_BLACKLISTED_SPENDER;
            riskScore = 100;
        }

        if (!policy.allowed && amount > config.unknownSpenderCap) {
            reasonMask |= REASON_UNKNOWN_SPENDER;
            if (riskScore < 70) riskScore = 70;
        }

        if (policy.allowed && policy.cap > 0 && amount > policy.cap) {
            reasonMask |= REASON_OVER_LIMIT;
            if (riskScore < 80) riskScore = 80;
        }

        matched = reasonMask != 0;
    }

    function getPolicy(uint256 chainId, address spender) external view returns (PolicyConfig memory) {
        return policies[chainId][spender];
    }

    function getPeerConfig(uint256 chainId)
        external
        view
        returns (address peerModule, address peerGuard, address peerToken, uint256 peerChainId)
    {
        ChainConfig memory peerConfig;
        (peerChainId, peerConfig) = _peerConfig(chainId);
        return (peerConfig.module, peerConfig.guard, peerConfig.token, peerChainId);
    }

    function getPendingShield(bytes32 alertId) external view returns (PendingShield memory) {
        return pendingShields[alertId];
    }

    function _subscribeControl(uint256 chainId, address subscriptionService) internal {
        service.subscribe(chainId, subscriptionService, SUBSCRIBE_TOPIC_0, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        service.subscribe(chainId, subscriptionService, UNSUBSCRIBE_TOPIC_0, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
    }

    function _emitSourceRevoke(
        uint256 sourceChainId,
        address sourceModule,
        bytes32 alertId,
        address token,
        address spender,
        uint256 amount,
        uint8 reasonMask,
        uint8 riskScore
    ) internal {
        emit Callback(
            sourceChainId,
            sourceModule,
            uint64(callbackGasLimit),
            abi.encodeWithSignature(
                "revokeApproval(address,bytes32,address,address,uint256,uint8,uint8)",
                address(0),
                alertId,
                token,
                spender,
                amount,
                reasonMask,
                riskScore
            )
        );
    }

    function _emitPeerShield(
        uint256 peerChainId,
        address peerModule,
        bytes32 alertId,
        uint256 sourceChainId,
        uint64 untilTick,
        uint8 riskScore
    ) internal {
        emit Callback(
            peerChainId,
            peerModule,
            uint64(callbackGasLimit),
            abi.encodeWithSignature(
                "enterShield(address,bytes32,uint256,uint64,uint8)",
                address(0),
                alertId,
                sourceChainId,
                untilTick,
                riskScore
            )
        );
    }

    function _emitPeerShieldExit(uint256 peerChainId, address peerModule, bytes32 alertId) internal {
        emit Callback(
            peerChainId,
            peerModule,
            uint64(callbackGasLimit),
            abi.encodeWithSignature("exitShield(address,bytes32)", address(0), alertId)
        );
    }

    function _handleCron(IReactive.LogRecord calldata) internal {
        uint64 currentTick = _currentTick();
        uint256 i = 0;
        while (i < pendingShieldIds.length) {
            bytes32 alertId = pendingShieldIds[i];
            PendingShield memory pending = pendingShields[alertId];
            if (!pending.active || pending.untilTick > currentTick) {
                unchecked {
                    ++i;
                }
                continue;
            }

            _emitPeerShieldExit(pending.peerChainId, pending.peerModule, alertId);
            _deletePendingShield(alertId);
        }

        if (activePendingShieldCount == 0 && cronSubscriptionActive) {
            cronSubscriptionActive = false;
            emit Callback(
                reactiveChainId,
                address(this),
                uint64(callbackGasLimit),
                abi.encodeWithSignature("disableCronSubscription(address)", address(0))
            );
        }
    }

    function _handleControlEvent(IReactive.LogRecord calldata log) internal {
        address spender = address(uint160(log.topic_1));
        bytes memory payload;
        if (log.topic_0 == SUBSCRIBE_TOPIC_0) {
            payload = abi.encodeWithSignature("subscribeSpender(address,uint256,address)", address(0), log.chain_id, spender);
        } else {
            payload = abi.encodeWithSignature("unsubscribeSpender(address,uint256,address)", address(0), log.chain_id, spender);
        }
        emit Callback(reactiveChainId, address(this), uint64(callbackGasLimit), payload);
    }

    function _currentTick() internal view returns (uint64) {
        return uint64(block.number / cronTickDivisor);
    }

    function _peerConfig(uint256 chainId) internal view returns (uint256 peerChainId, ChainConfig memory config) {
        peerChainId = chainId == chainIdA ? chainIdB : chainIdA;
        config = chainConfigs[peerChainId];
    }

    function _storePendingShield(bytes32 alertId, PendingShield memory pending) internal {
        if (pendingShieldIndexPlusOne[alertId] == 0) {
            pendingShieldIds.push(alertId);
            pendingShieldIndexPlusOne[alertId] = pendingShieldIds.length;
            unchecked {
                ++activePendingShieldCount;
            }
        }

        pendingShields[alertId] = pending;

        if (!cronSubscriptionActive) {
            cronSubscriptionActive = true;
            emit Callback(
                reactiveChainId,
                address(this),
                uint64(callbackGasLimit),
                abi.encodeWithSignature("enableCronSubscription(address)", address(0))
            );
        }
    }

    function _deletePendingShield(bytes32 alertId) internal {
        uint256 indexPlusOne = pendingShieldIndexPlusOne[alertId];
        if (indexPlusOne == 0) return;

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = pendingShieldIds.length - 1;

        if (index != lastIndex) {
            bytes32 lastAlertId = pendingShieldIds[lastIndex];
            pendingShieldIds[index] = lastAlertId;
            pendingShieldIndexPlusOne[lastAlertId] = index + 1;
        }

        pendingShieldIds.pop();
        delete pendingShieldIndexPlusOne[alertId];
        delete pendingShields[alertId];

        unchecked {
            --activePendingShieldCount;
        }
    }
}
