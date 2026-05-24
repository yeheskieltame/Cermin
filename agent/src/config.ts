import { z } from 'zod';

const Hex = z.string().regex(/^0x[0-9a-fA-F]{40}$/).transform(v => v as `0x${string}`);

const ConfigSchema = z.object({
  MEZO_TESTNET_RPC: z.string().url(),
  PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/).transform(v => v as `0x${string}`),
  CERMIN_FACTORY_ADDRESS: Hex,
  MEZO_PRICE_FEED_ADDRESS: Hex,
  // Reserved for production hint generation; unused while computeHints() returns
  // the 0x0 "no hint" pair, so it's optional to keep deploy config minimal.
  MEZO_SORTED_TROVES_ADDRESS: Hex.optional(),
  POLL_INTERVAL_MS: z.coerce.number().default(600_000),
  DB_PATH: z.string().default('./data/cermin.db'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // ── Savings-yield simulation ────────────────────────────────────────────
  // On mainnet the Mezo savings vault is fed by PCV (real protocol fees).
  // On testnet (mock vault) nothing pushes yield, so the keeper streams a
  // small, timestamp-proportional amount each interval to mirror that — i.e.
  // it plays the role of PCV. Off by default; the signer must hold MUSD.
  MUSD_ADDRESS: Hex.default('0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503'),
  SAVINGS_VAULT_ADDRESS: Hex.default('0xbcF023FF88ed5790a999AbE760dbD9d156c690a9'),
  YIELD_ENABLED: z.string().optional().default('false').transform(v => v === 'true'),
  YIELD_APR_BPS: z.coerce.number().int().min(0).max(50_000).default(500),
  YIELD_MIN_INTERVAL_MS: z.coerce.number().default(3_600_000),
  YIELD_MAX_CATCHUP_MS: z.coerce.number().default(86_400_000),

  // ── Keeper safety / observability ───────────────────────────────────────
  // Warn when the signer's BTC (gas) balance drops below this. Out-of-gas means
  // skim/defend silently fail — and a missed defend risks liquidation. 1e15 wei
  // = 0.001 BTC. Accepts a decimal-wei string to dodge JS number precision.
  GAS_WARN_THRESHOLD_WEI: z.string().default('1000000000000000').transform(v => BigInt(v)),
  // Health server. Railway injects PORT for its healthcheck; index prefers that.
  HEALTH_PORT: z.coerce.number().int().positive().default(8080),
  // A single cycle should finish well within the poll interval; if it runs
  // longer the watchdog marks the process unhealthy so the platform can restart.
  CYCLE_TIMEOUT_MS: z.coerce.number().int().positive().default(300_000),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse(process.env);
}
