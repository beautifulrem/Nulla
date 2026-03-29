# Nulla: End-to-End Deployment and Dual-Chain Test Guide

This document describes a practical end-to-end flow for this repository:

1. Prepare environment variables  
2. Deploy Ethereum Sepolia and Base Sepolia business contracts  
3. Deploy the Lasna Reactive contract  
4. Fund the Reactive contract and callback contracts  
5. Enable the Safe module and guard  
6. Activate dual-chain `Approval` subscriptions  
7. Run forward and reverse path tests  
8. Clean up old RCs or redeploy a new one

## 0. Prerequisites

This repository assumes you already have:

- a same-address Safe:
  - `DEMO_SAFE_SHARED_ADDRESS`
- a Safe owner:
  - `DEMO_SAFE_OWNER_ADDRESS`

If you do not have them yet, create a multi-chain same-address Safe in the Safe UI first.  
This repo does not create the Safe; it only deploys the protection layer and runs tests around it.

## 1. Prepare `.env`

Copy the template first:

```bash
cp .env.example .env
cp web/.env.example web/.env.local 2>/dev/null || true
```

At minimum, fill these values:

```bash
ETH_SEPOLIA_RPC_URL=...
BASE_SEPOLIA_RPC_URL=...
LASNA_RPC_URL=...

ETH_SEPOLIA_CHAIN_ID=11155111
BASE_SEPOLIA_CHAIN_ID=84532
LASNA_CHAIN_ID=5318007

ETH_SEPOLIA_PRIVATE_KEY=...
BASE_SEPOLIA_PRIVATE_KEY=...
LASNA_PRIVATE_KEY=...
DEMO_SAFE_OWNER_PRIVATE_KEY=...

DEMO_SAFE_SHARED_ADDRESS=...
DEMO_SAFE_OWNER_ADDRESS=...

ETH_SEPOLIA_CALLBACK_PROXY_ADDRESS=0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA
BASE_SEPOLIA_CALLBACK_PROXY_ADDRESS=0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6

SAFE_SINGLETON_ADDRESS=0x41675C099F32341bf84BFc5382aF534df5C7461a
SAFE_PROXY_FACTORY_ADDRESS=0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67
SAFE_FALLBACK_HANDLER_ADDRESS=0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99

CRON10_TOPIC0=0x04463f7c1651e6b9774d7f85c85bb94654e3c46ca79b0c16fb16d4183307b687
DEFAULT_BLACKLISTED_SPENDER=0x301E4F2bA24b4C009BfDCc5F7F192f6A0f9C8e8d

REACTIVE_DEPLOY_VALUE=3000000000000000000
```

## 2. Local Build and Test

```bash
forge build
NO_PROXY="*" HTTP_PROXY="" HTTPS_PROXY="" ALL_PROXY="" forge test -vvv
```

Do not move on to testnets if this step fails.

## 2.1 Launch the local frontend demo

If you want to present the demo from the frontend locally, use **production mode** by default.  
It is more stable than `next dev` and avoids hot-reload cache issues during a live presentation.

First build the frontend:

```bash
cd web
npm install
npm run build
```

Then start the frontend server:

```bash
npm run start -- --hostname 127.0.0.1 --port 3001
```

Open a second terminal window and launch the browser pages directly:

```bash
open http://127.0.0.1:3001/guardian/setup
open http://127.0.0.1:3001/demo
open http://127.0.0.1:3001/guardian/0xe5fd559fcb5fd437c4efdfabfe7138e5ef4a92912bf3c7c2d170292cf5e322c9
```

These pages are used for:

- `/guardian/setup`
  - Guardian Mode onboarding
- `/demo`
  - trigger risky approvals from frontend buttons
- `/guardian/<profileId>`
  - show dual-chain status, Shield Mode, timeline, and recovery

If you only need quick UI iteration, you can also use development mode:

