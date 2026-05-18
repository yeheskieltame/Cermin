# CLAUDE.md — Cermin Development Guide

> **Read this first before writing any code.**

This file is the operating manual for Claude Code (or any AI agent) working on the Cermin codebase. It encodes project context, conventions, constraints, and the order of operations to follow.

---

## Project Identity

- **Name**: Cermin
- **Tagline**: "Your BTC stays whole. The Shadow is what you live on."
- **One-liner**: Self-driving Bitcoin banking on Mezo. Users deposit BTC; Cermin handles borrow management, vault deployment, peak skimming, and liquidation defense automatically.
- **Hackathon**: Supernormal Foundation × Mezo (global hackathon — all documentation in English)
- **Product framing**: a consumer banking app sitting on top of Mezo primitives. NOT a DeFi protocol design exercise. Mezo provides the trove, MUSD, Savings Vault, PriceFeed, and liquidations — Cermin only orchestrates two actions (skim, defend) and delivers UX.

---

## Required Reading Order

Before writing any code, read in order:

1. `README.md` — user-facing intro, mental model
2. `BLUEPRINT.md` — full technical specification (the source of truth)
3. This file (`CLAUDE.md`) — conventions and execution rules
4. Mezo developer docs: https://mezo.org/docs/developers/
5. Mezo MUSD source: https://github.com/mezo-org/musd

If `BLUEPRINT.md` and this file conflict, `BLUEPRINT.md` wins. If both are unclear, ASK before guessing.

---

## Critical External Resources

### Mezo Protocol
- Main docs: https://mezo.org/docs/developers/
- MUSD architecture: https://mezo.org/docs/users/musd/architecture-and-terminology/
- MUSD repo: https://github.com/mezo-org/musd
- BorrowerOperations: https://github.com/mezo-org/musd/blob/main/solidity/contracts/BorrowerOperations.sol
- MUSD token: Mainnet `0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186`, Testnet `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`
- Faucet: https://faucet.test.mezo.org/
- Explorer: https://explorer.test.mezo.org/

### Standards & Tooling
- Foundry Book: https://book.getfoundry.sh/
- OpenZeppelin Contracts v5: https://docs.openzeppelin.com/contracts/5.x/
- EIP-1167 Minimal Proxy: https://eips.ethereum.org/EIPS/eip-1167
- Solidity 0.8.24: https://docs.soliditylang.org/en/v0.8.24/
- viem: https://viem.sh/
- wagmi v2: https://wagmi.sh/
- RainbowKit: https://www.rainbowkit.com/

### Inspirations
- Liquity (CDP, sorted troves): https://docs.liquity.org/

---

## Tech Stack — Strict Versions

### Smart Contracts
```
Solidity:           0.8.24
Foundry:            latest stable
OpenZeppelin:       v5.x
forge-std:          latest
```

### Off-Chain Agent
```
Node.js:            20.x LTS
TypeScript:         5.4+
viem:               2.x
SQLite:             better-sqlite3 (action log only)
scheduling:         setInterval / Vercel Cron
```

**No LLM, no Anthropic SDK, no Postgres, no BullMQ, no separate indexer.** The agent is a deterministic ~200 LOC service.

### Frontend
```
Next.js:            14 (App Router)
React:              18
@rainbow-me/rainbowkit: latest
wagmi:              v2
viem:               v2
@tanstack/react-query: v5
Tailwind:           3.4+
```

---

## Repository Structure

```
cermin/
├── contracts/                     # Foundry workspace
│   ├── src/
│   │   ├── interfaces/
│   │   │   ├── ICerminVault.sol         # types + interface
│   │   │   ├── ICerminFactory.sol
│   │   │   └── mezo/
│   │   │       ├── IBorrowerOperations.sol
│   │   │       ├── ITroveManager.sol
│   │   │       ├── IPriceFeed.sol
│   │   │       ├── IMUSD.sol
│   │   │       ├── ISavingsVault.sol
│   │   │       └── ISortedTroves.sol
│   │   ├── CerminVault.sol              # per-user CDP wrapper
│   │   └── CerminFactory.sol            # clones one vault per user
│   ├── test/
│   │   ├── unit/                        # parameter validation
│   │   ├── integration/                 # full flows w/ mocks
│   │   └── mocks/                       # Mezo + MUSD + sMUSD mocks
│   ├── script/Deploy.s.sol
│   └── foundry.toml
│
├── agent/                         # single deterministic service
│   ├── src/
│   │   ├── abis/                        # CerminFactory, CerminVault, PriceFeed, SavingsVault
│   │   ├── monitors/                    # price + vault snapshot
│   │   ├── executors/                   # skim, defend
│   │   ├── hints/                       # SortedTroves hint helper
│   │   ├── storage/actionLog.ts         # SQLite log of decisions
│   │   ├── chain.ts
│   │   ├── config.ts
│   │   ├── types.ts
│   │   └── index.ts                     # cron entrypoint
│   └── package.json
│
├── frontend/                      # Next.js 14
│   ├── src/
│   │   ├── app/                         # / · /onboard · /dashboard
│   │   ├── components/                  # dashboard cards + onboarding wizard
│   │   ├── hooks/                       # useVault · useVaultActions · useBtcPrice
│   │   └── lib/                         # presets · contracts · simulation · utils
│   └── package.json
│
├── README.md
├── BLUEPRINT.md
└── CLAUDE.md
```

