"use client";

import { useMemo, useState } from "react";
import { parseEther } from "viem";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatUsd } from "@/lib/utils";
import { ShieldCheck, Bitcoin } from "lucide-react";

interface BtcBalanceCardProps {
  collateral: bigint;
  btcPriceUsd: number;
  onAddCollateral?: (amountWei: bigint) => void;
  isAddCollateralLoading?: boolean;
}

export function BtcBalanceCard({
  collateral,
  btcPriceUsd,
  onAddCollateral,
  isAddCollateralLoading,
}: BtcBalanceCardProps) {
  const btcAmount = Number(collateral) / 1e18;
  const usdValue = btcAmount * btcPriceUsd;

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");

  const validation = useMemo(() => {
    if (!amount) return { ok: false, reason: null as string | null };
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0)
      return { ok: false, reason: "Enter a positive amount" };
    return { ok: true, reason: null };
  }, [amount]);

  const addUsd = (parseFloat(amount) || 0) * btcPriceUsd;

  const handleAdd = () => {
    if (!validation.ok || !onAddCollateral) return;
    let wei: bigint;
    try {
      wei = parseEther(amount as `${number}`);
    } catch {
      return;
    }
    onAddCollateral(wei);
    setShowForm(false);
    setAmount("");
  };

  return (
    <Card glow className="relative overflow-hidden">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-muted text-sm mb-0.5">Bitcoin Collateral</p>
          <p className="text-muted-2 text-xs">Locked · Never sold</p>
        </div>
        <Badge variant="success">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Protected
        </Badge>
      </div>
      <div className="flex items-end gap-3">
        <Bitcoin className="w-8 h-8 text-amber-500/70 mb-1" />
        <div>
          <p className="text-4xl font-bold text-ink tabular-nums leading-none">
            {btcAmount.toFixed(6)}
          </p>
          <p className="text-lg font-medium text-muted-2 mt-1">BTC</p>
        </div>
      </div>
      <p className="text-muted text-sm mt-4 border-t border-line pt-4">
        {formatUsd(usdValue)}{" "}
        <span className="text-muted-2 text-xs">@ {formatUsd(btcPriceUsd, 0)}</span>
      </p>

      {onAddCollateral && (
        <div className="mt-4">
          {!showForm ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowForm(true)}
              className="w-full"
            >
              Add BTC
            </Button>
          ) : (
            <div className="space-y-2 animate-fade-in">
              <p className="text-[11px] text-muted-2 leading-relaxed">
                Adds collateral to your trove — raises your safety buffer (ICR).
                It does not borrow more on its own.
              </p>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Amount (BTC)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
                step="0.001"
                className="w-full bg-surface-soft border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-muted-2 focus:outline-none focus:border-amber-300"
              />
              {addUsd > 0 && (
                <p className="text-[11px] text-muted-2 text-right">
                  ≈ {formatUsd(addUsd)}
                </p>
              )}
              {validation.reason && (
                <p className="text-[11px] text-danger">{validation.reason}</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAdd}
                  loading={isAddCollateralLoading}
                  disabled={!validation.ok || isAddCollateralLoading}
                  className="flex-1"
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setAmount("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
