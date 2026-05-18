import type { PublicClient } from 'viem';
import { CERMIN_FACTORY_ABI } from '../abis/CerminFactory.js';
import { CERMIN_VAULT_ABI } from '../abis/CerminVault.js';
import { PRICE_FEED_ABI } from '../abis/PriceFeed.js';
import type { Config } from '../config.js';
import type { Action, VaultParams, VaultSnapshot, VaultState } from '../types.js';
import { withRetry } from '../rpc/retry.js';

const BPS = 10_000;

export async function listVaults(client: PublicClient, config: Config): Promise<readonly `0x${string}`[]> {
  return withRetry(() =>
    client.readContract({
      address: config.CERMIN_FACTORY_ADDRESS,
      abi: CERMIN_FACTORY_ABI,
      functionName: 'allVaults',
    }),
  ) as Promise<readonly `0x${string}`[]>;
}

/**
 * Fetches the BTC price and vault list in parallel. With the http transport's
 * `batch` option enabled, both requests share a single HTTP roundtrip.
 */
export async function fetchPriceAndVaults(
  client: PublicClient,
  config: Config,
): Promise<{ price: bigint; vaults: readonly `0x${string}`[] }> {
  const [price, vaults] = await Promise.all([
    withRetry(() =>
      client.readContract({
        address: config.MEZO_PRICE_FEED_ADDRESS,
        abi: PRICE_FEED_ABI,
        functionName: 'lastGoodPrice',
      }),
    ),
    listVaults(client, config),
  ]);
  return { price: price as bigint, vaults };
}

/**
 * Reads the six vault fields in parallel. The http transport batches them
 * into a single JSON-RPC payload, so this is one HTTP roundtrip per vault —
 * regardless of whether Mezo has Multicall3 deployed.
 */
export async function snapshotVault(client: PublicClient, vault: `0x${string}`): Promise<VaultSnapshot> {
  const [owner, params, state, icr, debt, collateral] = await Promise.all([
    withRetry(() => client.readContract({ address: vault, abi: CERMIN_VAULT_ABI, functionName: 'owner' })),
    withRetry(() => client.readContract({ address: vault, abi: CERMIN_VAULT_ABI, functionName: 'params' })),
    withRetry(() => client.readContract({ address: vault, abi: CERMIN_VAULT_ABI, functionName: 'state' })),
    withRetry(() => client.readContract({ address: vault, abi: CERMIN_VAULT_ABI, functionName: 'getICR' })),
    withRetry(() => client.readContract({ address: vault, abi: CERMIN_VAULT_ABI, functionName: 'getDebt' })),
    withRetry(() => client.readContract({ address: vault, abi: CERMIN_VAULT_ABI, functionName: 'getCollateral' })),
  ]) as [`0x${string}`, VaultParams, VaultState, bigint, bigint, bigint];

  return {
    address: vault,
    owner,
    params,
    state,
    icrBps: Number(icr),
    debt,
    collateral,
  };
}

export interface Decision {
  action: Action;
  reason: string;
}

export function decide(snap: VaultSnapshot, currentPrice: bigint): Decision {
  // Defense beats skim: if ICR is below threshold, repay before anything else.
  if (snap.icrBps < snap.params.defendICR) {
    const priceUsd = Number(currentPrice / 10n ** 16n) / 100;
    return {
      action: 'DEFEND',
      reason: `BTC at $${priceUsd.toFixed(0)}. ICR fell to ${(snap.icrBps / 100).toFixed(1)}%, below defend threshold of ${(snap.params.defendICR / 100).toFixed(1)}%.`,
    };
  }

  const last = snap.state.lastSkimPrice;
  if (last > 0n && currentPrice > last) {
    const moveBps = Number(((currentPrice - last) * BigInt(BPS)) / last);
    if (moveBps >= snap.params.skimThresholdBps) {
      return {
        action: 'SKIM',
        reason: `BTC up ${(moveBps / 100).toFixed(2)}% since last skim, past the ${(snap.params.skimThresholdBps / 100).toFixed(1)}% threshold. Drawing new MUSD capacity.`,
      };
    }
  }

  return { action: 'HOLD', reason: 'Vault is healthy and no skim threshold crossed.' };
}
