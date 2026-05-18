# Cermin — Technical Blueprint

> **Cermin: The Bitcoin Shadow**
> Self-driving Bitcoin banking on Mezo. BTC stays untouched; the Shadow lives.

**Status**: Canonical spec (lean architecture)
**Audience**: Engineers, Smart Contract Developers
**Stack**: Solidity 0.8.24, Foundry, Mezo Matsnet/Testnet
**Hackathon**: Supernormal Foundation × Mezo

---

## 0. Design Philosophy

Cermin is **a thin orchestrator on top of Mezo's existing primitives**. Mezo already provides the trove, MUSD, Savings Vault, PriceFeed, and liquidations. Cermin only needs to:

1. Wrap one trove per user (proxy, because Mezo keys troves by address).
2. Automate two actions: skim (when BTC pumps) and defend (when BTC dumps).
3. Deliver a banking-grade UX.

Everything beyond that is feature creep for a hackathon.

### What lives on-chain

- **Per-user vault** via EIP-1167 (one trove per address is a Mezo constraint).
- **Permissionless defense** (anyone can trigger when ICR drops).
- **Two user-facing goals** — Forever Allowance and Spend-Now-Reclaim-Later — surfaced as labels in the UI; on-chain, they are the same vault with different `VaultParams`.

### What is explicitly NOT on-chain

| Not present | Why |
|-------------|-----|
| Singleton Guardian / Treasury contracts | `defend()` is just a public method on the vault; no fee surface needed at hackathon TVL. |
| StrategyEngine / Presets libraries | Math is inlined; presets are UX constants and live in the frontend. |
| `Mode` / `RiskLevel` / `DefenseStance` enums | Differentiation is via params, not code branches. |
| Strategy migration mid-trove | Close + reopen instead; removes mutation paths. |
| LLM agent debate / Reasoning log | Decisions are deterministic numerics; templated reason strings cover the UX. |
| Indexer (Ponder / The Graph) | `viem.getLogs()` against per-vault contracts is enough for MVP. |

---

## 1. Quick Reference

| Item | Value |
|------|-------|
| Mezo Borrow Rate | 1% fixed APR (locked at open) |
| Min MUSD Debt | 1,800 MUSD + 200 gas deposit = 2,000 MUSD total |
| Max LTV (Mezo) | 90% (ICR 111%) |
| Liquidation ICR | < 110% |
| Cermin emergency ICR floor | ≥ 115% |
| MUSD Savings APR | ~5% variable |
| Trove Model | One per address (CDP) |
| Custom contracts | 2 (Vault + Factory) |
| Off-chain services | 1 (cron-based agent, no LLM) |

---

## 2. Architecture

```
┌────────────────────────────────────────────────────┐
│  User Wallet (BTC or EVM, via Mezo Passport)       │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│  CerminFactory (singleton)                         │
│  - createVault(params) payable → CerminVault       │
│  - vaultOf(user) view                              │
└────────────────────────────────────────────────────┘
                    ↓ EIP-1167 clone
┌────────────────────────────────────────────────────┐
│  CerminVault (per user)                            │
│  - holds 1 Mezo trove                              │
│  - holds sMUSD shares                              │
│  - holds spendable MUSD balance                    │
│                                                    │
│  Owner-only:  deposit, withdrawSpendable, close    │
│  Permissionless: skim, defend                      │
│  View: getICR, getDebt, getCollateral, getShadow   │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│  Mezo Native Contracts                             │
│  BorrowerOperations · TroveManager · PriceFeed     │
│  MUSD (ERC20) · SavingsVault (ERC4626-ish)         │
└────────────────────────────────────────────────────┘
```

**Contract count: 2.** That is the entire on-chain surface for MVP.

### Why no Guardian contract

V1's Guardian was a singleton orchestrator that called `vault.defend()`. There is no functional benefit over making `defend()` directly public on the vault: the keeper bot just calls the vault. Removing Guardian removes one indirection, one deployment, one set of tests.

### Why no StrategyEngine library

Pure-math helpers (`computeSkimAmount`, `computeRepayAmount`) live as `internal pure` functions inside `CerminVault`. They are tiny, do not need to be shared, and do not justify a linked library.

`validate(params)` runs once during `initialize()`. Cheap, no need for a separate library.

