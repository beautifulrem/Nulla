// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";

import {GuardianListenerHarness} from "../helpers/GuardianListenerHarness.sol";
import {LogRecord} from "../../src/reactive/ReactiveStructs.sol";
import {MockReactiveService} from "../helpers/MockReactiveService.sol";

contract GuardianListenerTest is Test {
    uint256 internal constant REACTIVE_CHAIN_ID = 5_318_007;
    address internal constant REACTIVE_SYSTEM_CONTRACT = 0x0000000000000000000000000000000000fffFfF;
    uint256 internal constant REACTIVE_IGNORE = 0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad;

    GuardianListenerHarness internal listener;
    MockReactiveService internal service;

    address internal controller = address(0xCAFE);
    address internal safeAddress = address(0xAAAA);
    address internal spender = address(0xBBBB);
    address internal token = address(0xCCCC);

    function setUp() public {
        MockReactiveService template = new MockReactiveService();
        vm.etch(REACTIVE_SYSTEM_CONTRACT, address(template).code);
        service = MockReactiveService(REACTIVE_SYSTEM_CONTRACT);
        listener = new GuardianListenerHarness(REACTIVE_SYSTEM_CONTRACT, controller, 11155111, 11155111);
    }

    function test_ConstructorSetsOwnerAndChainConfig() public view {
        assertEq(listener.owner(), address(this));
        assertEq(listener.controller(), controller);
        assertEq(listener.safeChainId(), 11155111);
        assertEq(listener.controllerChainId(), 11155111);
        assertFalse(listener.vm());
    }

    function test_ConstructorRegistersPolicySubscriptions() public {
        assertEq(service.recordsLength(), 2);

        (bool subscribeCall0, uint256 chainId0, address contractAddress0, uint256 topic00,,,) = service.records(0);
        assertTrue(subscribeCall0);
        assertEq(chainId0, 11155111);
        assertEq(contractAddress0, controller);
        assertEq(topic00, listener.POLICY_REGISTERED_TOPIC0());

        (bool subscribeCall1, uint256 chainId1, address contractAddress1, uint256 topic01,,,) = service.records(1);
        assertTrue(subscribeCall1);
        assertEq(chainId1, 11155111);
        assertEq(contractAddress1, controller);
        assertEq(topic01, listener.POLICY_REMOVED_TOPIC0());
    }

    function test_SubscribeSafeUsesOwnerTopicFilter() public {
        vm.prank(REACTIVE_SYSTEM_CONTRACT);
        listener.subscribeSafe(address(this), safeAddress);

        assertEq(service.recordsLength(), 3);
        (, uint256 chainId, address contractAddress, uint256 topic0, uint256 topic1, uint256 topic2, uint256 topic3) =
            service.records(2);
        assertEq(chainId, 11155111);
        assertEq(contractAddress, address(0));
        assertEq(topic0, listener.APPROVAL_TOPIC0());
        assertEq(topic1, uint256(uint160(safeAddress)));
        assertEq(topic2, REACTIVE_IGNORE);
        assertEq(topic3, REACTIVE_IGNORE);
    }

    function test_SubscribeSafeRejectsUnexpectedCallbackSender() public {
        vm.expectRevert("service only");
        listener.subscribeSafe(address(this), safeAddress);
    }

    function test_SubscribeSafeRejectsVmMode() public {
        vm.etch(REACTIVE_SYSTEM_CONTRACT, bytes(""));
        vm.prank(REACTIVE_SYSTEM_CONTRACT);
        vm.expectRevert("reactive network only");
        listener.subscribeSafe(address(this), safeAddress);
    }

    function test_SubscribeSafeRejectsUnexpectedCallbackOwner() public {
        vm.prank(REACTIVE_SYSTEM_CONTRACT);
        vm.expectRevert("invalid callback owner");
        listener.subscribeSafe(address(0x1234), safeAddress);
    }

    function test_BuildSubscribePayloadUsesReactivePlaceholder() public view {
        bytes memory payload = listener.exposedBuildSubscribePayload(safeAddress);

        bytes4 selector;
        assembly {
            selector := mload(add(payload, 32))
        }

        (address rvmId, address decodedSafe) = abi.decode(_payloadArguments(payload), (address, address));

        assertEq(selector, bytes4(keccak256("subscribeSafe(address,address)")));
        assertEq(rvmId, address(0));
        assertEq(decodedSafe, safeAddress);
    }

    function test_BuildUnsubscribePayloadUsesReactivePlaceholder() public view {
        bytes memory payload = listener.exposedBuildUnsubscribePayload(safeAddress);

        bytes4 selector;
        assembly {
            selector := mload(add(payload, 32))
        }

        (address rvmId, address decodedSafe) = abi.decode(_payloadArguments(payload), (address, address));

        assertEq(selector, bytes4(keccak256("unsubscribeSafe(address,address)")));
        assertEq(rvmId, address(0));
        assertEq(decodedSafe, safeAddress);
    }

    function test_UnsubscribeSafeUsesOwnerTopicFilter() public {
        vm.prank(REACTIVE_SYSTEM_CONTRACT);
        listener.unsubscribeSafe(address(this), safeAddress);

        assertEq(service.recordsLength(), 3);
        (bool subscribeCall,,,,,,) = service.records(2);
        assertFalse(subscribeCall);
    }

    function test_BuildApprovalPayloadUsesReactivePlaceholderAndSelector() public view {
        bytes memory payload = listener.exposedBuildApprovalPayload(safeAddress, spender, token, 123);

        bytes4 selector;
        assembly {
            selector := mload(add(payload, 32))
        }

        (address rvmId, address decodedSafe, address decodedSpender, address decodedToken, uint256 amount) =
            abi.decode(_payloadArguments(payload), (address, address, address, address, uint256));

        assertEq(selector, bytes4(keccak256("handleApprovalAlert(address,address,address,address,uint256)")));
        assertEq(rvmId, address(0));
        assertEq(decodedSafe, safeAddress);
        assertEq(decodedSpender, spender);
        assertEq(decodedToken, token);
        assertEq(amount, 123);
    }

    function testFuzz_BuildApprovalPayloadRoundTrips(
        address fuzzSafe,
        address fuzzSpender,
        address fuzzToken,
        uint96 fuzzAmount
    ) public view {
        bytes memory payload = listener.exposedBuildApprovalPayload(
            fuzzSafe, fuzzSpender, fuzzToken, uint256(fuzzAmount)
        );

        bytes4 selector;
        assembly {
            selector := mload(add(payload, 32))
        }

        (address rvmId, address decodedSafe, address decodedSpender, address decodedToken, uint256 amount) =
            abi.decode(_payloadArguments(payload), (address, address, address, address, uint256));

        assertEq(selector, bytes4(keccak256("handleApprovalAlert(address,address,address,address,uint256)")));
        assertEq(rvmId, address(0));
        assertEq(decodedSafe, fuzzSafe);
        assertEq(decodedSpender, fuzzSpender);
        assertEq(decodedToken, fuzzToken);
        assertEq(amount, uint256(fuzzAmount));
    }

    function test_ReactPolicyRegisteredEmitsSubscribeCallback() public {
        LogRecord memory log = LogRecord({
            chain_id: 11155111,
            _contract: controller,
            topic_0: listener.POLICY_REGISTERED_TOPIC0(),
            topic_1: uint256(uint160(safeAddress)),
            topic_2: 0,
            topic_3: 0,
            data: "",
            block_number: 0,
            op_code: 0,
            block_hash: 0,
            tx_hash: 0,
            log_index: 0
        });

        vm.etch(REACTIVE_SYSTEM_CONTRACT, bytes(""));
        assertTrue(listener.vm());

        (uint256 chainId, address target, uint64 gasLimit, bytes memory payload) = _recordCallback(listener, log);
        assertEq(chainId, REACTIVE_CHAIN_ID);
        assertEq(target, address(listener));
        assertEq(gasLimit, listener.CALLBACK_GAS_LIMIT());
        assertEq(payload, listener.exposedBuildSubscribePayload(safeAddress));
    }

    function test_ReactPolicyRemovedEmitsUnsubscribeCallback() public {
        LogRecord memory log = LogRecord({
            chain_id: 11155111,
            _contract: controller,
            topic_0: listener.POLICY_REMOVED_TOPIC0(),
            topic_1: uint256(uint160(safeAddress)),
            topic_2: 0,
            topic_3: 0,
            data: "",
            block_number: 0,
            op_code: 0,
            block_hash: 0,
            tx_hash: 0,
            log_index: 0
        });

        vm.etch(REACTIVE_SYSTEM_CONTRACT, bytes(""));
        assertTrue(listener.vm());

        (uint256 chainId, address target, uint64 gasLimit, bytes memory payload) = _recordCallback(listener, log);
        assertEq(chainId, REACTIVE_CHAIN_ID);
        assertEq(target, address(listener));
        assertEq(gasLimit, listener.CALLBACK_GAS_LIMIT());
        assertEq(payload, listener.exposedBuildUnsubscribePayload(safeAddress));
    }

    function test_ReactApprovalEmitsControllerCallback() public {
        LogRecord memory log = LogRecord({
            chain_id: 11155111,
            _contract: token,
            topic_0: listener.APPROVAL_TOPIC0(),
            topic_1: uint256(uint160(safeAddress)),
            topic_2: uint256(uint160(spender)),
            topic_3: 0,
            data: abi.encode(uint256(123)),
            block_number: 0,
            op_code: 0,
            block_hash: 0,
            tx_hash: 0,
            log_index: 0
        });

        vm.etch(REACTIVE_SYSTEM_CONTRACT, bytes(""));
        assertTrue(listener.vm());

        (uint256 chainId, address target, uint64 gasLimit, bytes memory payload) = _recordCallback(listener, log);
        assertEq(chainId, 11155111);
        assertEq(target, controller);
        assertEq(gasLimit, listener.CALLBACK_GAS_LIMIT());
        assertEq(payload, listener.exposedBuildApprovalPayload(safeAddress, spender, token, 123));
    }

    function test_ReactRejectsReactiveNetworkMode() public {
        LogRecord memory log = LogRecord({
            chain_id: 11155111,
            _contract: token,
            topic_0: listener.APPROVAL_TOPIC0(),
            topic_1: uint256(uint160(safeAddress)),
            topic_2: uint256(uint160(spender)),
            topic_3: 0,
            data: abi.encode(uint256(123)),
            block_number: 0,
            op_code: 0,
            block_hash: 0,
            tx_hash: 0,
            log_index: 0
        });

        vm.expectRevert("react vm only");
        listener.react(log);
    }

    function test_ReactUnknownTopicEmitsNoCallback() public {
        LogRecord memory log = LogRecord({
            chain_id: 11155111,
            _contract: token,
            topic_0: uint256(keccak256("Unknown(address)")),
            topic_1: 0,
            topic_2: 0,
            topic_3: 0,
            data: "",
            block_number: 0,
            op_code: 0,
            block_hash: 0,
            tx_hash: 0,
            log_index: 0
        });

        vm.etch(REACTIVE_SYSTEM_CONTRACT, bytes(""));
        assertTrue(listener.vm());

        vm.recordLogs();
        listener.react(log);
        assertEq(vm.getRecordedLogs().length, 0);
    }

    function _recordCallback(GuardianListenerHarness targetListener, LogRecord memory log)
        internal
        returns (uint256 chainId, address target, uint64 gasLimit, bytes memory payload)
    {
        vm.recordLogs();
        targetListener.react(log);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        Vm.Log memory callbackLog = logs[0];
        chainId = uint256(callbackLog.topics[1]);
        target = address(uint160(uint256(callbackLog.topics[2])));
        gasLimit = uint64(uint256(callbackLog.topics[3]));
        payload = abi.decode(callbackLog.data, (bytes));
    }

    function _payloadArguments(bytes memory payload) internal pure returns (bytes memory args) {
        args = new bytes(payload.length - 4);
        for (uint256 i = 0; i < args.length; i++) {
            args[i] = payload[i + 4];
        }
    }
}
