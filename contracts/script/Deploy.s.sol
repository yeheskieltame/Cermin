// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CerminVault} from "../src/CerminVault.sol";
import {CerminFactory} from "../src/CerminFactory.sol";

/// @notice Deploy script for Mezo testnet. Two contracts: vault implementation + factory.
/// @dev Set MEZO_TESTNET_RPC + PRIVATE_KEY in .env, then fill the addresses below before
///      running. After deploy, copy the factory address into the agent + frontend env files.
contract Deploy is Script {
    // Mezo testnet addresses — fill before running.
    // Source: https://mezo.org/docs/developers/
    address constant BORROWER_OPS  = address(0); // TODO: BorrowerOperations
    address constant TROVE_MANAGER = address(0); // TODO: TroveManager
    address constant PRICE_FEED    = address(0); // TODO: PriceFeed
    address constant MUSD          = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    address constant SAVINGS_VAULT = address(0); // TODO: MUSD Savings Vault

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);

        vm.startBroadcast(pk);

        CerminVault impl = new CerminVault(
            BORROWER_OPS,
            TROVE_MANAGER,
            PRICE_FEED,
            MUSD,
            SAVINGS_VAULT
        );
        console2.log("CerminVault impl:", address(impl));

        CerminFactory factory = new CerminFactory(address(impl));
        console2.log("CerminFactory:   ", address(factory));

        vm.stopBroadcast();

        console2.log("\n=== DEPLOY DONE ===");
        console2.log("CERMIN_FACTORY_ADDRESS=%s", address(factory));
        console2.log("CERMIN_VAULT_IMPL_ADDRESS=%s", address(impl));
    }
}
