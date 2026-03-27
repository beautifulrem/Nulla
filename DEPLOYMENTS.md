# Deployments

## Ethereum Sepolia

- `Safe`: `0x6a8C0FE4aDaA46A74B1073cE1dA642d00F851B2B`
- `GuardianController`: `0xd59d2a72291C9950a9085BDC67127CbAF1B2B27C`
- `GuardianModule`: `0x9B1A205ac367F084ec4230BA2fe747a93FAEf25F`
- `MockERC20`: `0xE75015C715feFd2496b501ceE25737415dAF5A99`
- `MockBadSpender`: `0x1Afdeb456D502Cc0Ec998E73002e193122Af60Dc`
- `MockRiskEmitter`: `0xe9493282D7F6E3DbAf4D7D8CccA45541a8540197`

## Reactive Lasna

- `GuardianListener`: `0x4707297cd75bF1d87288D6f282Bb5Cf3D29dCBb8`

## Transaction Hashes

### Rehearsal 1: Fresh Deployment + Auto Revoke

Sepolia deployment and setup:

- Deploy controller: `0x703fd87ddd835a2b8ffaf78b9931e1766a6142728befe6b52abea4a9f8d38de0`
- Deploy module: `0xa1b1b7246fe7e36cbfd393d870c9bc2598c5b7f8b1ce3dfe639d2746eb02280c`
- Deploy mock token: `0x35d89770f004d464f04290c826ebc629fde5825f0c3a42b8aae5abc3729b8af1`
- Deploy mock spender: `0x19822d5c50ae1f242089d450b19df036d82f6eddd97a1f1d92f41e09e27349b3`
- Deploy mock risk emitter: `0x415787e08a82d583f7620ac0136381bb2faf15b46c4c4b3473ff8372cd157fe4`
- Fund controller: `0x655683532822f0ad221070819ac6d2de655533b9f8f32c1e7934125bafd89890`
- Enable module on Safe: `0x575cd62896ac8052a66ff7d418baf65d8bdcb0c4a8219f27cf88311d0a20ca7d`
- Register policy: `0xbefa7083646af0c68eca2e1cded500ebcf8998a9b77fd80700589d5179a514fa`
- Dangerous approval: `0x622dd9357dd7cf29454d02a33b788a29b549cf7304719fda41b6e9a966e6ae3a`
- Destination callback + revoke: `0x8b24b0d90f6c0cc2d4b92f54c260fdcf98db7f3d0330f332f4475cb5e4e01532`

Lasna:

- Deploy listener: `0x01b25f81228ce1b0cca93877fb7ca1259322294eb2613586f25b67fb1f19d678`
- Fund listener: `0xf04d1904b0405d0af394371886e038a7e69ce041fbcce5073015fc988ad8fc0b`
- Reactive tx for `PolicyRegistered`: `0xc5cd80d9c46df62d6fe0224cef6fa43f3126e77f5bcae6484cf34596ad642376`
- Reactive tx for dangerous `Approval`: `0x1ac25938f1a4c1e518d3f6fb919648dbfa7e9744cef945bf84a3880c4c5788c7`
- Reactive echo tx for `approve(spender, 0)`: `0x8f47bd1af765a5e68ba6c1c52ed4d7b9c0380865620300e8e4c377d1a3685d10`

Outcome:

- `allowance(Safe, badSpender) == 0`
- The echo tx above proves the `Approval(..., 0)` feedback path exists; `GuardianController` ignored it as designed.

### Rehearsal 2: Recovery / Repeat Trigger On Same Deployment

Sepolia:

- Cover controller debt: `0x6daaa2afeca5eb3ee634ec59e1dcaf02f06935a8d960259e6e3e762c2b6743e6`
- Register policy retry: `0xd168594866260401a7067b4c5cdd1121c6074158c058cdc33466f0f3bb757cdf`
- Dangerous approval retry: `0x22b086dd7567bb27d49e118f14295f1fe8ba9fcb52e316b2b0bde0da018f0635`
- Destination callback + revoke retry: `0x53c3f73115186f5c40c91e684e9952e2decc488e4bea537872d31ba9a3fb661b`

Lasna:

- Cover listener debt: `0xeeae90b997fb9c5ea6a72bf865e62b268381e71cc08d75005185fd2796fb0336`
- Reactive tx for `PolicyRegistered` retry: `0xf0d13c08974af83f170355e264f2ba1e4925973eee95125422d051b949ce78d1`
- Reactive tx for dangerous `Approval` retry: `0x099ab15aabc870b63fd7591e8c5bab7ef082ab0821fccb3f7609a8ff876d6bc4`
- Reactive echo tx for retry `approve(spender, 0)`: `0x00487498aad411c4700944af952a2788147005ae67baafcde21bb0e3ff4b28ea`

Outcome:

- `allowance(Safe, badSpender) == 0` after the second run as well.