The on-chain surface is **two contracts**: `CerminVault` (cloned per user) and `CerminFactory` (singleton). Anything more is feature creep.

---

## Solidity Conventions

1. **Pragma**: `pragma solidity 0.8.24;` exactly (no caret).
2. **License**: SPDX header on every file: `// SPDX-License-Identifier: MIT`.
3. **Naming**:
   - Contracts: `PascalCase` · Interfaces: `IPascalCase` · Functions/vars: `camelCase` · Constants: `UPPER_SNAKE_CASE` · Immutables: `UPPER_SNAKE_CASE` (e.g., `BORROWER_OPS`).
4. **Visibility**: explicit on every function.
5. **Custom errors** instead of `require(..., "string")`.
6. **NatSpec** on external/public functions and events.
7. **Imports**: explicit named imports only.
8. **Comments**: English only. Skip comments that just restate the code.

### Mandatory security patterns
- ReentrancyGuard on every state-changing external function.
- `SafeERC20` for ERC20 calls.
- Checks-Effects-Interactions, strictly.
- No `tx.origin`. No `block.timestamp` for security decisions.
- Bounds checking on user inputs (handled by `_validateParams` in `initialize`).
- Implementation contract must mark `_initialized = true` in its constructor so it cannot be initialized.

### Foundry config
- `solc_version = "0.8.24"` · `optimizer_runs = 200` · `via_ir = true`.

### Gas patterns
- `immutable` for one-time deploy values (Mezo addresses).
- Pack structs (`VaultParams` already fits a single 256-bit slot).
- Cache storage reads in loops; use `calldata` for read-only args.

---

## TypeScript Conventions (agent + frontend)

1. `strict: true`. No `any` without justification.
2. ES modules only, named imports preferred.
3. `async/await`, no raw Promises in business logic.
4. Typed errors. Structured logging via pino.
5. Schema-validate external inputs with zod.
6. Use viem; no ethers.

---

## Architectural Constraints (DO NOT VIOLATE)

### Mezo constraints
1. **One trove per address** → Cermin uses one EIP-1167 clone per user.
2. **Min debt 1,800 MUSD + 200 MUSD gas deposit = 2,000 MUSD** → Cermin enforces ≥ 2,000 MUSD on `open`.
3. **Max LTV 90% (Mezo cap)** → `targetLTV` validation caps at 9000 bps.
4. **Liquidation at ICR < 110%** → `emergencyICR ≥ 11500`. `defendICR` must sit below the open-time ICR with a 1000 bps buffer.
5. **Hint generation** required for `openTrove` / `adjustTrove`. The off-chain agent computes hints; the contracts accept them as args.
6. **BTC as gas** → users keep a small BTC buffer.
7. **Borrow rate locked at open** at 1% APR. No native refinance.

### Cermin design constraints
1. Implementation contracts are NON-UPGRADEABLE. New version = new factory + new implementation.
2. `VaultParams` is the source of behavior diversity — never hardcode strategy in contracts.
3. `defend()` is permissionless. Anyone can trigger it.
4. No funds custody by the Cermin team. Every asset sits in user-owned vaults.
5. Validation only on writes. Read-only views never validate.

---

## Smart Contract Workflow

### Build order
1. `interfaces/mezo/*.sol` — vendored Mezo interfaces (subset Cermin uses).
2. `interfaces/ICerminVault.sol` (+ types) and `interfaces/ICerminFactory.sol`.
3. `CerminVault.sol` — implementation. Constructor sets Mezo immutables and disables init on the impl.
4. `CerminFactory.sol` — uses `Clones` to deploy vaults.
5. Tests, then deploy script.

