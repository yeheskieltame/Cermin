"use client";

// TEMPORARY visual-preview route with mock data — not linked anywhere. Safe to delete.
export const dynamic = "force-dynamic";

import { parseEther, parseUnits } from "viem";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Logo } from "@/components/ui/Logo";
import { VaultHero } from "@/components/dashboard/VaultHero";
import { BtcPriceChart } from "@/components/dashboard/BtcPriceChart";
import { BtcBalanceCard } from "@/components/dashboard/BtcBalanceCard";
import { ShadowBalanceCard } from "@/components/dashboard/ShadowBalanceCard";
import { StrategyCard } from "@/components/dashboard/StrategyCard";
import { SavingsSection } from "@/components/dashboard/SavingsSection";
import { ActivityFeed, type FeedEvent } from "@/components/dashboard/ActivityFeed";
import { CloseVaultPanel } from "@/components/dashboard/CloseVaultPanel";
import { PRESETS } from "@/lib/presets";

const M = {
  vaultAddress: "0x657400000000000000000000000000000000DdfF" as `0x${string}`,
  collateral: parseEther("0.07"),
  debt: parseUnits("2371.35", 18),
  spendable: parseUnits("650.71", 18),
  vaultValue: parseUnits("1518.31", 18),
  smusdShares: parseUnits("1500", 18),
  lastSkimPrice: parseEther("72000"),
  icr: 22900n,
  btcPriceUsd: 74652,
  params: PRESETS.conservative,
  createdAt: BigInt(Math.floor(Date.now() / 1000) - 3 * 86400),
  poolTvl: parseUnits("657116", 18),
  userShares: parseUnits("250", 18),
  userYield: parseUnits("3.42", 18),
  walletMusd: parseUnits("420", 18),
};

const ACTIVITY: FeedEvent[] = [
  { type: "Skimmed", txHash: "0x1", blockNumber: 128422n, title: "Skimmed on a peak", detail: "Topped up your Shadow", value: "+$214.10", tone: "success" },
  { type: "Defended", txHash: "0x2", blockNumber: 128190n, title: "Defended the dip", detail: "ICR 132% → 168%", value: "−$88.40", tone: "warning" },
  { type: "Withdrawn", txHash: "0x3", blockNumber: 127905n, title: "Withdrew from Shadow", detail: "To 0x9a3f…b201", value: "−$120.00", tone: "info" },
];

export default function PreviewPage() {
  const noop = () => {};
  const btcAmt = Number(M.collateral) / 1e18;
  const debtN = Number(M.debt) / 1e18;
  const liqPrice = (1.1 * debtN) / btcAmt;
  const defPrice = ((M.params.defendICR / 10000) * debtN) / btcAmt;
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[440px] overflow-hidden">
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[52rem] h-[30rem] rounded-full bg-amber-200/25 blur-[120px]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(92,84,72,0.10) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Logo />
          </Link>
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
        </div>

        <div className="mb-7">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-cream-300 bg-surface/70 backdrop-blur px-3 py-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">All systems go</span>
          </div>
          <h1 className="font-serif text-[2rem] md:text-[2.5rem] font-medium tracking-[-0.02em] text-ink leading-tight">
            Your Vault
          </h1>
          <p className="text-muted mt-2.5 text-pretty max-w-xl leading-relaxed">
            Your BTC is locked and safe. Cermin skims the peaks, defends the dips, and earns
            on idle dollars — automatically.
          </p>
        </div>

        <div className="mb-4">
          <VaultHero
            vaultAddress={M.vaultAddress}
            collateral={M.collateral}
            debt={M.debt}
            icr={M.icr}
            btcPriceUsd={M.btcPriceUsd}
            defendICR={M.params.defendICR}
            onDefend={noop}
          />
        </div>

        <div className="mb-4">
          <BtcPriceChart currentPrice={M.btcPriceUsd} liquidationPrice={liqPrice} defensePrice={defPrice} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="[&>*]:h-full">
            <BtcBalanceCard collateral={M.collateral} debt={M.debt} btcPriceUsd={M.btcPriceUsd} onAddCollateral={noop} />
          </div>
          <div className="[&>*]:h-full">
            <ShadowBalanceCard spendableMusd={M.spendable} onWithdraw={noop} />
          </div>
          <div className="[&>*]:h-full">
            <StrategyCard params={M.params} btcPriceUsd={M.btcPriceUsd} lastSkimPrice={M.lastSkimPrice} createdAt={M.createdAt} />
          </div>
        </div>

        <div className="mb-8">
          <SavingsSection
            poolTvl={M.poolTvl}
            aprPct={5}
            vaultSavings={M.vaultValue}
            vaultPrincipal={M.smusdShares}
            userShares={M.userShares}
            userYield={M.userYield}
            walletMusd={M.walletMusd}
            allowance={0n}
            onDeposit={noop}
            onWithdraw={noop}
            onClaim={noop}
            depositPhase="idle"
            isDepositing={false}
            isWithdrawing={false}
            isClaiming={false}
          />
        </div>

        <div className="mb-4">
          <ActivityFeed vaultAddress={M.vaultAddress} previewEvents={ACTIVITY} />
        </div>

        <div className="mt-8">
          <CloseVaultPanel
            vaultAddress={M.vaultAddress}
            debt={M.debt}
            spendable={M.spendable}
            vaultValue={M.vaultValue}
            onClose={noop}
            closePhase="idle"
            isCloseLoading={false}
          />
        </div>
      </div>
    </div>
  );
}
