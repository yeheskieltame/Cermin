"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ICRGauge } from "@/components/dashboard/ICRGauge";
import { icrToTextClass } from "@/lib/utils";
import type { VaultParamsData } from "@/hooks/useVault";
import { Settings, ShieldAlert } from "lucide-react";

interface StrategyCardProps {
  params: VaultParamsData;
  icr: bigint;
  onDefend?: () => void;
  isDefendLoading?: boolean;
}

export function StrategyCard({
  params,
  icr,
  onDefend,
  isDefendLoading,
}: StrategyCardProps) {
  const targetLtv = params.targetLTV / 100;
  const spendable = params.spendableShare / 100;
  const vaultPct = 100 - spendable;
  const skim = params.skimThresholdBps / 100;
  const defendIcr = params.defendICR / 100;
  const emergencyIcr = params.emergencyICR / 100;

  const icrBps = Number(icr);
  const icrColor = icrToTextClass(icrBps);
  // defend() only succeeds while ICR sits below the defend threshold; above it
  // the call reverts (ICRAboveDefend). icr is the cached value, so this is a
  // best-effort signal — the keeper reads the live price.
  const needsDefense = icrBps > 0 && icrBps < params.defendICR;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-muted text-sm mb-0.5">Vault Strategy</p>
          <p className="text-muted-2 text-xs">Risk parameters</p>
        </div>
        <Settings className="w-4 h-4 text-muted-2" />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <ICRGauge icr={icr} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Target LTV</span>
            <span className="text-xs text-ink font-mono">{targetLtv.toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Defend at</span>
            <span className="text-xs text-warning font-mono">{defendIcr.toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Emergency at</span>
            <span className="text-xs text-danger font-mono">{emergencyIcr.toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Current ICR</span>
            <span className={`text-xs font-mono font-semibold ${icrColor}`}>
              {(icrBps / 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted mb-2">MUSD allocation on borrow</p>
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          <div
            className="bg-amber-400 rounded-l-full"
            style={{ width: `${spendable}%` }}
          />
          <div
            className="bg-success rounded-r-full"
            style={{ width: `${vaultPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-amber-600">Spendable {spendable.toFixed(0)}%</span>
          <span className="text-[10px] text-success">sMUSD vault {vaultPct.toFixed(0)}%</span>
        </div>
        <p className="text-[10px] text-muted-2 mt-2">
          Skim threshold: BTC needs +{skim.toFixed(1)}% vs last skim
        </p>
      </div>

      {onDefend && (
        <div className="mt-4 border-t border-line pt-4">
          {needsDefense ? (
            <>
              <p className="text-xs text-warning mb-2 flex items-start gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 mt-px flex-shrink-0" />
                ICR is below your {defendIcr.toFixed(0)}% defend line. Repay debt
                from your Shadow to lift it back up.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={onDefend}
                loading={isDefendLoading}
                disabled={isDefendLoading}
              >
                Defend now
              </Button>
            </>
          ) : (
            <>
              <p className="text-[11px] text-muted-2 mb-2">
                Healthy. The keeper auto-defends if ICR drops below{" "}
                {defendIcr.toFixed(0)}% — you can also trigger it manually
                (does nothing while healthy).
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={onDefend}
                loading={isDefendLoading}
                disabled={isDefendLoading}
              >
                Defend now
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
