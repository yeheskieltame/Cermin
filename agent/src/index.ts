import pino, { type Logger } from 'pino';
import type { Hash } from 'viem';

import { loadConfig, type Config } from './config.js';
import { createClients, type AgentClients } from './rpc/clients.js';
import { mapWithLimit } from './rpc/retry.js';
import { fetchPriceAndVaults, snapshotVault, decide } from './monitors/vaults.js';
import { executeSkim } from './executors/skim.js';
import { executeDefend } from './executors/defend.js';
import { initDb, recordAction } from './storage/actionLog.js';
import type { Action } from './types.js';

interface Deps {
  config: Config;
  clients: AgentClients;
  logger: Logger;
  db: ReturnType<typeof initDb>;
}

const VAULT_CONCURRENCY = 5;

async function processVault(deps: Deps, vault: `0x${string}`, price: bigint): Promise<void> {
  const { clients, logger, db } = deps;
  const snap = await snapshotVault(clients.publicClient, vault);
  const { action, reason } = decide(snap, price);
  logger.info({ vault, action, icr: snap.icrBps }, reason);

  let txHash: Hash | undefined;
  try {
    if (action === 'DEFEND') {
      txHash = await executeDefend(clients.publicClient, clients.walletClient, vault);
    } else if (action === 'SKIM') {
      txHash = await executeSkim(clients.publicClient, clients.walletClient, vault);
    }
  } catch (err) {
    logger.error({ vault, action, err }, 'tx execution failed');
  }

  if (txHash) logger.info({ vault, action, txHash }, 'tx submitted');

  recordAction(db, {
    vault,
    action: action as Action,
    reason,
    txHash,
    timestamp: Date.now(),
  });
}

async function runCycle(deps: Deps): Promise<void> {
  const { clients, config, logger } = deps;
  const start = Date.now();

  const { price, vaults } = await fetchPriceAndVaults(clients.publicClient, config);
  logger.info({ btcUsd: (Number(price) / 1e18).toFixed(0), vaults: vaults.length }, 'cycle start');

  if (vaults.length === 0) {
    logger.info('no vaults yet, skipping');
    return;
  }

  const results = await mapWithLimit(vaults, VAULT_CONCURRENCY, vault =>
    processVault(deps, vault, price),
  );

  const failed = results.filter(r => r.status === 'rejected').length;
  logger.info(
    { durationMs: Date.now() - start, vaults: vaults.length, failed },
    'cycle complete',
  );
}

async function main(): Promise<void> {
  const config = loadConfig();
  const isProd = process.env['NODE_ENV'] === 'production';
  const logger = pino({
    level: config.LOG_LEVEL,
    transport: isProd ? undefined : { target: 'pino-pretty', options: { colorize: true } },
  });
  const db = initDb(config.DB_PATH);
  const clients = createClients(config);
  const deps: Deps = { config, clients, logger, db };

  logger.info({ rpc: config.MEZO_TESTNET_RPC, intervalMs: config.POLL_INTERVAL_MS }, 'Cermin agent starting');

  let running = false;
  let stopped = false;

  const tick = async (): Promise<void> => {
    if (stopped || running) {
      if (running) logger.warn('previous cycle still running, skipping');
      return;
    }
    running = true;
    try {
      await runCycle(deps);
    } catch (err) {
      logger.error({ err }, 'cycle error');
    } finally {
      running = false;
    }
  };

  await tick();
  const handle = setInterval(tick, config.POLL_INTERVAL_MS);

  const shutdown = (signal: string): void => {
    if (stopped) return;
    stopped = true;
    logger.info({ signal }, 'shutting down');
    clearInterval(handle);
    db.close();
    // Give in-flight tx a brief grace period before exit.
    setTimeout(() => process.exit(0), running ? 5_000 : 0).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
