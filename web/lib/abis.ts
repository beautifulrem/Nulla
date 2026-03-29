import { keccak256, parseAbi, stringToHex } from "viem";

export const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
]);

export const nullaRegistryAbi = [
  {
    type: "function",
    name: "registerProfile",
    stateMutability: "nonpayable",
    inputs: [
      { name: "profileId", type: "bytes32" },
      {
        name: "profile",
        type: "tuple",
        components: [
          { name: "safeAddress", type: "address" },
          { name: "owner", type: "address" },
          { name: "moduleEth", type: "address" },
          { name: "moduleBase", type: "address" },
          { name: "guardEth", type: "address" },
          { name: "guardBase", type: "address" },
          { name: "reactiveLasna", type: "address" },
          { name: "policyHash", type: "bytes32" },
          { name: "status", type: "uint8" }
        ]
      }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "updateProfileStatus",
    stateMutability: "nonpayable",
    inputs: [
      { name: "profileId", type: "bytes32" },
      { name: "status", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getProfile",
    stateMutability: "view",
    inputs: [{ name: "profileId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "safeAddress", type: "address" },
          { name: "owner", type: "address" },
          { name: "moduleEth", type: "address" },
          { name: "moduleBase", type: "address" },
          { name: "guardEth", type: "address" },
          { name: "guardBase", type: "address" },
          { name: "reactiveLasna", type: "address" },
          { name: "policyHash", type: "bytes32" },
          { name: "status", type: "uint8" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getProfileBySafe",
    stateMutability: "view",
    inputs: [{ name: "safeAddress", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "safeAddress", type: "address" },
          { name: "owner", type: "address" },
          { name: "moduleEth", type: "address" },
          { name: "moduleBase", type: "address" },
          { name: "guardEth", type: "address" },
          { name: "guardBase", type: "address" },
          { name: "reactiveLasna", type: "address" },
          { name: "policyHash", type: "bytes32" },
          { name: "status", type: "uint8" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getProfileIdBySafe",
    stateMutability: "view",
    inputs: [{ name: "safeAddress", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    name: "isProfileActive",
    stateMutability: "view",
    inputs: [{ name: "profileId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "event",
    name: "ProfileRegistered",
    anonymous: false,
    inputs: [
      { indexed: true, name: "profileId", type: "bytes32" },
      { indexed: true, name: "safeAddress", type: "address" },
      { indexed: true, name: "owner", type: "address" }
    ]
  },
  {
    type: "event",
    name: "ProfileStatusUpdated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "profileId", type: "bytes32" },
      { indexed: false, name: "status", type: "uint8" }
    ]
  }
] as const;

export const approvalFirewallModuleAbi = [
  {
    type: "function",
    name: "setAllowedRvmId",
    stateMutability: "nonpayable",
    inputs: [{ name: "newAllowedRvmId", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "revokeApproval",
    stateMutability: "nonpayable",
    inputs: [
      { name: "rvmId", type: "address" },
      { name: "alertId", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "reasonMask", type: "uint8" },
      { name: "riskScore", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "enterShield",
    stateMutability: "nonpayable",
    inputs: [
      { name: "rvmId", type: "address" },
      { name: "alertId", type: "bytes32" },
      { name: "sourceChainId", type: "uint256" },
      { name: "untilTick", type: "uint64" },
      { name: "riskScore", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "exitShield",
    stateMutability: "nonpayable",
    inputs: [
      { name: "rvmId", type: "address" },
      { name: "alertId", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getAlert",
    stateMutability: "view",
    inputs: [{ name: "alertId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "bytes32" },
          { name: "sourceChainId", type: "uint256" },
          { name: "safeAddress", type: "address" },
          { name: "token", type: "address" },
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "reasonMask", type: "uint8" },
          { name: "riskScore", type: "uint8" },
          { name: "createdTick", type: "uint64" },
          { name: "shieldUntilTick", type: "uint64" },
          { name: "sourceRevoked", type: "bool" },
          { name: "peerShielded", type: "bool" },
          { name: "resolved", type: "bool" }
        ]
      }
    ]
  },
  {
    type: "event",
    name: "ApprovalRevoked",
    anonymous: false,
    inputs: [
      { indexed: true, name: "alertId", type: "bytes32" },
      { indexed: true, name: "token", type: "address" },
      { indexed: true, name: "spender", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "ShieldEntered",
    anonymous: false,
    inputs: [
      { indexed: true, name: "alertId", type: "bytes32" },
      { indexed: true, name: "sourceChainId", type: "uint256" },
      { indexed: false, name: "untilTick", type: "uint64" },
      { indexed: false, name: "riskScore", type: "uint8" }
    ]
  },
  {
    type: "event",
    name: "ShieldExited",
    anonymous: false,
    inputs: [{ indexed: true, name: "alertId", type: "bytes32" }]
  }
] as const;

export const shieldGuardAbi = [
  {
    type: "function",
    name: "setModule",
    stateMutability: "nonpayable",
    inputs: [{ name: "newModule", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "setWatchedToken",
    stateMutability: "nonpayable",
    inputs: [{ name: "newToken", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "setPolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "allowed", type: "bool" },
      { name: "blacklisted", type: "bool" },
      { name: "cap", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getPolicy",
    stateMutability: "view",
    inputs: [{ name: "spender", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "cap", type: "uint256" },
          { name: "allowed", type: "bool" },
          { name: "blacklisted", type: "bool" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "enterShieldFromModule",
    stateMutability: "nonpayable",
    inputs: [
      { name: "alertId", type: "bytes32" },
      { name: "sourceChainId", type: "uint256" },
      { name: "untilTick", type: "uint64" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "exitShieldFromModule",
    stateMutability: "nonpayable",
    inputs: [{ name: "alertId", type: "bytes32" }],
    outputs: []
  },
  {
    type: "function",
    name: "mode",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  },
  {
    type: "function",
    name: "shieldUntilTick",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }]
  },
  {
    type: "function",
    name: "isApprovalAllowed",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "event",
    name: "ModuleSet",
    anonymous: false,
    inputs: [{ indexed: true, name: "module", type: "address" }]
  },
  {
    type: "event",
    name: "PolicyUpdated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "spender", type: "address" },
      { indexed: false, name: "allowed", type: "bool" },
      { indexed: false, name: "blacklisted", type: "bool" },
      { indexed: false, name: "cap", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "WatchedTokenUpdated",
    anonymous: false,
    inputs: [{ indexed: true, name: "token", type: "address" }]
  },
  {
    type: "event",
    name: "ShieldEntered",
    anonymous: false,
    inputs: [
      { indexed: true, name: "alertId", type: "bytes32" },
      { indexed: true, name: "sourceChainId", type: "uint256" },
      { indexed: false, name: "untilTick", type: "uint64" }
    ]
  },
  {
    type: "event",
    name: "ShieldExited",
    anonymous: false,
    inputs: [{ indexed: true, name: "alertId", type: "bytes32" }]
  }
] as const;

export const reactiveCrossChainFirewallAbi = [
  {
    type: "function",
    name: "react",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "log",
        type: "tuple",
        components: [
          { name: "chain_id", type: "uint256" },
          { name: "_contract", type: "address" },
          { name: "topic_0", type: "uint256" },
          { name: "topic_1", type: "uint256" },
          { name: "topic_2", type: "uint256" },
          { name: "topic_3", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "block_number", type: "uint256" },
          { name: "op_code", type: "uint256" },
          { name: "block_hash", type: "uint256" },
          { name: "tx_hash", type: "uint256" },
          { name: "log_index", type: "uint256" }
        ]
      }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "computeAlertId",
    stateMutability: "pure",
    inputs: [
      { name: "originChainId", type: "uint256" },
      { name: "safeAddress", type: "address" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
      { name: "txHash", type: "uint256" },
      { name: "logIndex", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    name: "isHighRisk",
    stateMutability: "view",
    inputs: [
      { name: "chainId", type: "uint256" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [
      { name: "matched", type: "bool" },
      { name: "reasonMask", type: "uint8" },
      { name: "riskScore", type: "uint8" }
    ]
  },
  {
    type: "function",
    name: "getPeerConfig",
    stateMutability: "view",
    inputs: [{ name: "chainId", type: "uint256" }],
    outputs: [
      { name: "peerModule", type: "address" },
      { name: "peerGuard", type: "address" },
      { name: "peerToken", type: "address" },
      { name: "peerChainId", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getPendingShield",
    stateMutability: "view",
    inputs: [{ name: "alertId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "alertId", type: "bytes32" },
          { name: "peerChainId", type: "uint256" },
          { name: "peerModule", type: "address" },
          { name: "peerGuard", type: "address" },
          { name: "untilTick", type: "uint64" },
          { name: "active", type: "bool" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "cronTickDivisor",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "shieldDurationTicks",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }]
  },
  {
    type: "function",
    name: "activePendingShieldCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "event",
    name: "RiskDetected",
    anonymous: false,
    inputs: [
      { indexed: true, name: "alertId", type: "bytes32" },
      { indexed: true, name: "originChainId", type: "uint256" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "spender", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "reasonMask", type: "uint8" },
      { indexed: false, name: "riskScore", type: "uint8" }
    ]
  }
] as const;

export const safeAbi = parseAbi([
  "function enableModule(address module)",
  "function setGuard(address guard)",
  "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address payable refundReceiver, bytes signatures) payable returns (bool success)",
  "function execTransactionFromModule(address to, uint256 value, bytes data, uint8 operation) returns (bool success)",
  "function execTransactionFromModuleReturnData(address to, uint256 value, bytes data, uint8 operation) returns (bool success, bytes returnData)",
  "function isModuleEnabled(address module) view returns (bool)",
  "function getModulesPaginated(address start, uint256 pageSize) view returns (address[] array, address next)",
  "function guard() view returns (address)"
]);

export const approvalEventSignature = "Approval(address,address,uint256)" as const;
export const approvalTopic0 = keccak256(stringToHex(approvalEventSignature));
export const cron10EventSignature = "Cron10(uint256)" as const;
export const cron10Topic0 = keccak256(stringToHex(cron10EventSignature));
