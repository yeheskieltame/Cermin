import test from 'node:test';
import assert from 'node:assert/strict';
import { decide } from './vaults.js';
import type { VaultParams, VaultSnapshot, VaultState } from '../types.js';

const PRICE = 100_000n * 10n ** 18n; // $100k, 1e18-scaled

const baseParams: VaultParams = {
  targetLTV: 5000,
  defendICR: 14000,
  emergencyICR: 12000,
  skimThresholdBps: 500,
  spendableShare: 5000,
};

const baseState: VaultState = {
  lastSkimPrice: PRICE,
  lastSeenPrice: PRICE,
  spendableMusd: 0n,
  smusdShares: 0n,
  createdAt: 0n,
};

function snap(over: {
  icrBps?: number;
  params?: Partial<VaultParams>;
  state?: Partial<VaultState>;
} = {}): VaultSnapshot {
  return {
    address: '0x0000000000000000000000000000000000000001',
    owner: '0x0000000000000000000000000000000000000002',
    params: { ...baseParams, ...over.params },
    state: { ...baseState, ...over.state },
    icrBps: over.icrBps ?? 20000,
    debt: 2000n * 10n ** 18n,
    collateral: 1n * 10n ** 18n,
  };
}

test('DEFEND when ICR is below defendICR', () => {
  assert.equal(decide(snap({ icrBps: 13000 }), PRICE).action, 'DEFEND');
});

test('HOLD when healthy and price is unchanged', () => {
  assert.equal(decide(snap({ icrBps: 20000, state: { lastSkimPrice: PRICE } }), PRICE).action, 'HOLD');
});

test('SKIM when price rose past the threshold', () => {
  const last = 100_000n * 10n ** 18n;
  const now = 106_000n * 10n ** 18n; // +6% > 5% threshold
  assert.equal(
    decide(snap({ icrBps: 20000, params: { skimThresholdBps: 500 }, state: { lastSkimPrice: last } }), now).action,
    'SKIM',
  );
});

test('HOLD when price rose but below the threshold', () => {
  const last = 100_000n * 10n ** 18n;
  const now = 102_000n * 10n ** 18n; // +2% < 5%
  assert.equal(
    decide(snap({ icrBps: 20000, params: { skimThresholdBps: 500 }, state: { lastSkimPrice: last } }), now).action,
    'HOLD',
  );
});

test('no SKIM when lastSkimPrice is zero (never skimmed)', () => {
  assert.equal(decide(snap({ icrBps: 20000, state: { lastSkimPrice: 0n } }), PRICE).action, 'HOLD');
});

test('DEFEND takes priority over a skim-worthy move', () => {
  const last = 100_000n * 10n ** 18n;
  const now = 200_000n * 10n ** 18n; // +100%, but ICR is unhealthy
  assert.equal(
    decide(snap({ icrBps: 13000, state: { lastSkimPrice: last } }), now).action,
    'DEFEND',
  );
});

test('HOLD when price fell (no skim on a downward move)', () => {
  const last = 100_000n * 10n ** 18n;
  const now = 95_000n * 10n ** 18n;
  assert.equal(
    decide(snap({ icrBps: 20000, state: { lastSkimPrice: last } }), now).action,
    'HOLD',
  );
});
