// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CerminVault} from "../src/CerminVault.sol";
import {CerminFactory} from "../src/CerminFactory.sol";
import {MockSavingsVault} from "../test/mocks/MockSavingsVault.sol";

/// @title Deploy — CerminVault impl + CerminFactory to Mezo testnet
/// @notice All Mezo singleton addresses are read from environment variables so
///         the script is reproducible without editing source. See `.env.example`
///         in the contracts/ root for the required keys.
///
///         Usage:
///           cp .env.example .env  # then fill in the addresses
///           source .env
///           forge script script/Deploy.s.sol:Deploy \
///             --rpc-url $MEZO_TESTNET_RPC \
///             --private-key $PRIVATE_KEY \
///             --broadcast \
///             --verify \
///             --verifier blockscout \
///             --verifier-url $MEZO_EXPLORER_API
contract Deploy is Script {
    function run() external {
        address borrowerOps  = vm.envAddress("MEZO_BORROWER_OPS");
        address troveManager = vm.envAddress("MEZO_TROVE_MANAGER");
        address priceFeed    = vm.envAddress("MEZO_PRICE_FEED");
        address musd         = vm.envAddress("MEZO_MUSD");
        address savingsVault = vm.envOr("MEZO_SAVINGS_VAULT", address(0));

        _requireNonZero(borrowerOps,  "MEZO_BORROWER_OPS");
        _requireNonZero(troveManager, "MEZO_TROVE_MANAGER");
        _requireNonZero(priceFeed,    "MEZO_PRICE_FEED");
        _requireNonZero(musd,         "MEZO_MUSD");

        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        console2.log("Deployer:    ", deployer);
        console2.log("Chain ID:    ", block.chainid);
        console2.log("BorrowerOps: ", borrowerOps);
        console2.log("TroveManager:", troveManager);
        console2.log("PriceFeed:   ", priceFeed);
        console2.log("MUSD:        ", musd);

        vm.startBroadcast(pk);

        // Mezo hasn't deployed MUSDSavingsRate on matsnet yet. If the env
        // var is unset, deploy a 100% behavioural mirror so the rest of
        // Cermin (vault + factory) can be exercised end-to-end on testnet.
        if (savingsVault == address(0)) {
            console2.log("MEZO_SAVINGS_VAULT unset; deploying MockSavingsVault stand-in");
            savingsVault = address(new MockSavingsVault(musd));
            console2.log("MockSavingsVault:", savingsVault);
        } else {
            console2.log("SavingsVault:", savingsVault);
        }

        CerminVault impl = new CerminVault(
            borrowerOps,
            troveManager,
            priceFeed,
            musd,
            savingsVault
        );
        CerminFactory factory = new CerminFactory(address(impl));

        vm.stopBroadcast();

        console2.log("\n=== DEPLOY DONE ===");
        console2.log("MockSavingsVault (if any):", savingsVault);
        console2.log("CerminVault impl:         ", address(impl));
        console2.log("CerminFactory:            ", address(factory));
        console2.log("\nCopy into agent/.env and frontend/.env:");
        console2.log("CERMIN_SAVINGS_VAULT_ADDRESS=%s", savingsVault);
        console2.log("CERMIN_VAULT_IMPL_ADDRESS=%s", address(impl));
        console2.log("CERMIN_FACTORY_ADDRESS=%s", address(factory));
    }

    function _requireNonZero(address a, string memory name) private pure {
        require(a != address(0), string.concat("Missing env: ", name));
    }
}
