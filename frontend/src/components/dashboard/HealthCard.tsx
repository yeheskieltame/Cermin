"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ICRGauge } from "@/components/dashboard/ICRGauge";
import { formatUsd } from "@/lib/utils";
import { ShieldCheck, ShieldAlert } from "lucide-react";

const MEZO_LIQUIDATION_ICR = 1.1;

interface HealthCardProps {
  icr: bigint;
  collateral: bigint;
  debt: bigint;
  btcPriceUsd: number;
  defendICR: number;
  onDefend?: () => void;
  isDefendLoading?: boolean;
}

export function HealthCard({
  icr,
  collateral,
  debt,
  btcPriceUsd,
  defendICR,
  onDefend,
  isDefendLoading,
}: HealthCardProps) {
  const icrBps = Number(icr);
  const btcAmount = Number(collateral) / 1e18;
  const debtMusd = Number(debt) / 1e18;
  const liqPrice = btcAmount > 0 ? (MEZO_LIQUIDATION_ICR * debtMusd) / btcAmount : 0;
  const dropBuffer =
    btcPriceUsd > 0 && liqPrice > 0
      ? Math.max(0, ((btcPriceUsd - liqPrice) / btcPriceUsd) * 100)
      : 0;
  const needsDefense = icrBps > 0 && icrBps < defendICR;

  return (
    <Card className="relative overflow-hidden flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs text-amber-500 tabular-nums">002</span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted font-medium">Health</p>
            <p className="text-muted-2 text-xs">Distance to liquidation</p>
          </div>
        </div>
        <Badge variant={needsDefense ? "warning" : "success"}>
          {needsDefense ? <ShieldAlert className="w-3 h-3 mr-1" /> : <ShieldCheck className="w-3 h-3 mr-1" />}
          {needsDefense ? "At risk" : "Safe"}
        </Badge>
      </div>

      <div className="flex justify-center my-1">
        <ICRGauge icr={icr} />
      </div>

      {/* zone legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-muted-2 mb-4">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success" /> Safe
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-warning" /> Caution
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-danger" /> Danger
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px rounded-2xl overflow-hidden bg-line/70 border border-cream-300">
        <div className="bg-surface px-3.5 py-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-2 font-mono">Liquidation</div>
          <div className="text-sm font-semibold tabular-nums text-ink mt-1">
            {liqPrice > 0 ? formatUsd(liqPrice, 0) : "—"}
          </div>
        </div>
        <div className="bg-surface px-3.5 py-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-2 font-mono">BTC drop buffer</div>
          <div className="text-sm font-semibold tabular-nums text-success mt-1">{dropBuffer.toFixed(0)}%</div>
        </div>
      </div>

      {onDefend && (
        <div className="mt-auto pt-4">
          {needsDefense ? (
            <>
              <p className="text-xs text-warning mb-2 flex items-start gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 mt-px flex-shrink-0" />
                Below your {(defendICR / 100).toFixed(0)}% line — repay debt from your Shadow to recover.
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
              <p className="text-[11px] text-muted-2 mb-2 leading-relaxed">
                Healthy. The keeper auto-defends below {(defendICR / 100).toFixed(0)}% — you can
                also trigger it yourself.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={onDefend}
                loading={isDefendLoading}
                disabled={isDefendLoading}
              >
                <ShieldCheck className="w-4 h-4" />
                Defend
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