```bash
cd web
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Then open:

```bash
open http://127.0.0.1:3000/guardian/setup
open http://127.0.0.1:3000/demo
open http://127.0.0.1:3000/guardian/0xe5fd559fcb5fd437c4efdfabfe7138e5ef4a92912bf3c7c2d170292cf5e322c9
```

For recording or live judging, prefer the `3001` `next start` flow.

## 3. Deploy Ethereum Sepolia Business Contracts

Deploy:

```bash
set -a && source .env && set +a
forge script script/DeployEthSepolia.s.sol:DeployEthSepolia --rpc-url "$ETH_SEPOLIA_RPC_URL" --private-key "$ETH_SEPOLIA_PRIVATE_KEY" --broadcast -vvvv
```

This deploys:

- `MockUSDC`
- `NullaSubscriptionService`
- `ShieldGuard`
- `ApprovalFirewallModule`

Then write the new addresses back into `.env`:

```bash
ETH_TOKEN_ADDRESS=...
ETH_SERVICE_ADDRESS=...
ETH_GUARD_ADDRESS=...
ETH_MODULE_ADDRESS=...
```

## 4. Deploy Base Sepolia Business Contracts

Deploy:

```bash
set -a && source .env && set +a
forge script script/DeployBaseSepolia.s.sol:DeployBaseSepolia --rpc-url "$BASE_SEPOLIA_RPC_URL" --private-key "$BASE_SEPOLIA_PRIVATE_KEY" --broadcast -vvvv
```

This deploys:

- `MockUSDC`
- `NullaRegistry`
- `NullaSubscriptionService`
- `ShieldGuard`
- `ApprovalFirewallModule`

Then write the new addresses back into `.env`:

```bash
NULLA_REGISTRY_ADDRESS=...
BASE_TOKEN_ADDRESS=...
BASE_SERVICE_ADDRESS=...
BASE_GUARD_ADDRESS=...
BASE_MODULE_ADDRESS=...
```

## 5. Deploy the Lasna Reactive Contract

This step **must use `forge create`**.  
Do not use `forge script` for a Reactive contract whose constructor calls `service.subscribe(...)`.

Deployment command:

```bash
set -a && source .env && set +a
forge create \
  --broadcast \
  --rpc-url "$LASNA_RPC_URL" \
  --private-key "$LASNA_PRIVATE_KEY" \
  src/nulla/ReactiveCrossChainFirewall.sol:ReactiveCrossChainFirewall \
  --value 3ether \
  --constructor-args \
  "$DEMO_SAFE_OWNER_ADDRESS" \
  "$DEMO_SAFE_SHARED_ADDRESS" \
  "$ETH_SEPOLIA_CHAIN_ID" \
  "$ETH_SERVICE_ADDRESS" \
  "$ETH_TOKEN_ADDRESS" \
  "$ETH_MODULE_ADDRESS" \
  "$ETH_GUARD_ADDRESS" \
  "$BASE_SEPOLIA_CHAIN_ID" \
  "$BASE_SERVICE_ADDRESS" \
  "$BASE_TOKEN_ADDRESS" \
  "$BASE_MODULE_ADDRESS" \
  "$BASE_GUARD_ADDRESS" \
  100000000 \
  "[]" \
  "[]" \
  "[$DEFAULT_BLACKLISTED_SPENDER]" \
  "$CRON10_TOPIC0" \
  10 \
  10 \
  500000
