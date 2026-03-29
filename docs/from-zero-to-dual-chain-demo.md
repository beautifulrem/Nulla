# Nulla：安装、部署与验证指南

这份文档面向任何希望在本地或测试网上复现本项目的人，包括贡献者、评委以及需要完整运行本系统的开发者。

完成本文档后，你将能够：

1. 配置运行所需环境变量
2. 部署 Ethereum Sepolia、Base Sepolia 与 Lasna 上的合约
3. 在两条业务链上接入 Safe 的 module 和 guard
4. 激活跨链 `Approval` 订阅
5. 验证正向与反向两条保护链路

这是一份安装、部署和验证文档，不是演示脚本。

## 0. 前提

当前仓库假设你已经有：

- 一只同地址 Safe：
  - `DEMO_SAFE_SHARED_ADDRESS`
- 一个 Safe owner：
  - `DEMO_SAFE_OWNER_ADDRESS`

如果你没有这两样，需要先在 Safe 官方前端创建多链同地址 Safe。  
当前仓库本身不负责创建 Safe，只负责部署安全层合约和测试。

## 1. 准备 `.env`

先复制模板：

```bash
cp .env.example .env
cp web/.env.example web/.env.local 2>/dev/null || true
```

至少填这些变量：

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

## 2. 本地编译和测试

```bash
forge build
NO_PROXY="*" HTTP_PROXY="" HTTPS_PROXY="" ALL_PROXY="" forge test -vvv
```

如果这里不过，不要直接上测试网。

## 2.1 启动本地前端页面

如果你想在本地通过前端检查项目状态，推荐使用 **production 模式**，比 `next dev` 更稳定，也更适合做端到端验证。

先进入前端目录并构建：

```bash
cd web
npm install
npm run build
```

然后启动前端服务：

```bash
npm run start -- --hostname 127.0.0.1 --port 3001
```

再开一个新的终端窗口，直接打开浏览器页面：

```bash
open http://127.0.0.1:3001/guardian/setup
open http://127.0.0.1:3001/demo
open http://127.0.0.1:3001/guardian/0xe5fd559fcb5fd437c4efdfabfe7138e5ef4a92912bf3c7c2d170292cf5e322c9
```

这 3 个页面分别适合用于本地检查：

- `/guardian/setup`
  - 展示 Guardian Mode onboarding
- `/demo`
  - 从前端控件直接触发风险 approval
- `/guardian/<profileId>`
  - 展示双链状态、Shield、时间线和恢复结果

如果你只是临时调样式，也可以用开发模式：

```bash
cd web
npm run dev -- --hostname 127.0.0.1 --port 3000
```

然后打开：

```bash
open http://127.0.0.1:3000/guardian/setup
open http://127.0.0.1:3000/demo
open http://127.0.0.1:3000/guardian/0xe5fd559fcb5fd437c4efdfabfe7138e5ef4a92912bf3c7c2d170292cf5e322c9
```

为了得到更稳定的本地运行结果，优先使用 `3001` 的 `next start`。

## 3. 部署 Ethereum Sepolia 业务合约

部署：

```bash
set -a && source .env && set +a
forge script script/DeployEthSepolia.s.sol:DeployEthSepolia --rpc-url "$ETH_SEPOLIA_RPC_URL" --private-key "$ETH_SEPOLIA_PRIVATE_KEY" --broadcast -vvvv
```

部署内容：

- `MockUSDC`
- `NullaSubscriptionService`
- `ShieldGuard`
- `ApprovalFirewallModule`

然后把新地址写回 `.env`：

```bash
ETH_TOKEN_ADDRESS=...
ETH_SERVICE_ADDRESS=...
ETH_GUARD_ADDRESS=...
ETH_MODULE_ADDRESS=...
```

## 4. 部署 Base Sepolia 业务合约

部署：

```bash
set -a && source .env && set +a
forge script script/DeployBaseSepolia.s.sol:DeployBaseSepolia --rpc-url "$BASE_SEPOLIA_RPC_URL" --private-key "$BASE_SEPOLIA_PRIVATE_KEY" --broadcast -vvvv
```

部署内容：

- `MockUSDC`
- `NullaRegistry`
- `NullaSubscriptionService`
- `ShieldGuard`
- `ApprovalFirewallModule`

然后把新地址写回 `.env`：

```bash
NULLA_REGISTRY_ADDRESS=...
BASE_TOKEN_ADDRESS=...
BASE_SERVICE_ADDRESS=...
BASE_GUARD_ADDRESS=...
BASE_MODULE_ADDRESS=...
```

## 5. 部署 Lasna Reactive 合约

这一步 **必须用 `forge create`**。  
不要用 `forge script` 去部署 constructor 里调用 `service.subscribe(...)` 的 Reactive 合约。

部署命令：

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

部署完成后，把地址写回 `.env`：

```bash
REACTIVE_LASNA_ADDRESS=...
```

## 6. 检查 Reactive 合约余额和债务

查看余额：

```bash
set -a && source .env && set +a
cast balance $REACTIVE_LASNA_ADDRESS --rpc-url $LASNA_RPC_URL
```

