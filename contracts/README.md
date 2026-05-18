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

# deploy to Mezo testnet (after filling Mezo addresses in script/Deploy.s.sol)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $MEZO_TESTNET_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Notes

- `via_ir = true` is enabled in `foundry.toml` to compile the vault under stack-deep inlining.
- The implementation contract calls `_initialized = true` in its constructor — only clones can be initialized.
- `defend()` is permissionless. Anyone can trigger it when ICR drops below `defendICR`.
- See `BLUEPRINT.md` (project root) for the full spec and validation rules.
