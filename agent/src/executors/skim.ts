import type { Hash, PublicClient, WalletClient } from 'viem';
import { CERMIN_VAULT_ABI } from '../abis/CerminVault.js';
import { computeHints } from '../hints/sortedTroves.js';
import { withRetry } from '../rpc/retry.js';

export async function executeSkim(
  publicClient: PublicClient,
  walletClient: WalletClient,
  vault: `0x${string}`,
): Promise<Hash> {
  const account = walletClient.account;
  if (!account) throw new Error('walletClient has no account');

  const { upperHint, lowerHint } = await computeHints();
  const { request } = await withRetry(() =>
    publicClient.simulateContract({
      address: vault,
      abi: CERMIN_VAULT_ABI,
      functionName: 'skim',
      args: [upperHint, lowerHint],
      account,
    }),
  );
  return walletClient.writeContract(request);
}