查看债务：

```bash
set -a && source .env && set +a
cast call 0x0000000000000000000000000000000000fffFfF "debt(address)(uint256)" $REACTIVE_LASNA_ADDRESS --rpc-url $LASNA_RPC_URL
```

如果余额不足，直接补至少 `3 REACT`：

```bash
set -a && source .env && set +a
cast send $REACTIVE_LASNA_ADDRESS --rpc-url $LASNA_RPC_URL --private-key $LASNA_PRIVATE_KEY --value 3ether
```

然后结算债务：

```bash
set -a && source .env && set +a
cast send --rpc-url $LASNA_RPC_URL --private-key $LASNA_PRIVATE_KEY $REACTIVE_LASNA_ADDRESS "coverDebt()"
```

## 7. 给目标链 callback 合约补资金

给 ETH / Base module 各补一笔：

```bash
set -a && source .env && set +a
cast send $ETH_MODULE_ADDRESS --rpc-url $ETH_SEPOLIA_RPC_URL --private-key $ETH_SEPOLIA_PRIVATE_KEY --value 0.01ether
```

```bash
set -a && source .env && set +a
cast send $BASE_MODULE_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $BASE_SEPOLIA_PRIVATE_KEY --value 0.01ether
```

## 8. 注册 profile

```bash
set -a && source .env && set +a
forge script script/RegisterProfile.s.sol:RegisterProfile --rpc-url "$BASE_SEPOLIA_RPC_URL" --private-key "$BASE_SEPOLIA_PRIVATE_KEY" --broadcast -vvvv
```

## 9. 启用 Safe 的 module / guard

这一步不是普通 EOA 调合约，而是通过 Safe 自己发交易。  
下面命令会用 Protocol Kit 直接从终端提交 4 笔 Safe tx：

- ETH `enableModule`
- Base `enableModule`
- ETH `setGuard`
- Base `setGuard`

```bash
set -a && source .env && set +a
node - <<'"'"'NODE'"'"'
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
NODE'
```

核对是否成功：

```bash
set -a && source .env && set +a
cast call $DEMO_SAFE_SHARED_ADDRESS "isModuleEnabled(address)(bool)" $ETH_MODULE_ADDRESS --rpc-url $ETH_SEPOLIA_RPC_URL
```

```bash
set -a && source .env && set +a
cast call $DEMO_SAFE_SHARED_ADDRESS "isModuleEnabled(address)(bool)" $BASE_MODULE_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL
```

## 10. 激活双链 `Approval` 订阅

Reactive 合约先监听 `NullaSubscriptionService` 的 `Subscribe/Unsubscribe` 控制事件。  
要让它真正开始监听双链 `Approval(topic2 = risky spender)`，需要在 ETH / Base 上各发一遍：

```bash
set -a && source .env && set +a
cast send $ETH_SERVICE_ADDRESS "subscribeSpender(address)" $DEFAULT_BLACKLISTED_SPENDER --private-key $DEMO_SAFE_OWNER_PRIVATE_KEY --rpc-url $ETH_SEPOLIA_RPC_URL
```

```bash
set -a && source .env && set +a
cast send $BASE_SERVICE_ADDRESS "subscribeSpender(address)" $DEFAULT_BLACKLISTED_SPENDER --private-key $DEMO_SAFE_OWNER_PRIVATE_KEY --rpc-url $BASE_SEPOLIA_RPC_URL
```

然后等 Reactive 网络把控制事件转成真正的业务订阅，再查：

```bash
curl -s https://lasna-rpc.rnk.dev/ \
  -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"rnk_getSubscribers\",\"params\":[\"$DEMO_SAFE_OWNER_ADDRESS\"],\"id\":1}"
```

看到两条下面这种订阅就说明挂上了：

- `chainId = 11155111`, `topic0 = Approval`, `topic2 = risky spender`
- `chainId = 84532`, `topic0 = Approval`, `topic2 = risky spender`

## 11. 准备测试资产

给 Safe mint 一些双链 `MockUSDC`：

```bash
set -a && source .env && set +a
cast send $ETH_TOKEN_ADDRESS "mint(address,uint256)" $DEMO_SAFE_SHARED_ADDRESS 1000000000 --private-key $DEMO_SAFE_OWNER_PRIVATE_KEY --rpc-url $ETH_SEPOLIA_RPC_URL
```

```bash
set -a && source .env && set +a
cast send $BASE_TOKEN_ADDRESS "mint(address,uint256)" $DEMO_SAFE_SHARED_ADDRESS 1000000000 --private-key $DEMO_SAFE_OWNER_PRIVATE_KEY --rpc-url $BASE_SEPOLIA_RPC_URL
```

## 12. 验证 Base -> Ethereum 保护链路

目标：

- `Base risk -> Base revoke + Ethereum shield`

发一笔 Base Safe 的高风险 approval：

```bash
set -a && source .env && set +a
node - <<'"'"'NODE'"'"'
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
NODE'
```

验证结果：

