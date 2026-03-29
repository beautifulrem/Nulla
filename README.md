<p align="center">
  <img src="./docs/brand/Nulla.webp" alt="Nulla logo" width="148" />
</p>

<h1 align="center">Nulla</h1>

<p align="center">
  <strong>Detect once. Defend across chains.</strong>
</p>

<hr />

<p align="center">
  <a href="./docs/from-zero-to-dual-chain-demo.en.md">
    <img alt="Language English" src="https://img.shields.io/badge/Language-English-1677ff">
  </a>
  <a href="./docs/from-zero-to-dual-chain-demo.md">
    <img alt="语言 简体中文" src="https://img.shields.io/badge/%E8%AF%AD%E8%A8%80-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-e67e22">
  </a>
</p>

<p align="center">
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-f1c40f">
  <img alt="Chains Ethereum Sepolia + Base Sepolia" src="https://img.shields.io/badge/Chains-Ethereum%20Sepolia%20%2B%20Base%20Sepolia-2980b9">
  <img alt="Reactive Network Lasna" src="https://img.shields.io/badge/Reactive-Lasna-8e44ad">
  <img alt="Safe Smart Wallet" src="https://img.shields.io/badge/Safe-approval%20firewall-27ae60">
  <img alt="Frontend Next.js" src="https://img.shields.io/badge/Frontend-Next.js-111111">
</p>

<p>
  Nulla is a cross-chain approval firewall for Safe. It uses a single Reactive contract on Lasna to watch risky approval activity across Ethereum Sepolia and Base Sepolia, revoke the approval on the source chain, and push the peer chain into Shield Mode.
</p>

<p>
  <strong>Quick Links</strong>
</p>

- 🚀 [English Demo Guide](./docs/from-zero-to-dual-chain-demo.en.md)
- 🇨🇳 [中文双链测试流程](./docs/from-zero-to-dual-chain-demo.md)
- 🎯 [Hackathon Final Submission](./deployments/hackathon-final-submit.md)

## Table of Contents

- [🚨 Why Nulla](#why-nulla)
- [🧱 Stack](#stack)
- [🔄 Core Demo Flow](#core-demo-flow)
- [📚 Guides](#guides)
- [🛠 Local Commands](#local-commands)

## Why Nulla

- Dangerous approvals are everywhere in Web3.
- Granting approvals is easy; cleaning them up is usually manual.
- Same-address multi-chain Safe deployments increase shared blast radius.
- Nulla turns that problem into a single cross-chain security workflow:
  detect risk, revoke locally, shield the peer chain, then recover.

## Stack

- Solidity + Foundry for contracts and scripts
- Reactive Network on Lasna for cross-chain event handling
- Safe modules and guards for approval enforcement
- Next.js for the demo UI, onboarding flow, and control console

## Core Demo Flow

1. Enable Guardian Mode for the shared Safe.
2. Trigger a risky approval on one chain.
3. Let Lasna react and coordinate cross-chain protection.
4. Revoke the source-chain approval.
5. Enter Shield Mode on the peer chain.
6. Exit Shield manually or automatically after the recovery window.

![Nulla architecture flow](./docs/diagrams/Nulla_Arch.svg)

## Guides

- [English end-to-end demo guide](./docs/from-zero-to-dual-chain-demo.en.md)
- [中文双链测试流程](./docs/from-zero-to-dual-chain-demo.md)

## Local Commands

```bash
forge build
forge test -vvv
cd web && npm run typecheck
cd web && npm run build
```
