# Cermin

> **Your BTC stays whole. The Shadow is what you live on.**

Cermin is a new way to *live off your Bitcoin without ever selling it*.

---

## What Is Cermin?

Imagine you own a mango tree. You love that tree. You don't want to chop it down. But you want to eat its mangoes every day.

Cermin is the automated system that **picks the mangoes** for you, while **keeping the tree healthy** — even through dry seasons.

In Bitcoin terms:
- **The tree** = Your Bitcoin
- **The mangoes** = Dollars you can spend (MUSD)
- **Cermin** = The autopilot that runs everything

You deposit BTC once, set your goal (lifetime allowance, or spend now and reclaim later), and Cermin handles the rest. **Automatically. Forever. Without you needing to understand DeFi.**

---

## 5W + 1H

### What — What Is Cermin?

Cermin is a consumer banking app on top of **Mezo** (a Bitcoin layer for DeFi). You deposit BTC, and Cermin automatically:

1. Borrows the **MUSD** stablecoin using your BTC as collateral
2. Deposits part of it into a savings vault yielding ~5%
3. Gives you spendable **dollars** (called the "Shadow")
4. Defends your BTC from liquidation risk automatically
5. Compounds and grows over time

The result: your BTC stays whole, but you live off the dollar Shadow it produces.

### Why — Why Does Cermin Exist?

Bitcoin holders face a classic dilemma:
- **Sell BTC** → cash now, lose upside
- **Hold BTC** → upside intact, no liquidity

Mezo's solution: borrow dollars against BTC at just 1% interest. But **you have to manage everything yourself**: monitor risk, deploy yield, defend liquidation. That's professional bank work pushed onto retail users.

**Cermin is the autopilot.** You provide BTC + a life goal. Cermin does the work.

### Who — Who Is Cermin For?

Cermin is for you if:
- ✅ You hold BTC and **believe in BTC long-term**
- ✅ You want a **monthly dollar allowance** from your BTC
- ✅ Or you want to **spend a portion now** and get your BTC back whole later
- ✅ You **don't want the hassle** of managing DeFi yourself
- ✅ You value transparency (everything on-chain, fully auditable)

