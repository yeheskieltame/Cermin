"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVault } from "@/hooks/useVault";
import { useVaultActions } from "@/hooks/useVaultActions";
import { useBtcPrice } from "@/hooks/useBtcPrice";
import { BtcBalanceCard } from "@/components/dashboard/BtcBalanceCard";
import { ShadowBalanceCard } from "@/components/dashboard/ShadowBalanceCard";
import { StrategyCard } from "@/components/dashboard/StrategyCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { CloseVaultPanel } from "@/components/dashboard/CloseVaultPanel";
import { formatUsd, truncateAddress, formatTxError } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { ExternalLink, ArrowRight, Sparkles } from "lucide-react";

const TESTNET_PRICE_FALLBACK = 95_000;

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-line bg-surface p-6 animate-pulse">
      <div className="h-4 bg-cream-200 rounded w-1/3 mb-6" />
      <div className="h-10 bg-cream-200 rounded w-2/3 mb-3" />
      <div className="h-3 bg-cream-200 rounded w-1/2" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-danger/10 flex items-center justify-center mb-4">
        <span className="text-danger text-xl">!</span>
      </div>
      <h2 className="text-lg font-semibold text-ink">Couldn&apos;t reach Mezo</h2>
      <p className="text-muted text-sm mt-2">
        Vault data failed to load. The RPC may be temporarily unavailable — retry will run automatically.
      </p>
    </div>
  );
}

// Shown when a connected user has no vault yet. The dashboard is the hub: it
// invites you to open a position rather than silently redirecting to onboarding.
function NoPositionState() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">Your Dashboard</h1>
        <p className="text-muted text-sm mt-1">No open position yet.</p>
      </div>

      <div className="rounded-3xl border border-line bg-surface shadow-soft p-10 md:p-16 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Open your first position
        </h2>
        <p className="text-muted text-sm mt-3 max-w-md mx-auto leading-relaxed">
          Deposit BTC once and Cermin opens a Mezo vault that pays you a dollar
          allowance — without ever selling a satoshi.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/onboard"
            className={buttonClasses({ variant: "primary", size: "xl" })}
          >
            Open a new position
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const {
    vaultAddress,
    hasVault,
    state,
    params,
    icr,
    debt,
    collateral,
    shadow,
    isLoading,
    isError,
  } = useVault();
  const { btcPriceUsd } = useBtcPrice();
  const {
    withdrawSpendable,
    isWithdrawLoading,
    withdrawError,
    addCollateral,
    isAddCollateralLoading,
    addCollateralError,
    closeVault,
    closePhase,
    isCloseLoading,
    closeError,
    closeHash,
    approveHash,
  } = useVaultActions(vaultAddress);

  useEffect(() => {
    if (!isConnected) router.replace("/");
  }, [isConnected, router]);

  const derived = useMemo(() => {
    if (!state || !params) return null;
    const effectiveBtcPrice = btcPriceUsd > 0 ? btcPriceUsd : TESTNET_PRICE_FALLBACK;
    const collValue = collateral ?? 0n;
    const spendable = shadow ? shadow[0] : state.spendableMusd;
    const vaultValue = shadow ? shadow[1] : 0n;
    return { effectiveBtcPrice, collValue, spendable, vaultValue };
  }, [state, params, collateral, shadow, btcPriceUsd]);

  if (!isConnected || isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState />;
  if (!hasVault) return <NoPositionState />;
  if (!derived || !state || !params) return null;

  const { effectiveBtcPrice, collValue, spendable, vaultValue } = derived;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Your Vault</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted text-sm font-mono">{truncateAddress(vaultAddress!)}</p>
            <a
              href={`https://explorer.test.mezo.org/address/${vaultAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-2 hover:text-ink transition-colors"
              aria-label="Open vault on explorer"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">Active</Badge>
          {effectiveBtcPrice > 0 && (
            <Badge variant="default">BTC {formatUsd(effectiveBtcPrice, 0)}</Badge>
          )}
        </div>
      </div>

      {withdrawError && (
        <div className="mb-4 rounded-2xl bg-danger/8 border border-danger/25 px-4 py-3">
          <p className="text-xs text-danger">
            Withdraw failed: {formatTxError(withdrawError, 200)}
          </p>
        </div>
      )}

      {addCollateralError && (
        <div className="mb-4 rounded-2xl bg-danger/8 border border-danger/25 px-4 py-3">
          <p className="text-xs text-danger">
            Add collateral failed: {formatTxError(addCollateralError, 200)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        <BtcBalanceCard
          collateral={collValue}
          btcPriceUsd={effectiveBtcPrice}
          onAddCollateral={addCollateral}
          isAddCollateralLoading={isAddCollateralLoading}
        />
        <ShadowBalanceCard
          spendableMusd={spendable}
          vaultValue={vaultValue}
          onWithdraw={withdrawSpendable}
          isWithdrawLoading={isWithdrawLoading}
        />
        <StrategyCard params={params} icr={icr ?? 0n} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <ActivityFeed vaultAddress={vaultAddress!} />
      </div>

      <div className="mt-8">
        <CloseVaultPanel
          vaultAddress={vaultAddress!}
          debt={debt ?? 0n}
          spendable={spendable}
          vaultValue={vaultValue}
          onClose={closeVault}
          closePhase={closePhase}
          isCloseLoading={isCloseLoading}
          closeError={closeError}
          closeHash={closeHash}
          approveHash={approveHash}
        />
      </div>
    </div>
  );
}