```

After deployment, write the address back into `.env`:

```bash
REACTIVE_LASNA_ADDRESS=...
```

## 6. Check Reactive Contract Balance and Debt

Check balance:

```bash
set -a && source .env && set +a
cast balance $REACTIVE_LASNA_ADDRESS --rpc-url $LASNA_RPC_URL
```

Check debt:

```bash
set -a && source .env && set +a
cast call 0x0000000000000000000000000000000000fffFfF "debt(address)(uint256)" $REACTIVE_LASNA_ADDRESS --rpc-url $LASNA_RPC_URL
```

If the balance is too low, top it up with at least `3 REACT`:

```bash
set -a && source .env && set +a
cast send $REACTIVE_LASNA_ADDRESS --rpc-url $LASNA_RPC_URL --private-key $LASNA_PRIVATE_KEY --value 3ether
```

Then settle debt:

```bash
set -a && source .env && set +a
cast send --rpc-url $LASNA_RPC_URL --private-key $LASNA_PRIVATE_KEY $REACTIVE_LASNA_ADDRESS "coverDebt()"
```

## 7. Fund the Destination Callback Contracts

Fund the ETH and Base modules:

```bash
set -a && source .env && set +a
cast send $ETH_MODULE_ADDRESS --rpc-url $ETH_SEPOLIA_RPC_URL --private-key $ETH_SEPOLIA_PRIVATE_KEY --value 0.01ether
```

```bash
set -a && source .env && set +a
cast send $BASE_MODULE_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $BASE_SEPOLIA_PRIVATE_KEY --value 0.01ether
```

## 8. Register the Guardian Profile

```bash
set -a && source .env && set +a
forge script script/RegisterProfile.s.sol:RegisterProfile --rpc-url "$BASE_SEPOLIA_RPC_URL" --private-key "$BASE_SEPOLIA_PRIVATE_KEY" --broadcast -vvvv
```

## 9. Enable the Safe Module and Guard

This is not a plain EOA call. The Safe must execute its own transactions.  
The following command uses Protocol Kit directly from the terminal to submit 4 Safe txs:

- ETH `enableModule`
- Base `enableModule`
- ETH `setGuard`
- Base `setGuard`

```bash
set -a && source .env && set +a
node - <<'NODE'
const Safe = require("./web/node_modules/@safe-global/protocol-kit").default;
const { encodeFunctionData, parseAbi } = require("./web/node_modules/viem");
const safeAbi = parseAbi([
  "function enableModule(address module)",
  "function setGuard(address guard)"
]);
function rpcProvider(url) {
  return {
    async request({ method, params }) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: params ?? [] })
      });
      const json = await response.json();
      if (json.error) throw new Error(`${json.error.code}: ${json.error.message}`);
      return json.result;
    }
  };
}
async function execAction(label, rpcUrl, safeAddress, signer, data) {
  const protocolKit = await Safe.init({ provider: rpcProvider(rpcUrl), signer, safeAddress });
  const tx = await protocolKit.createTransaction({ transactions: [{ to: safeAddress, data, value: "0" }] });
  const signed = await protocolKit.signTransaction(tx);
  const result = await protocolKit.executeTransaction(signed);
  console.log(`${label}: ${result.hash}`);
}
(async () => {
  const signer = process.env.DEMO_SAFE_OWNER_PRIVATE_KEY;
  const safeAddress = process.env.DEMO_SAFE_SHARED_ADDRESS;
  await execAction("eth-enableModule", process.env.ETH_SEPOLIA_RPC_URL, safeAddress, signer, encodeFunctionData({ abi: safeAbi, functionName: "enableModule", args: [process.env.ETH_MODULE_ADDRESS] }));
  await execAction("base-enableModule", process.env.BASE_SEPOLIA_RPC_URL, safeAddress, signer, encodeFunctionData({ abi: safeAbi, functionName: "enableModule", args: [process.env.BASE_MODULE_ADDRESS] }));
  await execAction("eth-setGuard", process.env.ETH_SEPOLIA_RPC_URL, safeAddress, signer, encodeFunctionData({ abi: safeAbi, functionName: "setGuard", args: [process.env.ETH_GUARD_ADDRESS] }));
  await execAction("base-setGuard", process.env.BASE_SEPOLIA_RPC_URL, safeAddress, signer, encodeFunctionData({ abi: safeAbi, functionName: "setGuard", args: [process.env.BASE_GUARD_ADDRESS] }));
})().catch((e) => { console.error(e); process.exit(1); });
NODE
```

Verify:

```bash
set -a && source .env && set +a
cast call $DEMO_SAFE_SHARED_ADDRESS "isModuleEnabled(address)(bool)" $ETH_MODULE_ADDRESS --rpc-url $ETH_SEPOLIA_RPC_URL
```

```bash
set -a && source .env && set +a
cast call $DEMO_SAFE_SHARED_ADDRESS "isModuleEnabled(address)(bool)" $BASE_MODULE_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL
```

## 10. Activate Dual-Chain `Approval` Subscriptions

The Reactive contract first listens to `Subscribe/Unsubscribe` control events from `NullaSubscriptionService`.  
To make it subscribe to the actual dual-chain `Approval(topic2 = risky spender)` events, call this once on ETH and once on Base:

```bash
set -a && source .env && set +a
cast send $ETH_SERVICE_ADDRESS "subscribeSpender(address)" $DEFAULT_BLACKLISTED_SPENDER --private-key $DEMO_SAFE_OWNER_PRIVATE_KEY --rpc-url $ETH_SEPOLIA_RPC_URL
```

```bash
set -a && source .env && set +a
cast send $BASE_SERVICE_ADDRESS "subscribeSpender(address)" $DEFAULT_BLACKLISTED_SPENDER --private-key $DEMO_SAFE_OWNER_PRIVATE_KEY --rpc-url $BASE_SEPOLIA_RPC_URL
```

Then wait for Reactive Network to turn those control events into actual business subscriptions, and verify:

```bash
curl -s https://lasna-rpc.rnk.dev/ \
  -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"rnk_getSubscribers\",\"params\":[\"$DEMO_SAFE_OWNER_ADDRESS\"],\"id\":1}"