### Why no Presets library

Presets are UX constants (Conservative/Balanced/Aggressive defaults). They live in the **frontend**, are passed to the factory as raw `VaultParams`. On-chain validation enforces bounds; the chain does not need to know preset names.

---

## 3. Data Structures

### VaultParams (5 fields, pack into one slot)

```solidity
struct VaultParams {
    uint16 targetLTV;         // e.g., 5000 = 50%
    uint16 defendICR;         // e.g., 14000 = 140% — defense triggers below this
    uint16 emergencyICR;      // e.g., 12000 = 120% — aggressive repay; must be ≥ 11500
    uint16 skimThresholdBps;  // e.g., 500 = require 5% BTC price increase to skim
    uint16 spendableShare;    // e.g., 5000 = 50% spendable, rest to sMUSD vault
}
```

That's 5 fields, ~10 bytes — single storage slot.

**Validation rules** (enforced in `initialize`):

```
targetLTV ≥ 1000 AND targetLTV ≤ 9000
defendICR > emergencyICR
emergencyICR ≥ 11500
skimThresholdBps ≥ 100 AND skimThresholdBps ≤ 5000
spendableShare ≤ 10000
defendICR + 1000 ≤ (10000 * 10000 / targetLTV)   // ≥10% buffer below the open-time ICR
```

### VaultState

```solidity
struct VaultState {
    uint256 lastSkimPrice;    // BTC/USD at last skim, 18 decimals
    uint256 spendableMusd;    // user-claimable MUSD held by the vault
    uint256 smusdShares;      // sMUSD shares held by the vault
    uint64  createdAt;
}
```

Trove debt and collateral are **read directly from Mezo** (single source of truth).

### Events

```solidity
event VaultOpened(address indexed owner, address indexed vault, VaultParams params);
event Skimmed(uint256 priceAtSkim, uint256 toSpendable, uint256 toVault, uint256 newDebt);
event Defended(uint256 icrBefore, uint256 icrAfter, uint256 repaid, uint256 fromVault, uint256 fromSpendable);
event SpendableWithdrawn(address indexed recipient, uint256 amount);
event Closed(uint256 btcReturned, uint256 musdRemainder);
```

Five events. Frontend's "Activity Feed" reads these via `viem.getLogs()`.

---

## 4. Vault Interface

```solidity
interface ICerminVault {
    // --- lifecycle ---
    function initialize(address owner, VaultParams calldata params) external;
    function open(uint256 maxBorrow, address upperHint, address lowerHint) external payable;
    function close(address upperHint, address lowerHint) external;

    // --- owner actions ---
    function deposit(address upperHint, address lowerHint) external payable;
    function withdrawSpendable(uint256 amount, address recipient) external;

    // --- permissionless automation ---
    function skim(address upperHint, address lowerHint) external;
    function defend(address upperHint, address lowerHint) external;

    // --- views ---
    function getICR() external view returns (uint256);
    function getDebt() external view returns (uint256);
    function getCollateral() external view returns (uint256);
    function getShadow() external view returns (uint256 spendable, uint256 vaultValue);
    function params() external view returns (VaultParams memory);
    function state() external view returns (VaultState memory);
    function owner() external view returns (address);
}
```

---

## 5. Workflows

### 5.1 Open

```
Factory.createVault(params){value: btcAmount}
  ├─ Clones.clone(vaultImpl) → newVault
  ├─ newVault.initialize(msg.sender, params)
  ├─ newVault.open{value: btcAmount}(maxBorrow, hints)
  │   ├─ borrowAmount = btcValue * targetLTV / 10000
  │   ├─ require borrowAmount ≥ MIN_DEBT (2000 MUSD)
  │   ├─ BorrowerOperations.openTrove{value: btcAmount}(borrowAmount, hints, ...)
  │   ├─ toSpendable = borrowAmount * spendableShare / 10000
  │   ├─ toVault    = borrowAmount - toSpendable
  │   ├─ MUSD.approve(savingsVault, toVault)
  │   ├─ smusdShares = SavingsVault.deposit(toVault, address(this))
  │   ├─ state.spendableMusd = toSpendable
  │   └─ state.lastSkimPrice = priceFeed.fetchPrice()
  ├─ vaultOf[msg.sender] = newVault
  └─ emit VaultOpened
```

