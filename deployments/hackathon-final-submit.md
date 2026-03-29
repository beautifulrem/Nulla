# Nulla Hackathon Final Submission

## Demo identities

- Shared Safe: `0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0`
  - Role: the same Safe address on Ethereum Sepolia and Base Sepolia
- Safe owner / demo operator: `0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4`
  - Role: owner of the Safe and demo execution account
- Risk spender: `0x301E4F2bA24b4C009BfDCc5F7F192f6A0f9C8e8d`
  - Role: blacklisted spender used to trigger the approval firewall
- Active Reactive contract on Lasna: `0x6573CfC1EA728bf44b9d0738642b055C6306267F`
  - Role: single cross-chain Reactive policy engine
- Demo profile id: `0xe5fd559fcb5fd437c4efdfabfe7138e5ef4a92912bf3c7c2d170292cf5e322c9`

## Contracts used in the final demo

### Ethereum Sepolia

- `0x0f5D9349D974f47fDfcCc358bA1331be9bf63adA`
  - Contract: `MockUSDC`
  - Role: demo ERC20 token for risky approvals on Ethereum Sepolia
- `0x384f950fBfaB4F13f0C1Cb62F2054Ac860b067A6`
  - Contract: `NullaSubscriptionService`
  - Role: emits `Subscribe(address)` / `Unsubscribe(address)` control events for the Reactive layer
- `0x05857fB0fa1A618D22C31840C30a9c8c8ae36985`
  - Contract: `ShieldGuard`
  - Role: Ethereum Safe guard that blocks risky approvals while Shield Mode is active
- `0x0596181cE909e017088Ead03AE7273Baba41Df71`
  - Contract: `ApprovalFirewallModule`
  - Role: Ethereum callback receiver + Safe module for revoke / shield / exit-shield actions
- `0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA`
  - Contract: callback proxy
  - Role: destination-chain callback payment / debt accounting and callback entrypoint

### Base Sepolia

- `0x384f950fBfaB4F13f0C1Cb62F2054Ac860b067A6`
  - Contract: `MockUSDC`
  - Role: demo ERC20 token for risky approvals on Base Sepolia
- `0x05857fB0fa1A618D22C31840C30a9c8c8ae36985`
  - Contract: `NullaRegistry`
  - Role: registry of the demo profile and component addresses
- `0x0596181cE909e017088Ead03AE7273Baba41Df71`
  - Contract: `NullaSubscriptionService`
  - Role: emits `Subscribe(address)` / `Unsubscribe(address)` control events for the Reactive layer
- `0xFEeDBD67B96123A59c019722cac2D85029c45770`
  - Contract: `ShieldGuard`
  - Role: Base Safe guard that blocks risky approvals while Shield Mode is active
- `0x214Ef1D4BBb4F992b512AD65A929620C0Ba4705c`
  - Contract: `ApprovalFirewallModule`
  - Role: Base callback receiver + Safe module for revoke / shield / exit-shield actions
- `0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6`
  - Contract: callback proxy
  - Role: destination-chain callback payment / debt accounting and callback entrypoint

### Reactive Lasna

- `0x6573CfC1EA728bf44b9d0738642b055C6306267F`
  - Contract: `ReactiveCrossChainFirewall`
  - Role:
    - watches approval risk across Ethereum Sepolia and Base Sepolia
    - revokes the source-chain approval
    - pushes the peer chain into Shield Mode
    - supports manual Shield exit
    - supports automatic Shield exit after the recovery window

## Destination module funding check

### Before top-up

- Ethereum module balance: `0.009987817650457197 ETH`
- Ethereum module debt: `0`
- Base module balance: `0.009931683581200000 ETH`
- Base module debt: `0`

### Top-up transactions

- Ethereum module +0.1 ETH:
  - Tx hash: `0x54254531576c37b7a4edfc2452b2ef28dc0414b82020a140eb8e6931213a8561`
  - Shows: direct funding of the Ethereum destination callback/module contract
- Base module +0.1 ETH:
  - Tx hash: `0xe9568f7118f16d0ceaa90a241323a16fd66e0a1cb7f7c3e2ea02408b362ddbdd`
  - Shows: direct funding of the Base destination callback/module contract

### After top-up

- Ethereum module balance: `0.109987817650457197 ETH`
- Ethereum module debt: `0`
- Base module balance: `0.109931683581200000 ETH`
- Base module debt: `0`

## Demo run 1

### Base Sepolia risk -> Base revoke -> Ethereum Shield -> manual Shield exit

#### Origin

- Base risky approval:
  - Tx hash: `0xa2fbe10030e6569a81dca46fc465a2d938ce9e23ba950a95fe922d333a6d9e5d`
  - Shows: the shared Safe approved the blacklisted spender on Base Sepolia

#### Reactive

- Lasna reactive processing:
  - Tx hash: `0x5ec4e40b1eb1a8143dea4dc64bc1542958edf3ec9d70ee06f82fd94f339a7269`
  - Shows: the active Reactive contract on Lasna processed the Base risky approval and started the cross-chain response