```

You should eventually see both:

- `chainId = 11155111`, `topic0 = Approval`, `topic2 = risky spender`
- `chainId = 84532`, `topic0 = Approval`, `topic2 = risky spender`

## 11. Prepare Test Assets

Mint some `MockUSDC` to the Safe on both chains:

```bash
set -a && source .env && set +a
cast send $ETH_TOKEN_ADDRESS "mint(address,uint256)" $DEMO_SAFE_SHARED_ADDRESS 1000000000 --private-key $DEMO_SAFE_OWNER_PRIVATE_KEY --rpc-url $ETH_SEPOLIA_RPC_URL
```

```bash
set -a && source .env && set +a
cast send $BASE_TOKEN_ADDRESS "mint(address,uint256)" $DEMO_SAFE_SHARED_ADDRESS 1000000000 --private-key $DEMO_SAFE_OWNER_PRIVATE_KEY --rpc-url $BASE_SEPOLIA_RPC_URL
```

## 12. Forward Path Test

Goal:

- `Base risk -> Base revoke + Ethereum shield`

Send a risky approval from the Base Safe:

```bash
set -a && source .env && set +a
node - <<'NODE'
const Safe = require("./web/node_modules/@safe-global/protocol-kit").default;
const { encodeFunctionData, parseAbi } = require("./web/node_modules/viem");
const erc20Abi = parseAbi(["function approve(address spender, uint256 amount)"]);
function rpcProvider(url) {
  return {
    async request({ method, params }) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: params ?? [] })
      });
      const json = await response.json();
      if (json.error) throw new Error(`${json.error.code}: ${json.error.message}`);
      return json.result;
    }
  };
}
(async () => {
  const protocolKit = await Safe.init({
    provider: rpcProvider(process.env.BASE_SEPOLIA_RPC_URL),
    signer: process.env.DEMO_SAFE_OWNER_PRIVATE_KEY,
    safeAddress: process.env.DEMO_SAFE_SHARED_ADDRESS
  });
  const tx = await protocolKit.createTransaction({
    transactions: [{
      to: process.env.BASE_TOKEN_ADDRESS,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [process.env.DEFAULT_BLACKLISTED_SPENDER, 800000000n]
      }),
      value: "0"
    }]
  });
  const signed = await protocolKit.signTransaction(tx);
  const result = await protocolKit.executeTransaction(signed);
  console.log(result.hash);
})().catch((e) => { console.error(e); process.exit(1); });
NODE
```

Verify result:

```bash
set -a && source .env && set +a
cast call $BASE_TOKEN_ADDRESS "allowance(address,address)(uint256)" $DEMO_SAFE_SHARED_ADDRESS $DEFAULT_BLACKLISTED_SPENDER --rpc-url $BASE_SEPOLIA_RPC_URL
```

Expected:

- allowance returns to `0`

Then check ETH guard:

```bash
set -a && source .env && set +a
cast call $ETH_GUARD_ADDRESS "mode()(uint8)" --rpc-url $ETH_SEPOLIA_RPC_URL
cast call $ETH_GUARD_ADDRESS "shieldUntilTick()(uint64)" --rpc-url $ETH_SEPOLIA_RPC_URL
```

Expected:

- `mode = 1`
- `shieldUntilTick > 0`

## 13. Verify Shield Rejection

While ETH is in `Shield`, send an approval to an unknown spender.  
Expected result: the Safe execution is rejected by the guard.

```bash
set -a && source .env && set +a
node - <<'NODE'
const Safe = require("./web/node_modules/@safe-global/protocol-kit").default;
const { encodeFunctionData, parseAbi } = require("./web/node_modules/viem");
const erc20Abi = parseAbi(["function approve(address spender, uint256 amount)"]);
function rpcProvider(url) {
  return {
    async request({ method, params }) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: params ?? [] })
      });
      const json = await response.json();
      if (json.error) throw new Error(`${json.error.code}: ${json.error.message}`);
      return json.result;
    }
  };
}
(async () => {
  const protocolKit = await Safe.init({
    provider: rpcProvider(process.env.ETH_SEPOLIA_RPC_URL),
    signer: process.env.DEMO_SAFE_OWNER_PRIVATE_KEY,
    safeAddress: process.env.DEMO_SAFE_SHARED_ADDRESS
  });
  const tx = await protocolKit.createTransaction({
    transactions: [{
      to: process.env.ETH_TOKEN_ADDRESS,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: ["0x1111111111111111111111111111111111111111", 1000000n]
      }),
      value: "0"
    }]
  });
  const signed = await protocolKit.signTransaction(tx);
  try {
    const result = await protocolKit.executeTransaction(signed);
    console.log(result.hash);
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(2);
  }
})().catch((e) => { console.error(e); process.exit(1); });
NODE
```

## 14. Verify Cron10 On-Demand Subscription and Auto Exit

While shield is active, inspect the current subscriptions:

```bash
curl -s https://lasna-rpc.rnk.dev/ \
  -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"rnk_getSubscribers\",\"params\":[\"$DEMO_SAFE_OWNER_ADDRESS\"],\"id\":1}"
