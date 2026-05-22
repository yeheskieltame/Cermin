# Cermin Keeper Agent

A deterministic ~200-LOC service that keeps every Cermin vault healthy. No LLM,
no indexer. Each cycle it:

1. Reads the BTC price (`PriceFeed.fetchPrice`) and lists vaults (`factory.allVaults`).
2. Snapshots each vault and decides — purely from on-chain params:
   - `ICR < defendICR` → `vault.defend()` (repay debt from the vault's own Shadow)
   - else BTC moved past `skimThresholdBps` since `lastSkimPrice` → `vault.skim()`
   - else `HOLD`
3. Logs one decision per vault to SQLite.

Calls are simulated first, so a doomed `skim`/`defend` never spends gas.

## Environment

| Var | Example | Notes |
|-----|---------|-------|
| `MEZO_TESTNET_RPC` | `https://rpc.test.mezo.org` | Mezo matsnet RPC |
| `PRIVATE_KEY` | `0x…` (64 hex) | **Keeper signer.** Funds gas + triggers tx. Never commit. |
| `CERMIN_FACTORY_ADDRESS` | `0x58C0adee08715EEaBc61d1de43C8a15ACaB45494` | matsnet v2 factory |
| `MEZO_PRICE_FEED_ADDRESS` | `0x86bCF0841622a5dAC14A313a15f96A95421b9366` | Mezo PriceFeed |
| `MEZO_SORTED_TROVES_ADDRESS` | `0x…` | Required by config; unused while hints are `0x0` (MVP) |
| `POLL_INTERVAL_MS` | `600000` | Cycle interval (10 min) |
| `DB_PATH` | `/data/cermin.db` | Action-log SQLite (Docker sets this) |
| `LOG_LEVEL` | `info` | `debug`/`info`/`warn`/`error` |

The keeper key only signs the permissionless `skim`/`defend` — it can't move
funds anywhere except per the vault's own logic. Fund it with a little testnet
BTC for gas: <https://faucet.test.mezo.org/>.

## Run locally

```bash
cp .env.example .env   # fill PRIVATE_KEY + addresses
npm install
npm run dev            # tsx watch, one cycle then every POLL_INTERVAL_MS
```

## Deploy on Railway (always-on daemon)

1. **New Project → Deploy from GitHub repo** → pick this repo.
2. **Settings → Root Directory = `agent`** (monorepo). Railway uses `agent/Dockerfile`.
3. **Variables** — add every row from the table above. Paste `PRIVATE_KEY`
   from your local `agent/.env` (do **not** commit it).
4. *(Optional)* **Add a Volume** mounted at `/data` so the action log survives
   redeploys. Skipping it is fine — the agent reads vault state fresh each cycle.
5. **Deploy.** Watch the logs for `cycle complete`. Restart policy is
   `ON_FAILURE` (see `railway.json`).

Build/run: the Dockerfile installs deps (with the toolchain `better-sqlite3`
needs), runs `npm run build`, then `node dist/index.js`.
