"use client";

import { useMemo, useState } from "react";
import { isAddress, parseUnits } from "viem";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatMusd } from "@/lib/utils";
import { Zap } from "lucide-react";

interface ShadowBalanceCardProps {
  spendableMusd: bigint;
  vaultValue: bigint;
  onWithdraw?: (amount: bigint, recipient: `0x${string}`) => void;
  isWithdrawLoading?: boolean;
}

export function ShadowBalanceCard({
  spendableMusd,
  vaultValue,
  onWithdraw,
  isWithdrawLoading,
}: ShadowBalanceCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const spendable = useMemo(() => Number(spendableMusd) / 1e18, [spendableMusd]);

  const validation = useMemo(() => {
    const parsed = parseFloat(amount);
    if (!amount) return { ok: false, reason: null as string | null };
    if (isNaN(parsed) || parsed <= 0) return { ok: false, reason: "Enter a positive amount" };
    if (parsed > spendable) return { ok: false, reason: "Exceeds spendable balance" };
    if (!recipient) return { ok: false, reason: null };
    if (!isAddress(recipient)) return { ok: false, reason: "Invalid address" };
    return { ok: true, reason: null };
  }, [amount, recipient, spendable]);

  const handleWithdraw = () => {
    if (!validation.ok || !onWithdraw) return;
    let amountWei: bigint;
    try {
      amountWei = parseUnits(amount as `${number}`, 18);
    } catch {
      return;
    }
    onWithdraw(amountWei, recipient as `0x${string}`);
    setShowForm(false);
    setAmount("");
    setRecipient("");
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-muted text-sm mb-0.5">Shadow Balance</p>
          <p className="text-muted-2 text-xs">Spendable + savings vault value</p>
        </div>
        <Zap className="w-4 h-4 text-amber-500" />
      </div>

      <div className="mb-6">
        <p className="text-4xl font-bold text-ink tabular-nums leading-none">
          {spendable.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-lg font-medium text-muted-2 mt-1">MUSD spendable</p>
        <p className="text-muted text-xs mt-3 border-t border-line pt-3">
          In sMUSD vault: {formatMusd(vaultValue)}
        </p>
      </div>

      {!showForm ? (
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowForm(true)}
          className="w-full"
          disabled={spendable <= 0}
        >
          Withdraw
        </Button>
      ) : (
        <div className="space-y-2 animate-fade-in">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Amount (MUSD)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={spendable}
            min={0}
            step="0.01"
            className="w-full bg-surface-soft border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-muted-2 focus:outline-none focus:border-amber-300"
          />
          <input
            type="text"
            placeholder="Recipient (0x...)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="w-full bg-surface-soft border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder-muted-2 focus:outline-none focus:border-amber-300 font-mono"
          />
          {validation.reason && (
            <p className="text-[11px] text-danger">{validation.reason}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleWithdraw}
              loading={isWithdrawLoading}
              disabled={!validation.ok || isWithdrawLoading}
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
                setRecipient("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
