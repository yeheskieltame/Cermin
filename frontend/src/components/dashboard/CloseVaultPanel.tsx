"use client";

import { useMemo, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CONTRACTS, ERC20_ABI } from "@/lib/contracts";
import { formatMusd, formatTxError } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { ClosePhase } from "@/hooks/useVaultActions";

const GAS_COMP = 200n * 10n ** 18n;

interface CloseVaultPanelProps {
  vaultAddress: `0x${string}`;
  debt: bigint;
  spendable: bigint;
  vaultValue: bigint;
  onClose: (args: { shortfall: bigint; currentAllowance: bigint }) => void;
  closePhase: ClosePhase;
  isCloseLoading: boolean;
  closeError?: unknown;
  closeHash?: `0x${string}`;
  approveHash?: `0x${string}`;
}

export function CloseVaultPanel({
  vaultAddress,
  debt,
  spendable,
  vaultValue,
  onClose,
  closePhase,
  isCloseLoading,
  closeError,
  closeHash,
  approveHash,
}: CloseVaultPanelProps) {
  const { address: owner } = useAccount();
  const [confirmed, setConfirmed] = useState(false);

  // Read owner's MUSD balance + allowance so we can sanity-check before firing.
  const { data: musdReads } = useReadContracts({
    contracts: owner
      ? [
          {
            address: CONTRACTS.MUSD,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [owner],
          },
          {
            address: CONTRACTS.MUSD,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [owner, vaultAddress],
          },
        ]
      : [],
    query: { enabled: !!owner, refetchInterval: 20_000 },
  });

  const ownerMusdBalance = (musdReads?.[0]?.result as bigint | undefined) ?? 0n;
  const allowance = (musdReads?.[1]?.result as bigint | undefined) ?? 0n;

  const { toBurn, shortfall, hasEnoughMusd } = useMemo(() => {
    const burn = debt > GAS_COMP ? debt - GAS_COMP : 0n;
    const available = spendable + vaultValue;
    const short = burn > available ? burn - available : 0n;
    return {
      toBurn: burn,
      shortfall: short,
      hasEnoughMusd: short === 0n || ownerMusdBalance >= short,
    };
  }, [debt, spendable, vaultValue, ownerMusdBalance]);

  const handleClose = () => {
    onClose({ shortfall, currentAllowance: allowance });
  };

  const buttonLabel = (() => {
    if (closePhase === "approving") return "Approving MUSD…";
    if (closePhase === "closing") return "Closing vault…";
    if (closePhase === "done") return "Vault closed";
    return shortfall > 0n ? "Approve & close vault" : "Close vault";
  })();

  return (
    <Card className="border-danger/20 bg-danger/[0.03]">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-danger" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Close vault</p>
          <p className="text-xs text-muted mt-0.5 max-w-md">
            Repays your MUSD debt and returns your BTC collateral. This burns the
            spendable balance and the sMUSD vault. Irreversible.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-surface-soft border border-line p-4 space-y-2 mb-4 text-xs">
        <Row label="Debt to repay" value={formatMusd(toBurn)} />
        <Row
          label="Covered by vault"
          value={formatMusd(spendable + vaultValue > toBurn ? toBurn : spendable + vaultValue)}
        />
        <Row
          label="Pulled from your wallet"
          value={formatMusd(shortfall)}
          tone={shortfall > 0n ? "warn" : "muted"}
        />
        {shortfall > 0n && (
          <Row
            label="Your MUSD balance"
            value={formatMusd(ownerMusdBalance)}
            tone={hasEnoughMusd ? "muted" : "danger"}
          />
        )}
      </div>

      {shortfall > 0n && !hasEnoughMusd && (
        <p className="text-xs text-danger mb-3">
          You need {formatMusd(shortfall - ownerMusdBalance)} more MUSD in your
          wallet to close this vault.
        </p>
      )}

      {closeError ? (
        <p className="text-xs text-danger mb-3 break-words">
          {formatTxError(closeError)}
        </p>
      ) : null}

      {(approveHash || closeHash) && (
        <div className="text-[11px] text-muted mb-3 space-y-0.5">
          {approveHash && (
            <a
              href={`https://explorer.test.mezo.org/tx/${approveHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:text-ink transition-colors"
            >
              Approve tx ↗
            </a>
          )}
          {closeHash && (
            <a
              href={`https://explorer.test.mezo.org/tx/${closeHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:text-ink transition-colors"
            >
              Close tx ↗
            </a>
          )}
        </div>
      )}

      <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="w-4 h-4 rounded border-line accent-danger"
        />
        <span className="text-xs text-muted">
          I understand this closes my vault and returns my BTC.
        </span>
      </label>

      <Button
        variant="danger"
        size="sm"
        onClick={handleClose}
        loading={isCloseLoading}
        disabled={
          !confirmed ||
          isCloseLoading ||
          closePhase === "done" ||
          (shortfall > 0n && !hasEnoughMusd)
        }
        className="w-full"
      >
        {buttonLabel}
      </Button>
    </Card>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "muted" | "warn" | "danger";
}) {
  const color =
    tone === "warn"
      ? "text-warning"
      : tone === "danger"
      ? "text-danger"
      : "text-ink";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  );
}
