"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import {
  formatUsd,
  truncateAddress,
  icrLabel,
  icrToColor,
} from "@/lib/utils";
import type { VaultParamsData } from "@/hooks/useVault";
import { ExternalLink } from "lucide-react";

const MEZO_LIQUIDATION_ICR = 1.1; // 110%
const MEZO_MAX_LTV = 90;

interface VaultSummaryProps {
  vaultAddress: `0x${string}`;
  collateral: bigint;
  debt: bigint;
  spendable: bigint;
  vaultValue: bigint;
  icr: bigint;
  btcPriceUsd: number;
  params: VaultParamsData;
}

function GrowBar({
  pct,
  className,
  delay = 0,
}: {
  pct: number;
  className?: string;
  delay?: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setTimeout(
      () => requestAnimationFrame(() => setW(Math.max(0, Math.min(100, pct)))),
      delay,
    );
    return () => clearTimeout(id);
  }, [pct, delay]);
  return (
    <div
      className={`h-full rounded-full transition-[width] duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${className ?? ""}`}
      style={{ width: `${w}%` }}
    />
  );
}

function MiniStat({
  label,
  value,
  format,
  accent,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3.5 transition-colors hover:bg-white/[0.09]">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45 font-mono">
        {label}
      </div>
      <AnimatedNumber
        value={value}
        format={format}
        className={`block text-xl font-semibold tabular-nums tracking-tight mt-1.5 ${accent ?? "text-cream-50"}`}
      />
    </div>
  );
}

export function VaultSummary({
  vaultAddress,
  collateral,
  debt,
  spendable,
  vaultValue,
  icr,
  btcPriceUsd,
  params,
}: VaultSummaryProps) {
  const btcAmount = Number(collateral) / 1e18;
  const collateralUsd = btcAmount * btcPriceUsd;
  const debtMusd = Number(debt) / 1e18;
  const shadowUsd = (Number(spendable) + Number(vaultValue)) / 1e18;
  const netEquity = collateralUsd - debtMusd;

  const icrBps = Number(icr);
  const icrPct = icrBps / 100;
  const healthColor = icrToColor(icrBps);
  const healthLabel = icrLabel(icrBps);

  const ltvPct = collateralUsd > 0 ? (debtMusd / collateralUsd) * 100 : 0;
  const targetLtv = params.targetLTV / 100;
  const liqPrice =
    btcAmount > 0 ? (MEZO_LIQUIDATION_ICR * debtMusd) / btcAmount : 0;
  const dropBuffer =
    btcPriceUsd > 0 ? ((btcPriceUsd - liqPrice) / btcPriceUsd) * 100 : 0;

  return (
    <Card variant="ink" className="!p-6 md:!p-8 relative animate-rise-in">
      {/* decorative concentric line-art, top-right */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 w-64 h-64 text-amber-300/10"
        viewBox="0 0 200 200"
        fill="none"
      >
        {[40, 64, 88, 112].map((r) => (
          <circle key={r} cx="150" cy="50" r={r} stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>
      <div className="absolute -top-16 -right-8 w-56 h-56 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

      <div className="relative">
        {/* meta row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-300/80 font-mono">
              Vault
            </span>
            <a
              href={`https://explorer.test.mezo.org/address/${vaultAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-white/55 hover:text-white transition-colors"
            >
              {truncateAddress(vaultAddress)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-cream-100">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-mono tabular-nums text-cream-100">
              BTC {formatUsd(btcPriceUsd, 0)}
            </span>
          </div>
        </div>

        {/* hero figure + health */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-mono mb-2">
              Net position value
            </div>
            <AnimatedNumber
              value={netEquity}
              format={(n) => formatUsd(n)}
              className="block text-[2.75rem] md:text-5xl font-semibold tabular-nums tracking-tight text-cream-50 leading-none"
            />
            <div className="text-sm text-white/55 mt-2">
              Collateral{" "}
              <span className="text-cream-100 tabular-nums">{formatUsd(collateralUsd)}</span>{" "}
              − debt{" "}
              <span className="text-cream-100 tabular-nums">{formatUsd(debtMusd)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 px-5 py-3.5">
            <div className="relative flex items-center justify-center">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: healthColor }}
              />
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-60"
                style={{ backgroundColor: healthColor }}
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/45 font-mono">
                Health · ICR
              </div>
              <div className="flex items-baseline gap-2">
                <AnimatedNumber
                  value={icrPct}
                  format={(n) => `${n.toFixed(0)}%`}
                  className="text-xl font-semibold tabular-nums"
                  durationMs={1300}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: healthColor }}
                >
                  {healthLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* secondary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-7">
          <MiniStat label="Collateral" value={collateralUsd} format={(n) => formatUsd(n)} />
          <MiniStat label="Total debt" value={debtMusd} format={(n) => `${formatUsd(n)}`} accent="text-cream-100" />
          <MiniStat label="Shadow balance" value={shadowUsd} format={(n) => formatUsd(n)} accent="text-amber-300" />
          <MiniStat label="Liquidation @" value={liqPrice} format={(n) => formatUsd(n, 0)} accent="text-amber-300" />
        </div>

        {/* LTV utilization */}
        <div className="mt-7">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-white/55">
              LTV <span className="text-cream-50 tabular-nums">{ltvPct.toFixed(1)}%</span>
            </span>
            <span className="text-white/40 tabular-nums">max {MEZO_MAX_LTV}%</span>
          </div>
          <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
            <GrowBar
              pct={(ltvPct / MEZO_MAX_LTV) * 100}
              className="bg-gradient-to-r from-amber-400 to-amber-500"
              delay={150}
            />
          </div>
          <div className="relative mt-1.5 h-3">
            {/* target marker */}
            <span
              className="absolute -top-[18px] w-px h-4 bg-white/30"
              style={{ left: `${(targetLtv / MEZO_MAX_LTV) * 100}%` }}
            />
            <span
              className="absolute text-[10px] font-mono text-white/40 -translate-x-1/2"
              style={{ left: `${(targetLtv / MEZO_MAX_LTV) * 100}%` }}
            >
              target {targetLtv.toFixed(0)}%
            </span>
            <span className="absolute right-0 text-[10px] font-mono text-amber-300/70">
              BTC can drop {dropBuffer > 0 ? dropBuffer.toFixed(0) : 0}% before liquidation
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