```

Expected while shield is active:

- a `Cron10` subscription is present:
  - `chainId = 0`
  - `contract = 0x0000000000000000000000000000000000fffFfF`
  - `topic0 = CRON10_TOPIC0`

Then wait until the shield expires and verify:

```bash
set -a && source .env && set +a
cast call $ETH_GUARD_ADDRESS "mode()(uint8)" --rpc-url $ETH_SEPOLIA_RPC_URL
cast call $ETH_GUARD_ADDRESS "shieldUntilTick()(uint64)" --rpc-url $ETH_SEPOLIA_RPC_URL
```

Expected after auto exit:

- `mode = 0`
- `shieldUntilTick = 0`

Then inspect subscriptions again:

```bash
curl -s https://lasna-rpc.rnk.dev/ \
  -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"rnk_getSubscribers\",\"params\":[\"$DEMO_SAFE_OWNER_ADDRESS\"],\"id\":1}"
```

Expected after exit:

- the `Cron10` subscription disappears

### Manual Shield Exit Fallback

If you do not want to wait for `Cron10` during a live demo, or if you need a debugging shortcut, you can manually clear `Shield Mode` on the target chain.

Ethereum Sepolia:

```bash
set -a && source .env && set +a
cast send $ETH_GUARD_ADDRESS \
  "exitShieldFromModule(bytes32)" \
  0x6d616e75616c0000000000000000000000000000000000000000000000000000 \
  --private-key $DEMO_SAFE_OWNER_PRIVATE_KEY \
  --rpc-url $ETH_SEPOLIA_RPC_URL
```

Base Sepolia:

```bash
set -a && source .env && set +a
cast send $BASE_GUARD_ADDRESS \
  "exitShieldFromModule(bytes32)" \
  0x6d616e75616c0000000000000000000000000000000000000000000000000000 \
  --private-key $DEMO_SAFE_OWNER_PRIVATE_KEY \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

Then confirm:

