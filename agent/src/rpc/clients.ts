import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mezoTestnet } from '../chain.js';
import type { Config } from '../config.js';

export interface AgentClients {
  publicClient: PublicClient;
  walletClient: WalletClient;
}

export function createClients(config: Config): AgentClients {
  const transport = http(config.MEZO_TESTNET_RPC, {
    batch: { batchSize: 100, wait: 16 },
    retryCount: 0,
  });
  const publicClient = createPublicClient({ chain: mezoTestnet, transport });
  const account = privateKeyToAccount(config.PRIVATE_KEY);
  const walletClient = createWalletClient({ account, chain: mezoTestnet, transport });
  return { publicClient, walletClient };
}
