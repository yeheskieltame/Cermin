// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Script, console2} from "forge-std/Script.sol";
import {CerminFactory} from "../src/CerminFactory.sol";
import {CerminVault} from "../src/CerminVault.sol";
import {ICerminVault} from "../src/interfaces/ICerminVault.sol";
import {IPriceFeed} from "../src/interfaces/mezo/IPriceFeed.sol";
import {ISortedTroves} from "../src/interfaces/mezo/ISortedTroves.sol";

interface IHintHelpers {
    function computeNominalCR(uint256 coll, uint256 debt) external pure returns (uint256);
    function getApproxHint(uint256 cr, uint256 numTrials, uint256 seed)
        external view returns (address hint, uint256 diff, uint256 latestSeed);
}

/// @notice End-to-end smoke test against the deployed CerminFactory on
///         Mezo matsnet. Computes SortedTroves hints first (the 181-trove
///         linked list will OutOfGas without them), then exercises open
///         → state inspection → skim/defend revert checks → close.
contract TestnetSmoke is Script {
    address constant FACTORY      = 0xd927F1233Cd0596C38457a414EC3a770D73c4B1B;
    address constant PRICE_FEED   = 0x86bCF0841622a5dAC14A313a15f96A95421b9366;
    address constant HINT_HELPERS = 0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6;
    address constant SORTED       = 0x722E4D24FD6Ff8b0AC679450F3D91294607268fA;

    // 200 MUSD gas comp baked into every Mezo trove's debt.
    uint256 constant GAS_COMP = 200e18;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address me = vm.addr(pk);

        console2.log("=== Cermin matsnet smoke test ===");
        console2.log("Caller:        ", me);
        console2.log("Balance:       ", me.balance);

        // 0.045 BTC collateral, 75% LTV → ~2575 MUSD borrow (above the 2000 floor).
        uint256 coll = 0.045 ether;
        uint256 price = IPriceFeed(PRICE_FEED).fetchPrice();
        console2.log("BTC price 1e18:", price);

        uint256 borrow = (coll * price * 7500) / (1e18 * 10_000);
        uint256 totalDebt = borrow + GAS_COMP;
        console2.log("borrow (MUSD): ", borrow);
        console2.log("total debt:    ", totalDebt);

        uint256 nicr = IHintHelpers(HINT_HELPERS).computeNominalCR(coll, totalDebt);
        console2.log("NICR:          ", nicr);

        // Approximate hint with sqrt(N)*15 trials — well above the 14 recommended for 181 troves.
        (address approx,,) = IHintHelpers(HINT_HELPERS).getApproxHint(nicr, 200, uint256(blockhash(block.number - 1)));
        console2.log("approxHint:    ", approx);

        // Refine to the exact (upper, lower) insert pair.
        (address upper, address lower) = ISortedTroves(SORTED).findInsertPosition(nicr, approx, approx);
        console2.log("upperHint:     ", upper);
        console2.log("lowerHint:     ", lower);

        ICerminVault.VaultParams memory p = ICerminVault.VaultParams({
            targetLTV: 7_500,
            defendICR: 12_000,
            emergencyICR: 11_700,
            skimThresholdBps: 300,
            spendableShare: 5_000
        });

        CerminFactory factory = CerminFactory(FACTORY);

        vm.startBroadcast(pk);

        // ── OPEN ────────────────────────────────────────────────────────
        console2.log("\n[OPEN] createVault with 0.045 BTC, hinted ...");
        address vaultAddr = factory.createVault{value: coll}(p, 0, upper, lower);
        console2.log("  vault:", vaultAddr);
        CerminVault v = CerminVault(payable(vaultAddr));

        _logState(v, "after OPEN");

        // ── SKIM (expect revert PriceMoveBelowThreshold) ────────────────
        console2.log("\n[SKIM] expect revert PriceMoveBelowThreshold");
        try v.skim(upper, lower) {
            console2.log("  UNEXPECTED: skim succeeded");
        } catch (bytes memory reason) {
            _logRevert(reason);
        }

        // ── DEFEND (expect revert ICRAboveDefend) ───────────────────────
        console2.log("\n[DEFEND] expect revert ICRAboveDefend");
        try v.defend(upper, lower) {
            console2.log("  UNEXPECTED: defend succeeded");
        } catch (bytes memory reason) {
            _logRevert(reason);
        }

        // ── CLOSE ───────────────────────────────────────────────────────
        console2.log("\n[CLOSE] drain everything ...");
        try v.close() {
            console2.log("  close OK");
        } catch (bytes memory reason) {
            console2.log("  close REVERTED:");
            _logRevert(reason);
        }

        _logState(v, "after CLOSE");

        console2.log("\nFinal caller balance:", me.balance);

        vm.stopBroadcast();
    }

    function _logState(CerminVault v, string memory label) private view {
        ICerminVault.VaultState memory s = v.state();
        console2.log("--- state", label, "---");
        console2.log("  debt:        ", v.getDebt());
        console2.log("  collateral:  ", v.getCollateral());
        console2.log("  ICR (bps):   ", v.getICR());
        console2.log("  spendable:   ", s.spendableMusd);
        console2.log("  smusdShares: ", s.smusdShares);
        console2.log("  lastSkimPx:  ", s.lastSkimPrice);
        console2.log("  lastSeenPx:  ", s.lastSeenPrice);
    }

    function _logRevert(bytes memory reason) private pure {
        if (reason.length >= 4) {
            bytes4 sel;
            assembly { sel := mload(add(reason, 32)) }
            console2.logBytes4(sel);
        } else {
            console2.log("  reverted without data");
        }
    }
}