```bash
set -a && source .env && set +a
cast call $ETH_GUARD_ADDRESS "mode()(uint8)" --rpc-url $ETH_SEPOLIA_RPC_URL
cast call $ETH_GUARD_ADDRESS "shieldUntilTick()(uint64)" --rpc-url $ETH_SEPOLIA_RPC_URL
cast call $BASE_GUARD_ADDRESS "mode()(uint8)" --rpc-url $BASE_SEPOLIA_RPC_URL
cast call $BASE_GUARD_ADDRESS "shieldUntilTick()(uint64)" --rpc-url $BASE_SEPOLIA_RPC_URL
```

Expected:

- `mode = 0`
- `shieldUntilTick = 0`

## 15. Reverse Path Test

Goal:

- `Ethereum risk -> Ethereum revoke + Base shield`

Send a risky approval from the ETH Safe:

```bash
set -a && source .env && set +a
node - <<'NODE'
const Safe = require("./web/node_modules/@safe-global/protocol-kit").default;
const { encodeFunctionData, parseAbi } = require("./web/node_modules/viem");
const erc20Abi = parseAbi(["function approve(address spender, uint256 amount)"]);
function rpcProvider(url) {
  return {
    async request({ method, params }) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: params ?? [] })
      });
      const json = await response.json();
      if (json.error) throw new Error(`${json.error.code}: ${json.error.message}`);
      return json.result;
    }
  };
}
(async () => {
  const protocolKit = await Safe.init({
    provider: rpcProvider(process.env.ETH_SEPOLIA_RPC_URL),
    signer: process.env.DEMO_SAFE_OWNER_PRIVATE_KEY,
    safeAddress: process.env.DEMO_SAFE_SHARED_ADDRESS
  });
  const tx = await protocolKit.createTransaction({
    transactions: [{
      to: process.env.ETH_TOKEN_ADDRESS,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [process.env.DEFAULT_BLACKLISTED_SPENDER, 200000000n]
      }),
      value: "0"
    }]
  });
  const signed = await protocolKit.signTransaction(tx);
  const result = await protocolKit.executeTransaction(signed);
  console.log(result.hash);
})().catch((e) => { console.error(e); process.exit(1); });
NODE
```

Verify:

```bash
set -a && source .env && set +a
cast call $ETH_TOKEN_ADDRESS "allowance(address,address)(uint256)" $DEMO_SAFE_SHARED_ADDRESS $DEFAULT_BLACKLISTED_SPENDER --rpc-url $ETH_SEPOLIA_RPC_URL
```

```bash
set -a && source .env && set +a
cast call $BASE_GUARD_ADDRESS "mode()(uint8)" --rpc-url $BASE_SEPOLIA_RPC_URL
cast call $BASE_GUARD_ADDRESS "shieldUntilTick()(uint64)" --rpc-url $BASE_SEPOLIA_RPC_URL
```

## 16. Unsubscribe an Old RC

If you need to replace an old RC, unsubscribe it first:

```bash
set -a && source .env && set +a
TARGET_RC=0x旧RC地址 SENDER_PRIVATE_KEY=$DEMO_SAFE_OWNER_PRIVATE_KEY /bin/zsh script/UnsubscribeOldReactiveSubscriptions.sh
```

Then verify:

```bash
curl -s https://lasna-rpc.rnk.dev/ \
  -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"rnk_getSubscribers\",\"params\":[\"$DEMO_SAFE_OWNER_ADDRESS\"],\"id\":1}"
```

## 17. Export the Deployment Manifest

If you want to sync addresses to the web app:

```bash
set -a && source .env && set +a
forge script script/ExportDeploymentManifest.s.sol:ExportDeploymentManifest --rpc-url "$BASE_SEPOLIA_RPC_URL" --private-key "$BASE_SEPOLIA_PRIVATE_KEY"
```

Or update manually:

- `.env`
- `web/.env.local`
- `deployments/nulla-demo.json`
- `deployments/summary.md`
- `deployments/demo-evidence.md`

## 18. Key Lessons

- **Deploy Lasna Reactive contracts with `forge create`, not `forge script`**
- **Fund every active Reactive contract with at least `3 REACT`**
- **Fund the destination callback/module contracts on the business chains**
- **Subscribe to `Cron10` only while a shield is active**
- **Delete expired `PendingShield` storage instead of only marking it inactive**