### 5.2 Skim (permissionless)

```
vault.skim(hints)
  ├─ price = priceFeed.fetchPrice()
  ├─ require (price - lastSkimPrice) * 10000 / lastSkimPrice ≥ skimThresholdBps
  ├─ icr = troveManager.getCurrentICR(this, price)
  ├─ require icr ≥ minSkimICR()         // derived from targetLTV + buffer
  ├─ debt = troveManager.getTroveDebt(this)
  ├─ coll = troveManager.getTroveColl(this)
  ├─ maxBorrow = coll * price * targetLTV / (10000 * 1e18)
  ├─ newCapacity = maxBorrow > debt ? maxBorrow - debt : 0
  ├─ require newCapacity > 0
  ├─ BorrowerOperations.withdrawMUSD(0, newCapacity, hints)
  ├─ toSpendable = newCapacity * spendableShare / 10000
  ├─ toVault    = newCapacity - toSpendable
  ├─ state.spendableMusd += toSpendable
  ├─ state.smusdShares  += SavingsVault.deposit(toVault, address(this))
  ├─ state.lastSkimPrice = price
  └─ emit Skimmed
```

### 5.3 Defend (permissionless)

```
vault.defend(hints)
  ├─ price = priceFeed.fetchPrice()
  ├─ icr = troveManager.getCurrentICR(this, price)
  ├─ require icr < defendICR
  ├─ debt = troveManager.getTroveDebt(this)
  ├─ coll = troveManager.getTroveColl(this)
  ├─ targetICR = icr < emergencyICR ? defendICR + 2000 : defendICR
  ├─ targetDebt = coll * price * 10000 / (targetICR * 1e18)
  ├─ needRepay = debt > targetDebt ? debt - targetDebt : 0
  ├─ require needRepay > 0
  │
  ├─ // Drain sources: vault first, spendable as fallback
  ├─ vaultValue = SavingsVault.convertToAssets(state.smusdShares)
  ├─ fromVault     = min(needRepay, vaultValue)
  ├─ fromSpendable = needRepay - fromVault   // 0 unless vault drained
  ├─ require fromSpendable ≤ state.spendableMusd
  │
  ├─ if fromVault > 0:
  │   sharesToRedeem = SavingsVault.convertToShares(fromVault)
  │   SavingsVault.redeem(sharesToRedeem, address(this), address(this))
  │   state.smusdShares -= sharesToRedeem
  │
  ├─ if fromSpendable > 0:
  │   state.spendableMusd -= fromSpendable
  │
  ├─ MUSD.approve(borrowerOperations, needRepay)
  ├─ BorrowerOperations.repayMUSD(needRepay, hints)
  ├─ icrAfter = troveManager.getCurrentICR(this, price)
  └─ emit Defended(icr, icrAfter, needRepay, fromVault, fromSpendable)
```

**Note**: defense behavior is fixed (vault → spendable). The DefenseStance enum from V1 is dropped. Re-add later if there is a real user need.

### 5.4 WithdrawSpendable (owner)

```
vault.withdrawSpendable(amount, recipient)
  ├─ require msg.sender == owner
  ├─ require amount ≤ state.spendableMusd
  ├─ state.spendableMusd -= amount
  ├─ MUSD.safeTransfer(recipient, amount)
  └─ emit SpendableWithdrawn
```

### 5.5 Close (owner)

```
vault.close(hints)
  ├─ require msg.sender == owner
  ├─ // 1. Liquidate sMUSD position
  ├─ if state.smusdShares > 0:
  │   musdFromVault = SavingsVault.redeem(state.smusdShares, address(this), address(this))
  │   state.smusdShares = 0
  ├─ totalMusd = state.spendableMusd + musdFromVault
  ├─ debt = troveManager.getTroveDebt(this)
  ├─ require totalMusd ≥ debt   // otherwise revert; user tops up first
  ├─ MUSD.approve(borrowerOperations, debt)
  ├─ BorrowerOperations.closeTrove()    // returns BTC and consumes debt
  ├─ remainder = totalMusd - debt
  ├─ if remainder > 0: MUSD.safeTransfer(owner, remainder)
  ├─ payable(owner).sendValue(address(this).balance)   // BTC back
  └─ emit Closed
```

