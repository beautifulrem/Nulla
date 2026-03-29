# Nulla

Nulla is a cross-chain approval firewall for Safe. It uses a single Reactive contract on Lasna to watch risky approval activity across Ethereum Sepolia and Base Sepolia, revoke the approval on the source chain, and push the peer chain into Shield Mode.

## Stack

- Solidity + Foundry for contracts and scripts
- Reactive Network on Lasna for cross-chain event handling
- Safe modules and guards for approval enforcement
- Next.js for the demo UI, onboarding flow, and control console

## Core demo flow

1. Enable Guardian Mode for the shared Safe
2. Trigger a risky approval on one chain
3. Let Lasna react and coordinate cross-chain protection
4. Revoke the source-chain approval
5. Enter Shield Mode on the peer chain
6. Exit Shield manually or automatically after the recovery window

## Local commands

```bash
rtk forge build
rtk forge test -vvv
cd web && rtk npm run typecheck
cd web && rtk npm run build
```
