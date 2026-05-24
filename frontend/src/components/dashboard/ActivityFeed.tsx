"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { parseAbiItem, formatUnits, type PublicClient } from "viem";
import { Card } from "@/components/ui/Card";
import { truncateAddress } from "@/lib/utils";
import { Activity, Zap, ShieldCheck, ArrowUpRight, Plus, Lock } from "lucide-react";

type EventKind = "Skimmed" | "Defended" | "Withdrawn" | "Deposited" | "Closed";
type Tone = "success" | "warning" | "info" | "amber" | "muted";

export interface FeedEvent {
  type: EventKind;
  txHash: string;
  blockNumber: bigint;
  title: string;
  detail: string;
  value: string;
  tone: Tone;
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
  Closed: parseAbiItem("event Closed(uint256 btcReturned, uint256 musdRemainder)"),
} as const;

const LOOKBACK_BLOCKS = 5_000n;
const REFRESH_MS = 30_000;

function musd(wei: bigint): string {
  return parseFloat(formatUnits(wei, 18)).toLocaleString("en-US", {
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
      title: "Skimmed on a peak",
      detail: "Topped up your Shadow",
      value: `+$${musd(toSpendable + toVault)}`,
      tone: "success",
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
      title: "Defended the dip",
      detail: `ICR ${icrBefore.toFixed(0)}% → ${icrAfter.toFixed(0)}%`,
      value: `−$${musd(repaid)}`,
      tone: "warning",
    });
  }
  for (const log of withdrawals) {
    const amt = (log.args?.amount as bigint) ?? 0n;
    const to = (log.args?.recipient as `0x${string}`) ?? "0x";
    parsed.push({
      type: "Withdrawn",
      txHash: log.transactionHash ?? "",
      blockNumber: log.blockNumber ?? 0n,
      title: "Withdrew from Shadow",
      detail: `To ${truncateAddress(to)}`,
      value: `−$${musd(amt)}`,
      tone: "info",
    });
  }
  for (const log of deposits) {
    const amt = (log.args?.amount as bigint) ?? 0n;
    parsed.push({
      type: "Deposited",
      txHash: log.transactionHash ?? "",
      blockNumber: log.blockNumber ?? 0n,
      title: "Added collateral",
      detail: "Raised your buffer",
      value: `+${(Number(amt) / 1e18).toFixed(4)} BTC`,
      tone: "amber",
    });
  }
  for (const log of closes) {
    const btc = (log.args?.btcReturned as bigint) ?? 0n;
    parsed.push({
      type: "Closed",
      txHash: log.transactionHash ?? "",
      blockNumber: log.blockNumber ?? 0n,
      title: "Vault closed",
      detail: "BTC returned to you",
      value: `${(Number(btc) / 1e18).toFixed(4)} BTC`,
      tone: "muted",
    });
  }

  parsed.sort((a, b) => Number(b.blockNumber - a.blockNumber));
  return parsed.slice(0, 20);
}

const ICONS: Record<EventKind, React.ReactNode> = {
  Skimmed: <Zap className="w-4 h-4" />,
  Defended: <ShieldCheck className="w-4 h-4" />,
  Withdrawn: <ArrowUpRight className="w-4 h-4" />,
  Deposited: <Plus className="w-4 h-4" />,
  Closed: <Lock className="w-4 h-4" />,
};

const CHIP: Record<Tone, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-info/12 text-info",
  amber: "bg-amber-50 text-amber-600",
  muted: "bg-surface-soft text-muted-2",
};

const VALUE: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  amber: "text-amber-700",
  muted: "text-muted",
};

export function ActivityFeed({
  vaultAddress,
  previewEvents,
}: {
  vaultAddress: `0x${string}`;
  previewEvents?: FeedEvent[];
}) {
  const client = usePublicClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity", vaultAddress],
    queryFn: () => fetchActivity(client as PublicClient, vaultAddress),
    enabled: !previewEvents && !!vaultAddress && !!client,
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS / 2,
    retry: 2,
  });

  const events = useMemo(() => previewEvents ?? data ?? [], [previewEvents, data]);
  const loading = !previewEvents && isLoading;

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs text-amber-500 tabular-nums">004</span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted font-medium">Activity</p>
            <p className="text-muted-2 text-xs">Everything your vault does, on-chain</p>
          </div>
        </div>
        {events.length > 0 && (
          <span className="font-mono text-[11px] text-muted-2 tabular-nums">{events.length} events</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-1 py-1.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-cream-200 via-cream-100 to-cream-200 bg-[length:200%_100%] animate-shimmer" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 rounded bg-gradient-to-r from-cream-200 via-cream-100 to-cream-200 bg-[length:200%_100%] animate-shimmer" />
                <div className="h-2.5 w-1/4 rounded bg-gradient-to-r from-cream-200 via-cream-100 to-cream-200 bg-[length:200%_100%] animate-shimmer" />
              </div>
              <div className="h-3 w-14 rounded bg-gradient-to-r from-cream-200 via-cream-100 to-cream-200 bg-[length:200%_100%] animate-shimmer" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-10">
          <p className="text-danger text-sm">Couldn&apos;t load activity</p>
          <p className="text-muted-2 text-xs mt-1">RPC may be temporarily unavailable — retrying.</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-8 flex flex-col items-center text-center">
          <span className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 animate-float">
            <Activity className="w-6 h-6" />
          </span>
          <p className="text-ink text-sm font-medium">No activity yet</p>
          <p className="text-muted-2 text-xs mt-1 max-w-xs leading-relaxed">
            Skims, defenses, withdrawals and deposits stream in here the moment they
            settle on-chain.
          </p>
          <div className="mt-6 w-full max-w-md space-y-2.5" aria-hidden>
            {[80, 64, 72].map((w, i) => (
              <div key={i} className="flex items-center gap-3 opacity-40">
                <span className="w-9 h-9 rounded-full bg-cream-200 flex-shrink-0" />
                <span className="h-2.5 rounded-full bg-cream-200" style={{ width: `${w}%` }} />
                <span className="h-2.5 w-12 rounded-full bg-cream-200 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
          {events.map((ev, i) => (
            <a
              key={`${ev.txHash}-${i}`}
              href={ev.txHash ? `https://explorer.test.mezo.org/tx/${ev.txHash}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl px-2.5 py-2.5 hover:bg-surface-soft transition-colors"
            >
              <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${CHIP[ev.tone]}`}>
                {ICONS[ev.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{ev.title}</p>
                <p className="text-[11px] text-muted-2 font-mono truncate">
                  {ev.detail} · #{ev.blockNumber.toString()}
                </p>
              </div>
              <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${VALUE[ev.tone]}`}>
                {ev.value}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}
