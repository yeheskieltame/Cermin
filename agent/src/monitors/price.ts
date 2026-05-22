import type { PublicClient } from 'viem';
import { PRICE_FEED_ABI } from '../abis/PriceFeed.js';
import type { Config } from '../config.js';
import { withRetry } from '../rpc/retry.js';

export async function fetchBTCPrice(client: PublicClient, config: Config): Promise<bigint> {
  return withRetry(() =>
    client.readContract({
      address: config.MEZO_PRICE_FEED_ADDRESS,
      abi: PRICE_FEED_ABI,
      functionName: 'fetchPrice',
    }),
  );
}
