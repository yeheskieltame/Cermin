import { z } from 'zod';

const Hex = z.string().regex(/^0x[0-9a-fA-F]{40}$/).transform(v => v as `0x${string}`);

const ConfigSchema = z.object({
  MEZO_TESTNET_RPC: z.string().url(),
  PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/).transform(v => v as `0x${string}`),
  CERMIN_FACTORY_ADDRESS: Hex,
  MEZO_PRICE_FEED_ADDRESS: Hex,
  MEZO_SORTED_TROVES_ADDRESS: Hex,
  POLL_INTERVAL_MS: z.coerce.number().default(600_000),
  DB_PATH: z.string().default('./data/cermin.db'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse(process.env);
}
