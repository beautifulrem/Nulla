# Nulla Deployed Addresses

## Core Identities

- `0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0`
  - Contract: `Safe`
  - Role: multi-chain same-address Safe on Ethereum Sepolia and Base Sepolia
  - Demo use: all risky approvals are sent from this Safe

- `0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4`
  - Role: Safe owner, current mainline RC deployer, current RVM owner
  - Demo use: owns the Safe, owns the business-chain contracts, deploys the active Lasna RC

- `0x301E4F2bA24b4C009BfDCc5F7F192f6A0f9C8e8d`
  - Role: blacklisted / risky spender used in the demo
  - Demo use: all approval-firewall detections are triggered against this spender

## Ethereum Sepolia

- `0x0f5D9349D974f47fDfcCc358bA1331be9bf63adA`
  - Contract: `MockUSDC`
  - Role: demo ERC20 token
  - Demo use: used to trigger risky `Approval` events from the Safe on Ethereum Sepolia

- `0x384f950fBfaB4F13f0C1Cb62F2054Ac860b067A6`
  - Contract: `NullaSubscriptionService`
  - Role: emits `Subscribe(address)` / `Unsubscribe(address)` control events
  - Demo use: Reactive RC listens to this contract to dynamically add/remove ETH approval subscriptions for the risky spender

- `0x05857fB0fa1A618D22C31840C30a9c8c8ae36985`
  - Contract: `ShieldGuard`
  - Role: Safe transaction guard
  - Demo use: blocks new risky approvals while Ethereum is in `Shield Mode`

- `0x0596181cE909e017088Ead03AE7273Baba41Df71`
  - Contract: `ApprovalFirewallModule`
  - Role: Reactive callback receiver + Safe module
  - Demo use:
    - receives callback to revoke ETH approvals
    - receives callback to enter / exit ETH `Shield Mode`

## Base Sepolia

- `0x384f950fBfaB4F13f0C1Cb62F2054Ac860b067A6`
  - Contract: `MockUSDC`
  - Role: demo ERC20 token
  - Demo use: used to trigger risky `Approval` events from the Safe on Base Sepolia

- `0x05857fB0fa1A618D22C31840C30a9c8c8ae36985`
  - Contract: `NullaRegistry`
  - Role: stores the guardian profile and component addresses
  - Demo use: address registry for web/UI and deployment metadata

- `0x0596181cE909e017088Ead03AE7273Baba41Df71`
  - Contract: `NullaSubscriptionService`
  - Role: emits `Subscribe(address)` / `Unsubscribe(address)` control events
  - Demo use: Reactive RC listens to this contract to dynamically add/remove Base approval subscriptions for the risky spender

- `0xFEeDBD67B96123A59c019722cac2D85029c45770`
  - Contract: `ShieldGuard`
  - Role: Safe transaction guard
  - Demo use: blocks new risky approvals while Base is in `Shield Mode`

- `0x214Ef1D4BBb4F992b512AD65A929620C0Ba4705c`
  - Contract: `ApprovalFirewallModule`
  - Role: Reactive callback receiver + Safe module
  - Demo use:
    - receives callback to revoke Base approvals
    - receives callback to enter / exit Base `Shield Mode`

## Reactive Lasna

- `0x6573CfC1EA728bf44b9d0738642b055C6306267F`
  - Contract: `ReactiveCrossChainFirewall`
  - Role: current active mainline RC
  - Demo use:
    - listens to ETH/Base `NullaSubscriptionService` control events
    - dynamically subscribes to `Approval(address,address,uint256)` on both chains for the risky spender
    - emits source-chain revoke callback and peer-chain shield callback
    - only subscribes to `Cron10` while a shield is active
    - deletes `PendingShield` storage after exit

- `0xd62380dcBa315b92E27d290d95Fc238D770171F4`
  - Contract: previous wallet-1 `ReactiveCrossChainFirewall`
  - Role: old mainline RC
  - Demo use: no longer used
  - Status: unsubscribed / inactive for demo purposes

- `0xf201A43bcF816934ca84e84e09f3575237f80181`
  - Contract: previous wallet-2 `ReactiveCrossChainFirewall`
  - Role: old wallet-2 RC
  - Demo use: no longer used
  - Status: unsubscribed / inactive for demo purposes

- `0xb7DCF355171114Be6972Fe0C6b1d3e36657bb0d4`
  - Contract: older `ReactiveCrossChainFirewall`
  - Role: earlier RC from previous debug/demo round
  - Demo use: no longer used
  - Status: unsubscribed / inactive for demo purposes

- `0xFD95924B2e8f65b2DD872459A5880095d19d428E`
  - Contract: oldest `ReactiveCrossChainFirewall`
  - Role: deprecated RC from early iterations
  - Demo use: not used
  - Status: no active subscriptions