### Per-contract loop
- Write tests immediately (don't batch).
- `forge fmt && forge build && forge test --match-contract Foo -vvv`.
- `forge coverage` before merging.
- Conventional commit (`feat(contracts): …`).

### Before merge
- `forge test -vvv`
- `forge snapshot`
- `slither .` (static analysis, optional)
- Update `BLUEPRINT.md` if architecture changed.

---

## Off-Chain Agent Workflow

The agent is a single TypeScript cron loop. Per cycle:

1. Fetch BTC price (Mezo PriceFeed).
2. List vaults via `factory.allVaults()` and snapshot each.
3. Decide deterministically:
   - If `getICR() < defendICR` → call `vault.defend(hints)`.
   - Else if BTC moved past `skimThresholdBps` since `lastSkimPrice` → call `vault.skim(hints)`.
   - Else hold.
4. Persist a one-line decision log per vault to SQLite.

No multi-agent debate. No LLM. Templated reason strings power the "Why" copy in the UI.

### Hint generation
Inline utility under `agent/src/hints/`. For MVP we pass `(0x0, 0x0)` — Mezo accepts that as "no hint". A production version walks SortedTroves; not needed for hackathon.

### Deployment
Vercel Cron (free, 10-min interval). Switch to Railway only if sub-minute reaction becomes necessary post-launch.

---

## Frontend Workflow

### Onboarding (5 steps, < 60s)
1. Connect wallet (RainbowKit + Mezo Passport).
2. Enter BTC amount (auto USD preview).
3. Pick goal label: Forever Allowance / Spend Now, Reclaim Later. (UI-only — same params either way.)
4. Pick risk preset: Conservative / Balanced ⭐ / Aggressive.
5. Preview projection → sign → vault deployed.

Custom mode is a stretch goal. The on-chain contract takes raw `VaultParams` so power-users can call the factory directly.

### Dashboard
- BTC collateral card (locked, with reassurance copy).
- Shadow balance card (spendable + sMUSD vault value, withdraw button).
- Strategy card (params + ICR gauge).
- Activity feed via `viem.getLogs()` — `Skimmed`, `Defended`, `SpendableWithdrawn`, `Closed`.

No indexer. No agent reasoning panel.

### Aesthetic
Black/white minimalist. Clean sans-serif (Geist). shadcn/ui base. Inspired by Linear, Vercel, Apple.

---

## Demo Script (3 min)

1. **0:00–0:20** — Hook: "What if your Bitcoin paid you to live, without ever being sold?"
2. **0:20–0:50** — Problem framing.
3. **0:50–1:30** — Live demo: deposit BTC → pick Balanced → vault deployed.
4. **1:30–2:00** — Price simulation: BTC up → skim grows the Shadow; BTC down → defense activates.
5. **2:00–2:30** — Show the activity feed with templated reason strings.
6. **2:30–2:50** — Show goal-mode framing for the same vault.
7. **2:50–3:00** — Closing: "Your BTC stays whole. The Shadow is what you live on."

---

## Communication Conventions

### Commits
Conventional Commits:
```
feat(contracts): implement CerminVault.skim
fix(agent): handle null priceFeed response
docs(blueprint): clarify defense math
test(vault): cover params validation rules
```

### PRs
Reference the BLUEPRINT section, test coverage delta, and gas snapshot diff (if contracts changed).

### Issue labels
`priority:p0|p1|p2` · `area:contracts|agent|frontend|docs` · `type:bug|feat|chore`.

---

## Boundaries — DO NOT

- DO NOT use `delegatecall` outside library context.
- DO NOT use `selfdestruct`.
- DO NOT hardcode addresses outside deploy scripts.
- DO NOT skip ReentrancyGuard "because the function is internal" — internal can become external via inheritance.
- DO NOT use `block.number` for time.
- DO NOT trust off-chain price without on-chain PriceFeed verification.
- DO NOT add mainnet deploy scripts before audit.
- DO NOT commit private keys, RPC URLs with auth, or `.env` files.
- DO NOT use floating-point math — Solidity has none. Use basis points (10000 = 100%).
- DO NOT use any non-English language in code (variables, functions, comments) or docs.
- DO NOT re-introduce Guardian, Treasury, StrategyEngine, Presets-as-library, mode/risk/stance enums, 4-tier ICR system, surplus payouts, or LLM agents. Those were dropped on purpose.

---

## When in Doubt

1. Re-read `BLUEPRINT.md` — the answer is probably there.
2. Check Mezo source — https://github.com/mezo-org/musd
3. Check OpenZeppelin — https://docs.openzeppelin.com/contracts/5.x/
4. Ask the human — better to ask than guess on security-critical code.

---

## Test Coverage Targets

| Component | Target | Priority |
|-----------|--------|----------|
| `CerminVault._validateParams` | 100% | P0 |
| `CerminVault.open` | 100% | P0 |
| `CerminVault.skim` | 100% | P0 |
| `CerminVault.defend` | 100% | P0 |
| `CerminVault.withdrawSpendable` | 95% | P1 |
| `CerminVault.close` | 100% | P0 |
| `CerminFactory` | 100% | P0 |
| Agent service | 70% | P1 |
| Frontend | 60% | P2 |

---

## Key Numbers to Remember

| Metric | Value |
|--------|-------|
| Solidity version | 0.8.24 |
| Mezo borrow rate | 1% APR fixed |
| MUSD Savings APR (estimate) | ~5% variable |
| Mezo max LTV | 90% (ICR 111%) |
| Mezo liquidation ICR | < 110% |
| Cermin emergency ICR floor | ≥ 115% |
| Min Mezo debt | 1,800 + 200 gas = 2,000 MUSD |
| Basis points scale | 10000 = 100% |
| `VaultParams` fields | 5 (all uint16 — fits one slot) |
| On-chain contract count | 2 |

---

## Final Notes

This is a hackathon submission. **Quality over feature creep.** Better to ship a tight working demo than fifteen half-baked components.

Priority order:
1. ✅ Two contracts working on Mezo testnet (`CerminVault` + `CerminFactory`).
2. ✅ End-to-end demo flow (open → skim → defend → close).
3. ✅ Polished frontend with onboarding + dashboard (no indexer).
4. ✅ Agent service running on Vercel Cron (deterministic; no LLM).

Hit P0/P1 hard. Anything bigger is post-hackathon.