There is no migration path. To change params, close and reopen.

---

## 6. Frontend Presets (Off-Chain Constants)

These are TypeScript constants in the frontend, passed as `VaultParams` to the factory:

```ts
export const PRESETS = {
  conservative: {
    targetLTV: 4000,
    defendICR: 17000,
    emergencyICR: 14000,
    skimThresholdBps: 800,
    spendableShare: 3000,   // 30% spendable, 70% vault — leans toward income/protection
  },
  balanced: {
    targetLTV: 5000,
    defendICR: 14000,
    emergencyICR: 12000,
    skimThresholdBps: 500,
    spendableShare: 5000,
  },
  aggressive: {
    targetLTV: 7000,
    defendICR: 12500,
    emergencyICR: 11800,
    skimThresholdBps: 300,
    spendableShare: 7000,
  },
};
```

Two user-facing modes (Forever Allowance vs Spend-Now-Reclaim-Later) are surfaced as **labels** in the UI; both map onto the same `VaultParams`. The product difference is communication, not contract logic.

---

## 7. Off-Chain Agent (Single Service, ~200 LOC)

### 7.1 Responsibilities

1. Poll Mezo PriceFeed and all known vaults every N minutes.
2. For each vault:
   - If `getICR() < defendICR` → call `vault.defend()`
   - Else if `(price - lastSkimPrice) ≥ skimThresholdBps` AND `getICR() ≥ minSkimICR` → call `vault.skim()`
3. Compute SortedTroves hints inline before submitting transactions.
4. Log each action to SQLite (or Redis) with a templated reason string.

That is the entire decision logic. Deterministic. No LLM, no debate, no agent personas.

### 7.2 Why no LLM agents

The decision is `if (icr < threshold) defend()`. It is deterministic numerics. Wrapping it in a 4-agent LLM debate adds:
- Cost (Claude calls × N vaults × 4 agents per cycle)
- Latency (seconds per decision vs milliseconds)
- Failure modes (API down, hallucinations, JSON parse errors)
- Zero judgment value

The "Why panel" UX is preserved with templated strings:
> *"BTC dropped to $87,200. ICR fell to 132%, below your defend threshold of 140%. Repaid 850 MUSD from the vault. New ICR: 148%."*

This is shown to the user, sounds intelligent, costs nothing extra.

If multi-agent reasoning becomes a real product hook later, it can be added as a parallel "explanation" layer without changing the execution path.

### 7.3 Stack

```
Node.js 20+, TypeScript 5.4+
viem 2.x (no ethers)
SQLite (better-sqlite3) for action log
node-cron or simple setInterval
pino for structured logging
```

No Postgres, no BullMQ, no @anthropic-ai/sdk for MVP.

### 7.4 Deployment

Vercel Cron (free, 10-min interval) for the hackathon. Migrate to Railway only if sub-minute reaction becomes necessary post-launch.

### 7.5 Hint generation

Inline utility under `agent/src/hints/`. Reads SortedTroves on-chain, walks the linked list, returns `(upperHint, lowerHint)`. No separate service.

---

## 8. Frontend (Next.js 14)

### 8.1 Onboarding (3 steps, < 45s)

1. **Connect** — Mezo Passport (BTC wallet or EVM wallet).
2. **Configure** — Pick mode label (Forever Allowance / Spend Now), pick risk preset (Conservative / Balanced / Aggressive), enter BTC amount. Live preview: estimated monthly Shadow income, BTC price drop tolerated.
3. **Confirm** — single signature, factory creates the vault.

Custom mode is a stretch goal. For MVP, three presets cover 95% of users.

### 8.2 Dashboard

- BTC balance (locked, with reassurance copy: "untouched")
- Shadow MUSD (spendable + sMUSD vault value)
- ICR gauge
- Activity feed via `viem.getLogs()` against the user's vault
- Single "Withdraw" button

### 8.3 Stack

```
Next.js 14 (App Router)
@mezo-org/passport + RainbowKit
wagmi v2 + viem v2
@tanstack/react-query v5
Tailwind 3.4 + shadcn/ui
```

No indexer. No Ponder. No The Graph.

---

## 9. Security

### 9.1 Threat Model (focused)

