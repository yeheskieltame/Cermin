"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { parseAbiItem, formatUnits, type PublicClient } from "viem";
import { Card } from "@/components/ui/Card";
import { truncateAddress } from "@/lib/utils";
import { Activity } from "lucide-react";

type EventKind = "Skimmed" | "Defended" | "Withdrawn" | "Deposited" | "Closed";

interface FeedEvent {
  type: EventKind;
  txHash: string;
  blockNumber: bigint;
  label: string;
}

const EVENTS = {
  Skimmed: parseAbiItem(
    "event Skimmed(uint256 priceAtSkim, uint256 toSpendable, uint256 toVault, uint256 newDebt)",
  ),
  Defended: parseAbiItem(
    "event Defended(uint256 icrBefore, uint256 icrAfter, uint256 repaid, uint256 fromVault, uint256 fromSpendable)",
  ),
  Withdrawn: parseAbiItem(
    "event SpendableWithdrawn(address indexed recipient, uint256 amount)",
  ),
  Deposited: parseAbiItem("event CollateralAdded(uint256 amount)"),
  Closed: parseAbiItem(
    "event Closed(uint256 btcReturned, uint256 musdRemainder)",
  ),
} as const;

const LOOKBACK_BLOCKS = 5_000n;
const REFRESH_MS = 30_000;

function formatMusd(wei: bigint): string {
  const v = parseFloat(formatUnits(wei, 18));
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function fetchActivity(
  client: PublicClient,
  vaultAddress: `0x${string}`,
): Promise<FeedEvent[]> {
  const latest = await client.getBlockNumber();
  const fromBlock = latest > LOOKBACK_BLOCKS ? latest - LOOKBACK_BLOCKS : 0n;

  const [skims, defenses, withdrawals, deposits, closes] = await Promise.all([
    client.getLogs({ address: vaultAddress, event: EVENTS.Skimmed, fromBlock }),
    client.getLogs({ address: vaultAddress, event: EVENTS.Defended, fromBlock }),
    client.getLogs({ address: vaultAddress, event: EVENTS.Withdrawn, fromBlock }),
    client.getLogs({ address: vaultAddress, event: EVENTS.Deposited, fromBlock }),
    client.getLogs({ address: vaultAddress, event: EVENTS.Closed, fromBlock }),
  ]);

  const parsed: FeedEvent[] = [];

  for (const log of skims) {
    const toSpendable = (log.args?.toSpendable as bigint) ?? 0n;
    const toVault = (log.args?.toVault as bigint) ?? 0n;
    parsed.push({
      type: "Skimmed",
      txHash: log.transactionHash ?? "",
      blockNumber: log.blockNumber ?? 0n,
      label: `Skim: +${formatMusd(toSpendable)} spendable, +${formatMusd(toVault)} to vault`,
    });
  }
  for (const log of defenses) {
    const repaid = (log.args?.repaid as bigint) ?? 0n;
    const icrBefore = Number((log.args?.icrBefore as bigint) ?? 0n) / 100;
    const icrAfter = Number((log.args?.icrAfter as bigint) ?? 0n) / 100;
    parsed.push({
      type: "Defended",
      txHash: log.transactionHash ?? "",
      blockNumber: log.blockNumber ?? 0n,
      label: `Defense: repaid ${formatMusd(repaid)} MUSD (ICR ${icrBefore.toFixed(0)}% → ${icrAfter.toFixed(0)}%)`,
    });
  }
  for (const log of withdrawals) {
    const amt = (log.args?.amount as bigint) ?? 0n;
    const to = (log.args?.recipient as `0x${string}`) ?? "0x";
    parsed.push({
      type: "Withdrawn",
      txHash: log.transactionHash ?? "",
      blockNumber: log.blockNumber ?? 0n,
      label: `Withdraw ${formatMusd(amt)} MUSD → ${truncateAddress(to)}`,
    });
  }
  for (const log of deposits) {
    const amt = (log.args?.amount as bigint) ?? 0n;
    parsed.push({
      type: "Deposited",
      txHash: log.transactionHash ?? "",
      blockNumber: log.blockNumber ?? 0n,
      label: `Added ${(Number(amt) / 1e18).toFixed(6)} BTC collateral`,
    });
  }
  for (const log of closes) {
    const btc = (log.args?.btcReturned as bigint) ?? 0n;
    parsed.push({
      type: "Closed",
      txHash: log.transactionHash ?? "",
      blockNumber: log.blockNumber ?? 0n,
      label: `Vault closed — ${(Number(btc) / 1e18).toFixed(6)} BTC returned`,
    });
  }

  parsed.sort((a, b) => Number(b.blockNumber - a.blockNumber));
  return parsed.slice(0, 20);
}

export function ActivityFeed({ vaultAddress }: { vaultAddress: `0x${string}` }) {
  const client = usePublicClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity", vaultAddress],
    queryFn: () => fetchActivity(client as PublicClient, vaultAddress),
    enabled: !!vaultAddress && !!client,
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS / 2,
    retry: 2,
  });

  const events = useMemo(() => data ?? [], [data]);

  const dot: Record<EventKind, string> = {
    Skimmed: "bg-success",
    Defended: "bg-warning",
    Withdrawn: "bg-info",
    Deposited: "bg-amber-500",
    Closed: "bg-muted-2",
  };

  const text: Record<EventKind, string> = {
    Skimmed: "text-success",
    Defended: "text-warning",
    Withdrawn: "text-info",
    Deposited: "text-amber-700",
    Closed: "text-muted",
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-muted text-sm mb-0.5">Activity</p>
          <p className="text-muted-2 text-xs">On-chain vault events</p>
        </div>
        <Activity className="w-4 h-4 text-muted-2" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-cream-300" />
              <div className="h-3 bg-cream-200 rounded flex-1" />
              <div className="h-3 bg-cream-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-8">
          <p className="text-danger text-sm">Couldn&apos;t load activity</p>
          <p className="text-muted-2 text-xs mt-1">RPC may be temporarily unavailable</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted text-sm">No activity yet</p>
          <p className="text-muted-2 text-xs mt-1">
            Events appear after the first skim or defense
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
          {events.map((ev, i) => (
            <div key={`${ev.txHash}-${i}`} className="flex items-start gap-3">
              <div
                className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dot[ev.type]}`}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs truncate ${text[ev.type]}`}>{ev.label}</p>
                <p className="text-[10px] text-muted-2 mt-0.5">
                  Block #{ev.blockNumber.toString()}
                  {ev.txHash && (
                    <span className="ml-2">
                      <a
                        href={`https://explorer.test.mezo.org/tx/${ev.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-ink transition-colors"
                      >
                        ↗
                      </a>
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