Cermin is **not for you if**:
- ❌ You want to actively trade BTC short-term (this isn't a trading platform)
- ❌ You believe BTC will fall forever (the system still protects you in extended bear markets, but performance suffers)
- ❌ You want max-leverage with no safety net (Cermin is intentionally conservative by default)

### Where — Where Does Cermin Run?

- **Blockchain**: Mezo (Bitcoin-native L2 by Thesis)
- **Access**: Web app + mobile responsive (cermin.app — coming soon)
- **Wallet**: Bitcoin wallets (Xverse, Unisat) or EVM wallets (MetaMask) via **Mezo Passport**
- **Region**: Global (check your local regulations)

### When — When Can You Use Cermin?

- **Testnet**: Available now (Mezo Matsnet)
- **Mainnet**: After audit + KYB completion (target Q3 2026)
- **Best time to start**: Now, with small amounts on testnet to get familiar

### How — How Does Cermin Work?

Dead simple from a user's perspective:

```
Step 1: Connect wallet
Step 2: Deposit BTC
Step 3: Pick a mode:
        [A] Forever Allowance — BTC stays, get $ every month
        [B] Spend Now, Reclaim Later — Spend $ now, BTC returns whole on date X
Step 4: Pick a risk profile (Conservative / Balanced / Aggressive)
Step 5: Confirm — done.
```

After that, you see **two balances on the dashboard**:
- **BTC** (will not be sold)
- **Shadow Dollar** (spendable anytime)

---

## How It Works — A Story

Let's say you have **1 BTC** ($100,000), pick **Forever Allowance** mode + Balanced risk.

### Day 1
- You deposit 1 BTC
- Cermin borrows $50,000 MUSD using your BTC as collateral
- Cermin deposits $50,000 into the savings vault (~5% yield)
- Your debt: $50,000 (1% interest = $500/year)
- Your yield: $50,000 × 5% = $2,500/year
- **Net surplus = $2,000/year = $167/month into your pocket**

### Month 1, BTC Up 10%
- Your BTC is now $110,000
- New "borrow capacity" appears
- Cermin **doesn't take all of it**, it splits:
  - Part goes to defense buffer
  - Part goes into your Shadow (spending money)

### Month 3, BTC Down 20%
- Your BTC is now $88,000
- Your collateral ratio narrows
- Cermin **automatically** pulls from buffer, repays part of debt
- Ratio is safe again
- Your BTC is **not sold, not even a satoshi**
- Your Shadow stays intact

### Month 12
- You've received $2,000 in allowance payouts
- Your BTC is still 1 BTC
- The vault is intact
- The system is ready to loop forever

---

## What Makes Cermin Different?

Most DeFi protocols make you smart on your own. Cermin **removes the need to be smart**.

| Aspect | Typical DeFi | Cermin |
|--------|-------------|--------|
| Setup | Connect, read docs, calculate LTV, deposit, manage | Pick preset, deposit, done |
| Risk monitoring | You, 24/7 | Automated keeper, on-chain defense |
| Liquidation defense | You stay alert | Permissionless on-chain `defend()` + always-on keeper |
| Yield deployment | You pick vaults, monitor APRs | Auto-deployed to best rate |
| Strategy | Static, set once | Adaptive, follows market |
| UX | Spreadsheet vibes | Banking app vibes |

---

## Frequently Asked Questions

### "Will I lose my BTC?"
No — unless you pick an extremely aggressive risk profile. BTC stays in the smart contract as collateral. You can reclaim it anytime (Goal mode) or keep it active forever (Pension mode).

### "Where does the 'allowance' come from?"
From the **interest rate spread**. Mezo lets you borrow at 1%/year. The MUSD savings vault yields ~5%/year. The 4% spread is what Cermin converts into your income.

### "What's the biggest risk?"
1. **Extreme BTC crash** (>50% in hours): could trigger partial liquidation. But Cermin's conservative LTV + buffer + agent defense make this very rare.
2. **Mezo protocol risk**: you trust Mezo's smart contracts. Mezo is audited and has $171M+ TVL.
3. **Vault APR drops**: if it falls below 1%, Pension mode stops being profitable. Cermin auto-pauses before this.

### "Is this gambling?"
No. There's no bet, no opponent, no zero-sum game. Cermin = automated cashflow management on your own BTC-backed loan position.

### "Can I get my BTC back anytime?"
Yes, as long as you cover the debt. For Goal mode, Cermin sizes the math so vault + yield = enough to repay at the target date. For Pension mode, you can exit anytime by topping up MUSD to repay.

### "Why the name 'Cermin'?"
Cermin means "mirror" in Indonesian/Malay. **Your dollar Shadow is like a mirror of your BTC** — it reflects BTC value, grows with BTC, but never reduces the original BTC.

---

## Status & Roadmap

- ✅ **Concept & Blueprint** — done
- 🔄 **Smart Contract Development** — in progress
- ⏳ **Mezo Testnet Deployment**
- ⏳ **Audit (target: Trail of Bits / Spearbit)**
- ⏳ **Mainnet Launch**
- ⏳ **Mobile App**

---

## Built On

- **Mezo** — Bitcoin layer for DeFi (https://mezo.org)
- **MUSD** — Bitcoin-backed stablecoin
- **Mezo Passport** — Bitcoin wallet → EVM bridge
- **Foundry + Solidity** — smart contracts
- **Next.js + viem + wagmi** — frontend

---

## Get Involved

1. Wait for our testnet launch (soon)
2. Or be part of the early users — reach out for access
3. Or contribute as a developer (see `BLUEPRINT.md`)

---

## License

MIT — open source, fork freely, contribute happily.

---

**Cermin** © 2026
*Your BTC stays whole. The Shadow is what you live on.*