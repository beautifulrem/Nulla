# Guardian MVP

Guardian MVP is a Safe-native approval firewall built for `Ethereum Sepolia + Reactive Lasna`.
It listens for risky ERC-20 `Approval` events from a protected Safe, then routes them through
Reactive Network back to a Sepolia controller, which can trigger a constrained Safe module to
automatically revoke the allowance with `approve(spender, 0)`.

## Architecture

- `GuardianModule`: the only execution layer with authority to act on behalf of the Safe.
- `GuardianController`: stores policy, validates Reactive callbacks, and decides whether to act.
- `GuardianListener`: runs on Reactive Lasna, manages subscriptions, and forwards alerts.
- `MockERC20` / `MockBadSpender` / `MockRiskEmitter`: local demo and test fixtures.

## Local Workflow

1. Copy `.env.example` to `.env` if needed and fill private keys and RPCs.
2. Run `forge fmt --check`.
3. Run `forge build --sizes`.
4. Run `forge test --offline`.

`forge test` without `--offline` is currently unreliable on this machine because Foundry
`1.5.1` crashes when initializing external tracing. `--offline` is the required local test mode.

## Planned Scripts

- `script/DeploySepolia.s.sol`
- `script/EnableModule.s.sol`
- `script/DeployLasna.s.sol`
- `script/RegisterPolicyAndDemo.s.sol`

## Submission Artifacts

- [RUNBOOK.md](./RUNBOOK.md): deployment and demo procedure
- [DEPLOYMENTS.md](./DEPLOYMENTS.md): addresses and transaction hashes

## Scope

This first round implements the approval auto-revoke path only.
The `protocol risk -> sweep` flow is intentionally left as a contract and event skeleton for a
later stage.