| Threat | Mitigation |
|--------|------------|
| Liquidation race | Permissionless `defend()`; agent runs frequently; emergency floor at 115% ICR |
| Reentrancy | `ReentrancyGuard` on every state-changing external function |
| Unauthorized owner actions | `onlyOwner` modifier; owner is fixed at `initialize()` and never changes |
| Bad params | `validate()` in `initialize()` enforces bounds |
| Slippage on sMUSD redeem | Compute `assetsOut` against expected; revert if delta > tolerance |
| Implementation hijack via direct call | `initialize()` callable once; storage-level flag; `_disableInitializers()` in implementation constructor |
| Price oracle manipulation | Trust Mezo PriceFeed (their security boundary); no secondary oracle in MVP |

### 9.2 Audits

Same plan as V1: internal review → external (Trail of Bits / Spearbit / Cantina) → Immunefi bug bounty.

Audit scope is now **2 contracts** instead of 6 — significantly cheaper and faster.

### 9.3 Upgradeability

None. New version = new factory + new implementation. Users opt in.

---

## 10. Repository Structure (Updated)

```
cermin/
├── contracts/
│   ├── src/
│   │   ├── interfaces/
│   │   │   ├── ICerminVault.sol
│   │   │   ├── ICerminFactory.sol
│   │   │   └── mezo/
│   │   │       ├── IBorrowerOperations.sol
│   │   │       ├── ITroveManager.sol
│   │   │       ├── IPriceFeed.sol
│   │   │       ├── IMUSD.sol
│   │   │       ├── ISavingsVault.sol
│   │   │       └── ISortedTroves.sol
│   │   ├── CerminVault.sol
│   │   └── CerminFactory.sol
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fork/
│   ├── script/Deploy.s.sol
│   └── foundry.toml
│
├── agent/
│   └── src/
│       ├── hints/
│       ├── monitor.ts
│       ├── executor.ts
│       └── index.ts          # cron entry
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/presets.ts
│
├── README.md
├── BLUEPRINT_V2.md           # this file
├── Blueprint .md             # V1 (kept for reference)
└── CLAUDE.md
```

Notable absences: no `libraries/` folder, no Guardian or Treasury contracts, no `invariant/` test folder (P2 — restore if time permits).

---

## 11. Roadmap (Compressed)

### Week 1 — Contracts
- [ ] `ICerminVault`, `ICerminFactory`, Mezo interfaces vendored
- [ ] `CerminVault` implementation + unit tests
- [ ] `CerminFactory` + unit tests
- [ ] Fuzz tests for `validate()` and skim/defend math
- [ ] Mezo testnet deployment script

### Week 2 — Integration
- [ ] Fork tests against Mezo testnet (open → skim → defend → close)
- [ ] Agent service: monitor + executor + hints
- [ ] Cron loop on Vercel
- [ ] Action log persistence

### Week 3 — Frontend & Demo
- [ ] Onboarding flow (3 steps)
- [ ] Dashboard with ICR gauge + activity feed
- [ ] Demo video (3 min)
- [ ] Pitch deck + KYB submission

3 weeks total.

---

## 12. Open Questions

1. Confirm MUSD Savings Vault address on Mezo testnet at deploy time.
2. Confirm Mezo SortedTroves ABI matches Liquity's reference (for hint walking).
3. Should `close()` accept partial-repay top-up via `msg.value`-style MUSD transfer in the same tx? (Defer; user can `transfer` first.)
4. Defense reward (small MUSD for the keeper that calls `defend()`) — defer to post-MVP.

---

## 13. References

### Mezo
- Docs: https://mezo.org/docs/developers/
- MUSD repo: https://github.com/mezo-org/musd
- BorrowerOperations: https://github.com/mezo-org/musd/blob/main/solidity/contracts/BorrowerOperations.sol
- Faucet: https://faucet.test.mezo.org/
- Explorer: https://explorer.test.mezo.org/

### Standards
- OpenZeppelin v5: https://docs.openzeppelin.com/contracts/5.x/
- EIP-1167: https://eips.ethereum.org/EIPS/eip-1167
- Foundry Book: https://book.getfoundry.sh/

### Inspirations
- Liquity (CDP, sorted troves): https://docs.liquity.org/

---

**End of Blueprint**

> "Your BTC stays whole. The Shadow is what you live on."
