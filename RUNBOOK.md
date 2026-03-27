# Runbook

## Setup

1. Ensure `.env` contains the Sepolia and Lasna RPC endpoints, keys, Safe address, and callback
   proxy addresses.
2. Confirm the Safe owner key and deployer key are the same EOA for this MVP.
3. Make sure the deployer has Sepolia ETH and lREACT.

## Local Verification

1. `forge fmt --check`
2. `forge build --sizes`
3. `forge test --offline`

## Planned Deployment Flow

1. Deploy Sepolia contracts with `DeploySepolia.s.sol`.
2. Enable `GuardianModule` on the existing Safe with `EnableModule.s.sol`.
3. Deploy `GuardianListener` on Reactive Lasna with `DeployLasna.s.sol`.
4. Register the policy and trigger the dangerous approval demo with `RegisterPolicyAndDemo.s.sol`.

## Expected Runtime Flow

1. The Safe registers a policy through `GuardianController`.
2. The listener subscribes to `Approval(owner=safe)` events.
3. The Safe emits a dangerous approval.
4. Reactive forwards the alert back to Sepolia.
5. `GuardianController` validates the callback and calls `GuardianModule`.
6. `GuardianModule` makes the Safe send `approve(spender, 0)`.

## Notes

- Local test runs must use `forge test --offline`.
- `DEPLOYMENTS.md` should be updated after each real deployment with addresses and tx hashes.
