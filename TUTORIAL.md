# Guardian MVP Tutorial

本教程用于从 0 开始部署并测试当前阶段的 Guardian MVP。

当前仓库只覆盖主流程：

`Safe 发出危险 Approval -> Lasna Listener 监听 -> 回调 Sepolia Controller -> Module 代 Safe 自动 approve(spender, 0)`

不包含前端，也不包含 `protocol risk -> sweep` 的实链演示。

## 1. 前置条件

- 已安装 Foundry
- 你有一个 `Ethereum Sepolia` 上的 Safe，且 owner 可签名
- 部署 EOA 同时有 `Sepolia ETH` 和 `Lasna lREACT`
- 建议使用本仓库根目录作为工作目录：`/Volumes/Remi/Nulla/Nulla`

## 2. 准备环境变量

先复制模板：

```bash
cp .env.example .env
```

然后填写 `.env` 里的必填项：

- `SEPOLIA_RPC_URL`
- `REACTIVE_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `SAFE_OWNER_PRIVATE_KEY`
- `SAFE_ADDRESS`
- `COLD_WALLET_ADDRESS`
- `ETHERSCAN_API_KEY`

以下值保持默认即可：

- `SEPOLIA_CHAIN_ID=11155111`
- `REACTIVE_CHAIN_ID=5318007`
- `SEPOLIA_CALLBACK_PROXY=0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA`
- `REACTIVE_SYSTEM_CONTRACT=0x0000000000000000000000000000000000fffFfF`

可选参数：

- `TOKEN_MAX_ALLOWANCE`，默认 `100 ether`
- `DANGEROUS_APPROVAL_AMOUNT`，默认 `1000 ether`

## 3. 先跑本地测试

```bash
forge fmt --check
forge build --sizes
forge test
```

预期结果：

- `forge build --sizes` 成功
- `forge test` 全部通过


## 4. 部署 Sepolia 合约

```bash
forge script script/DeploySepolia.s.sol:DeploySepoliaScript \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --broadcast \
  --verify \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  -vvvv
```

预期会打印 5 个地址：

- `GuardianController`
- `GuardianModule`
- `MockERC20`
- `MockBadSpender`
- `MockRiskEmitter`

把这 5 个地址写回 `.env`：

- `GUARDIAN_CONTROLLER_ADDRESS`
- `GUARDIAN_MODULE_ADDRESS`
- `MOCK_ERC20_ADDRESS`
- `MOCK_BAD_SPENDER_ADDRESS`
- `MOCK_RISK_EMITTER_ADDRESS`

## 5. 启用 Safe Module

```bash
forge script script/EnableModule.s.sol:EnableModule \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --broadcast \
  -vvvv
```

预期结果：

- Safe 成功执行 `enableModule(module)`
- 浏览器上 `Safe.isModuleEnabled(module)` 为 `true`

## 6. 部署 Lasna Listener

```bash
forge script script/DeployLasna.s.sol:DeployLasnaScript \
  --rpc-url "$REACTIVE_RPC_URL" \
  --broadcast \
  -vvvv
```

把输出的 `GuardianListener` 地址写回 `.env`：

- `GUARDIAN_LISTENER_ADDRESS`

## 7. 给回调链路充值

这一步不能省。

手动转账：

- 给 `GuardianController` 转至少 `0.01 Sepolia ETH`
- 给 `GuardianListener` 转至少 `5 lREACT`

预期结果：

- Controller 有足够 ETH 支付 callback debt
- Listener 有足够 lREACT 支付 Reactive 执行 debt

## 8. 注册策略并触发危险 Approval

```bash
forge script script/RegisterPolicyAndDemo.s.sol:RegisterPolicyAndDemo \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --broadcast \
  -vvvv
```

这个脚本会做两件事：

1. 让 Safe 调 `GuardianController.registerPolicy(...)`
2. 让 Safe 对 `MockBadSpender` 发出一次超限 `approve`

默认策略是：

- 受保护 token: `MOCK_ERC20_ADDRESS`
- 白名单 spender: 空
- `maxAllowance = 100 ether`
- 触发 approval: `1000 ether`

## 9. 预期的链上结果

如果流程正常，你应该看到：

1. Sepolia 上出现 `registerPolicy` 交易
2. Lasna 上出现由 `PolicyRegistered` 触发的 Reactive tx
3. Sepolia 上 Safe 发出危险 `Approval`
4. Lasna 上出现由危险 `Approval` 触发的 Reactive tx
5. Sepolia 上出现 callback proxy 发起的 destination tx
6. Safe 对坏 spender 的 allowance 最终回到 `0`

最关键的业务验收是：

- `MockERC20.allowance(SAFE_ADDRESS, MOCK_BAD_SPENDER_ADDRESS) == 0`

## 10. 如何手动验结果

最直接的看法：

- 在 Etherscan 看 `MockERC20` 的两次 `Approval`
- 第一次是危险额度，如 `1000 ether`
- 第二次是自动 revoke，额度应为 `0`

还应看到：

- `GuardianController.ApprovalAlertHandled(..., revoked = true)`
- `GuardianModule.ERC20Revoked(...)`

## 11. 如何拿到 Hackathon 需要的三类 tx hash

你至少需要记录：

- Origin tx: Safe 发出危险 approval 的 Sepolia tx
- Reactive tx: Lasna 上对该事件的 Reactive 执行 tx
- Destination tx: callback proxy 在 Sepolia 上调用 controller 的 tx

如果 `cast` 在本机崩溃，可直接用 `curl` 查询 Reactive RPC。

先查当前 VM：

```bash
curl -sS -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"rnk_getVm","params":["YOUR_DEPLOYER_ADDRESS"],"id":1}' \
  https://lasna-rpc.rnk.dev/
```

再按交易编号倒查最近的 Reactive tx：

```bash
curl -sS -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"rnk_getTransactionByNumber","params":["YOUR_DEPLOYER_ADDRESS","0x20"],"id":1}' \
  https://lasna-rpc.rnk.dev/
```

返回值里的：

- `hash` 是 Reactive tx hash
- `refTx` 是它对应的源链 tx hash

## 12. 当前仓库的参考成功结果

当前仓库已经用真实链路跑通两次，完整地址和哈希在 [DEPLOYMENTS.md](./DEPLOYMENTS.md)。

第一轮成功样例：

- Origin approval: `0x622dd9357dd7cf29454d02a33b788a29b549cf7304719fda41b6e9a966e6ae3a`
- Reactive tx: `0x1ac25938f1a4c1e518d3f6fb919648dbfa7e9744cef945bf84a3880c4c5788c7`
- Destination revoke tx: `0x8b24b0d90f6c0cc2d4b92f54c260fdcf98db7f3d0330f332f4475cb5e4e01532`

## 13. 常见失败点

- `safe transaction failed`
  说明 Safe owner 签名不匹配、nonce 不对，或 module 未启用

- 只看到危险 approval，看不到自动 revoke
  通常是 `GuardianController` 没有 ETH，或 `GuardianListener` 没有 lREACT

- allowance 没回到 `0`
  先检查 `registerPolicy` 是否成功，再检查 listener 是否部署自同一 EOA

- `forge test` 崩溃
  改用 `rtk forge test --offline`

## 14. 完成标准

这个阶段算通过，需要同时满足：

- 本地 `forge test --offline` 全绿
- Sepolia / Lasna 部署成功
- `registerPolicy` 成功
- 危险 approval 后 allowance 自动归零
- 你已经记录好 Origin / Reactive / Destination 三类 tx hash
