# Nulla Demo Evidence

## Active Mainline RC

- Reactive RC: `0x6573CfC1EA728bf44b9d0738642b055C6306267F`
- Deploy tx: `0x79677cde0bd1e93851e96f662562665b19903cb525f4c03e53e537f42b4d0c46`
- Funding at deploy: `3 REACT`
- Current status: active

## Final Fix Validation

This section reflects the latest repaired RC that:

- deletes `PendingShield` entries after exit
- subscribes to `Cron10` only while a shield is active

Validation run:

- Latest repaired owner-1 RC deploy tx: `0x79677cde0bd1e93851e96f662562665b19903cb525f4c03e53e537f42b4d0c46`
- Forward-path trigger on the repaired RC: `0x84cd69b0f325796d8924b7b547c2d95a1755830afd258cb2c357022b6cddf281`
- Forward-path Base revoke tx on the repaired RC: `0x5f8e68ecb94dc0ea4a052e10b800ae5fbddd287eaf773112d288eb9f03444b2e`
- Forward-path ETH shield tx on the repaired RC: `0xaddea82e772658b8621778268fd4323b11b7d423cca161cc4f05795408a62d7a`
- Manual ETH shield reset used to re-establish a clean starting point: `0x6cd01ec2fc8677195e42d36c4406b42b134626f69e29290e66273bb3be28b862`
- Final forward-path trigger after the latest redeploy: `0x84cd69b0f325796d8924b7b547c2d95a1755830afd258cb2c357022b6cddf281`
- Final forward-path Base revoke tx after the latest redeploy: `0x5f8e68ecb94dc0ea4a052e10b800ae5fbddd287eaf773112d288eb9f03444b2e`

Observed outcome on the repaired RC:

- Base allowance returned to `0`
- ETH guard entered `Shield`
- `Cron10` subscription appeared only during active shield
- after shield exit, `Cron10` is expected to disappear from the subscription list again

Storage cleanup validation:

- local Foundry regression tests confirm expired `PendingShield` entries are deleted with swap-pop
- no lingering `Cron10` subscription remains after exit

## Forward Path

Base risk -> Base revoke + Ethereum shield

- Base Safe approval tx: `0x9d3fee1fe3ad128a8db1c315d891dc8113a5f1aea7e64d8bb65279414d5f2a4c`
- Base module revoke tx: `0xf3a328d3b56c78e33f56bb910bd770b1f49562766dd033d3a201dbafbd9ce15d`
- Ethereum module shield tx: `0x8cf5226829b101182df6d3f407e6395f6c4e4e490daa15efd0385e4c7896ddf2`

Observed outcome:

- Base allowance to blacklisted spender returned to `0`
- Ethereum guard mode switched to `Shield`

## Shield Rejection

While Ethereum was in `Shield`, a new approval attempt to an unknown spender was rejected by the guard during Safe execution gas estimation.

- Target spender: `0x1111111111111111111111111111111111111111`
- Error: `ContractFunctionExecutionError`
- Revert surfaced during `execTransaction(...)` with guard rejection while `Shield` was active

## Cron Recovery

Ethereum shield automatically exited after `Cron10`.

- Ethereum shield exit tx: `0xc09df2fc76f2012ed5f53f38da308d83d96e9331d88a1fe408baf7d1db9f7287`

Observed outcome:

- Ethereum guard mode returned to `Monitor`
- Ethereum `shieldUntilTick` returned to `0`

## Reverse Path

Ethereum risk -> Ethereum revoke + Base shield

- Ethereum Safe approval tx: `0x36cff972f2073ab15cc95b52098f34d2e5cc514318e8f6fb8fce1378cb6e90b9`
- Ethereum module revoke tx: `0xca72a862f1a76e7d012667637b6af8c5bb5b6df805da7e7c7a763dc8d257ebc5`
- Base module shield tx: `0x0d2ebb41f298198d97c49374a4084fc2153bcc24c093dd1018cf099eb76e91ec`

Observed outcome:

- Ethereum allowance to blacklisted spender returned to `0`
- Base guard mode switched to `Shield`
- Base `shieldUntilTick`: `290585`

## Cleanup / Control

- Old RC subscriptions were removed from `0xb7DCF355171114Be6972Fe0C6b1d3e36657bb0d4`
- Old wallet-2 RC subscriptions were removed from `0xf201A43bcF816934ca84e84e09f3575237f80181`
- Previous wallet-1 RC subscriptions were removed from `0xd62380dcBa315b92E27d290d95Fc238D770171F4`
- Modules were re-pointed to wallet 2 RVM owner:
  - ETH module `setAllowedRvmId`: `0xf4151d87ada2f5fd2d11b3ff4e48e16350d04718399d8b966a746f3ac9d76924`
  - Base module `setAllowedRvmId`: `0x5238224415ae6732426f336d0da7ecee83bf2fba3f7d1af6e25042e5dc88b67e`
- Modules were later pointed back to wallet 1 RVM owner for the final repaired RC round
