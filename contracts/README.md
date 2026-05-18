# Cermin Contracts

Two-contract Foundry workspace for the Cermin lean architecture.

| Contract | Role |
|----------|------|
| `CerminVault` | Per-user proxy that wraps a single Mezo trove + sMUSD position. Cloned via EIP-1167. |
| `CerminFactory` | Deploys one vault per address; tracks `vaultOf[user]`. |

Mezo addresses (BorrowerOperations / TroveManager / PriceFeed / MUSD / SavingsVault) are baked into the vault implementation as `immutable`, so every clone reads them from the impl bytecode.

## Common commands

```shell
# build
forge build

# run all tests (unit + integration)
forge test -vvv

# coverage
forge coverage

# format
forge fmt

# deploy to Mezo testnet (see "Deploy" section below for env setup)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $MEZO_TESTNET_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Deploy to Mezo testnet

The deploy script reads every Mezo singleton address from environment
variables — no source edits required.

```shell
# 1. Copy the template and fill in the addresses + your funded private key.
cp .env.example .env
$EDITOR .env

# 2. Source it so forge picks up the vars.
set -a; source .env; set +a

# 3. Dry-run first (simulation only, no broadcast).
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $MEZO_TESTNET_RPC

# 4. Broadcast + verify on the Mezo Blockscout explorer.
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $MEZO_TESTNET_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier blockscout \
  --verifier-url $MEZO_EXPLORER_API
```

The script logs the deployed `CerminVault impl` and `CerminFactory`
addresses at the end — copy them into the agent and frontend env files.

Faucet for testnet BTC: https://faucet.test.mezo.org/
Block explorer: https://explorer.test.mezo.org/

## Notes

- `via_ir = true` is enabled in `foundry.toml` to compile the vault under stack-deep inlining.
- The implementation contract calls `_initialized = true` in its constructor — only clones can be initialized.
- `defend()` is permissionless. Anyone can trigger it when ICR drops below `defendICR`.
- See `BLUEPRINT.md` (project root) for the full spec and validation rules.