#### Destination

- Base source-chain revoke:
  - Tx hash: `0x425d1b9ef07a5df0368aacf11b45053bc430556d955b43905166176557bec88b`
  - Shows: the Base module revoked the risky approval back to zero
- Ethereum peer-chain Shield entry:
  - Tx hash: `0xb29622e0a1f5d216f391e17880ea11296713763210f0e7c9cdcd4355ca5c397b`
  - Shows: the Ethereum module entered Shield Mode in response to the Base risk
- Ethereum manual Shield exit:
  - Tx hash: `0x7e3dbe6ae88d9bff6d3ef32ea6ffd8b6d7e9505e2b0f58247282e637b01736bd`
  - Shows: the operator manually exited Ethereum Shield Mode after verifying the incident was safe to clear

### Final observed result for run 1

- Base approval was revoked
- Ethereum entered Shield Mode
- Ethereum was manually returned to Monitor Mode
- End state after run 1: both chains back in `Monitor`

## Demo run 2

### Ethereum Sepolia risk -> Ethereum revoke -> Base Shield -> automatic Shield exit

#### Origin

- Ethereum risky approval:
  - Tx hash: `0x22b133e84345c5e291ec57f89f3f4d38851a62ad90d8013567e5c45bb02cc5ce`
  - Shows: the shared Safe approved the blacklisted spender on Ethereum Sepolia

#### Reactive

- Lasna reactive processing:
  - Tx hash: `0x2c82c55914c22eb9f00708bff55efcf0145e01f8f1e9012f8a22c84480722309`
  - Shows: the active Reactive contract on Lasna processed the Ethereum risky approval and started the cross-chain response

#### Destination

- Ethereum source-chain revoke:
  - Tx hash: `0xb5cf5e2de1e12fbb97188614b633bbce046f008bc216b48ec8ef0660f996ea44`
  - Shows: the Ethereum module revoked the risky approval back to zero
- Base peer-chain Shield entry:
  - Tx hash: `0x75f6a3d35116f0b5413248284a3002496a04baebfd32046c4b4231a65292681c`
  - Shows: the Base module entered Shield Mode in response to the Ethereum risk
- Base automatic Shield exit:
  - Tx hash: `0x6c338cbab7f745c49796cc4b366ea069071a640ca59dd3a394b4b679368489e0`
  - Shows: the Base module automatically exited Shield Mode after the Lasna recovery window elapsed

### Automatic recovery confirmation

- At `2026-03-29 02:56:03 UTC`
  - Lasna tick observed: `291184`
  - Base guard mode observed on-chain: `0` (`Monitor`)
  - Base `shieldUntilTick`: `0`

### Final observed result for run 2

- Ethereum approval was revoked
- Base entered Shield Mode
- Base automatically returned to Monitor Mode after the recovery window
- End state after run 2: both chains back in `Monitor`

## Final submission hashes

### Funding

- `0x54254531576c37b7a4edfc2452b2ef28dc0414b82020a140eb8e6931213a8561` — fund Ethereum module
- `0xe9568f7118f16d0ceaa90a241323a16fd66e0a1cb7f7c3e2ea02408b362ddbdd` — fund Base module

### Run 1

- Origin:
  - `0xa2fbe10030e6569a81dca46fc465a2d938ce9e23ba950a95fe922d333a6d9e5d` — Base risky approval
- Reactive:
  - `0x5ec4e40b1eb1a8143dea4dc64bc1542958edf3ec9d70ee06f82fd94f339a7269` — Lasna reactive processing for the Base risk
- Destination:
  - `0x425d1b9ef07a5df0368aacf11b45053bc430556d955b43905166176557bec88b` — Base revoke
  - `0xb29622e0a1f5d216f391e17880ea11296713763210f0e7c9cdcd4355ca5c397b` — Ethereum Shield entered
  - `0x7e3dbe6ae88d9bff6d3ef32ea6ffd8b6d7e9505e2b0f58247282e637b01736bd` — Ethereum manual Shield exit

### Run 2

- Origin:
  - `0x22b133e84345c5e291ec57f89f3f4d38851a62ad90d8013567e5c45bb02cc5ce` — Ethereum risky approval
- Reactive:
  - `0x2c82c55914c22eb9f00708bff55efcf0145e01f8f1e9012f8a22c84480722309` — Lasna reactive processing for the Ethereum risk
- Destination:
  - `0xb5cf5e2de1e12fbb97188614b633bbce046f008bc216b48ec8ef0660f996ea44` — Ethereum revoke
  - `0x75f6a3d35116f0b5413248284a3002496a04baebfd32046c4b4231a65292681c` — Base Shield entered
  - `0x6c338cbab7f745c49796cc4b366ea069071a640ca59dd3a394b4b679368489e0` — Base automatic Shield exit
