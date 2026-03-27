# Workflow

## Setup

1. Deploy `GuardianController` on Sepolia.
2. Deploy `GuardianModule` with the Safe address, controller address, and cold wallet address.
3. Enable the module through a Safe transaction.
4. Deploy `GuardianListener` on Reactive Lasna.
5. Register the policy from the Safe so `msg.sender == safe`.

## Runtime Flow

1. The Safe emits a risky ERC-20 `Approval(owner, spender, value)` event on Sepolia.
2. `GuardianListener` sees the log on Lasna because it subscribed with `topic_1 = safe`.
3. The listener emits a callback to `GuardianController.handleApprovalAlert(...)`.
4. The controller validates the callback sender and `rvm_id`.
5. If the spender is not whitelisted or the amount exceeds `maxAllowance`, the controller calls `GuardianModule.revokeERC20(token, spender)`.
6. The module calls `Safe.execTransactionFromModule(...)` with `approve(spender, 0)`.
7. The token emits `Approval(owner = safe, spender, value = 0)`.
8. The controller ignores the zero-amount approval, so the loop stops there.

## Stretch Path

The repository keeps a skeleton for `protocol risk -> sweep`, but it is not part of the first live workflow.