```bash
set -a && source .env && set +a
cast call $BASE_TOKEN_ADDRESS "allowance(address,address)(uint256)" $DEMO_SAFE_SHARED_ADDRESS $DEFAULT_BLACKLISTED_SPENDER --rpc-url $BASE_SEPOLIA_RPC_URL
```

预期：

- allowance 回到 `0`

再看 ETH guard：

```bash
set -a && source .env && set +a
cast call $ETH_GUARD_ADDRESS "mode()(uint8)" --rpc-url $ETH_SEPOLIA_RPC_URL
```

预期：

- 返回 `1`，表示 `Shield`

## 13. 验证 `Shield` 拦截

在 ETH 仍处于 `Shield` 时，发一笔对陌生 spender 的 approval。  
预期是 Safe 会在执行阶段被 guard 拒绝。

```bash
set -a && source .env && set +a
node - <<'"'"'NODE'"'"'
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
NODE'
```

## 14. 验证 `Cron10` 恢复流程

先看当前订阅表：

```bash
curl -s https://lasna-rpc.rnk.dev/ \
  -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"rnk_getSubscribers\",\"params\":[\"$DEMO_SAFE_OWNER_ADDRESS\"],\"id\":1}"
```

在活跃 shield 期间，预期会看到：

- 一条 `chainId = 0`, `contract = 0x...fffFfF`, `topic0 = CRON10_TOPIC0`

然后等 shield 到期，再查：

```bash
set -a && source .env && set +a
cast call $ETH_GUARD_ADDRESS "mode()(uint8)" --rpc-url $ETH_SEPOLIA_RPC_URL
cast call $ETH_GUARD_ADDRESS "shieldUntilTick()(uint64)" --rpc-url $ETH_SEPOLIA_RPC_URL
```

预期：

- `mode = 0`
- `shieldUntilTick = 0`

再查订阅表，预期：

- `Cron10` 那条订阅消失

### 手动退出 Shield 兜底命令

如果你在测试时不想等待 `Cron10`，或者需要在调试时立刻把 `Shield Mode` 清掉，可以直接手动调用对应链上的 guard：

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

执行后可立即确认：

```bash
set -a && source .env && set +a
cast call $ETH_GUARD_ADDRESS "mode()(uint8)" --rpc-url $ETH_SEPOLIA_RPC_URL
cast call $ETH_GUARD_ADDRESS "shieldUntilTick()(uint64)" --rpc-url $ETH_SEPOLIA_RPC_URL
cast call $BASE_GUARD_ADDRESS "mode()(uint8)" --rpc-url $BASE_SEPOLIA_RPC_URL
cast call $BASE_GUARD_ADDRESS "shieldUntilTick()(uint64)" --rpc-url $BASE_SEPOLIA_RPC_URL
```

预期：

- `mode = 0`
- `shieldUntilTick = 0`

## 15. 验证 Ethereum -> Base 保护链路

目标：

- `Ethereum risk -> Ethereum revoke + Base shield`

发 ETH Safe 风险 approval：

```bash
set -a && source .env && set +a
node - <<'"'"'NODE'"'"'
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
NODE'
```

验证：

```bash
set -a && source .env && set +a
cast call $ETH_TOKEN_ADDRESS "allowance(address,address)(uint256)" $DEMO_SAFE_SHARED_ADDRESS $DEFAULT_BLACKLISTED_SPENDER --rpc-url $ETH_SEPOLIA_RPC_URL
```

```bash
set -a && source .env && set +a
cast call $BASE_GUARD_ADDRESS "mode()(uint8)" --rpc-url $BASE_SEPOLIA_RPC_URL
cast call $BASE_GUARD_ADDRESS "shieldUntilTick()(uint64)" --rpc-url $BASE_SEPOLIA_RPC_URL
```

## 16. 清理旧 RC（可选）

如果要替换主线 RC，先退掉旧 RC 的所有订阅，再部署新的。

```bash
set -a && source .env && set +a
TARGET_RC=0x旧RC地址 SENDER_PRIVATE_KEY=$DEMO_SAFE_OWNER_PRIVATE_KEY /bin/zsh script/UnsubscribeOldReactiveSubscriptions.sh
```

退完后可查：

```bash
curl -s https://lasna-rpc.rnk.dev/ \
  -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"rnk_getSubscribers\",\"params\":[\"$DEMO_SAFE_OWNER_ADDRESS\"],\"id\":1}"
```

## 17. 导出部署清单

如果要把地址同步给 Web：

```bash
set -a && source .env && set +a
forge script script/ExportDeploymentManifest.s.sol:ExportDeploymentManifest --rpc-url "$BASE_SEPOLIA_RPC_URL" --private-key "$BASE_SEPOLIA_PRIVATE_KEY"
```

或者手动更新：

- `.env`
- `web/.env.local`
- `deployments/nulla-demo.json`
- `deployments/hackathon-final-submit.md`

## 18. 说明与排障建议

- **Reactive 合约在 Lasna 上必须用 `forge create` 部署**
- **Reactive 合约至少预充 `3 REACT`**
- **模块和 callback 合约也要有目标链余额**
- **只在有活跃 shield 时订阅 `Cron10`**
- **到期后删除 `PendingShield`，不要只标记 inactive**
