// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {CerminVault} from "../../src/CerminVault.sol";
import {CerminFactory} from "../../src/CerminFactory.sol";
import {ICerminVault} from "../../src/interfaces/ICerminVault.sol";

import {MockBorrowerOperations} from "../mocks/MockBorrowerOperations.sol";
import {MockTroveManager} from "../mocks/MockTroveManager.sol";
import {MockPriceFeed} from "../mocks/MockPriceFeed.sol";
import {MockSavingsVault} from "../mocks/MockSavingsVault.sol";
import {MockMUSD} from "../mocks/MockMUSD.sol";

contract CerminVaultTest is Test {
    CerminVault internal impl;
    CerminFactory internal factory;
    CerminVault internal vault;

    MockBorrowerOperations internal borrowerOps;
    MockTroveManager internal troveManager;
    MockPriceFeed internal priceFeed;
    MockSavingsVault internal savingsVault;
    MockMUSD internal musd;

    address internal user = makeAddr("user");
    address internal keeper = makeAddr("keeper");

    uint256 internal constant BTC_PRICE = 100_000e18;
    uint256 internal constant ONE_BTC = 1e18;

    function _balancedParams() internal pure returns (ICerminVault.VaultParams memory) {
        return ICerminVault.VaultParams({
            targetLTV: 5_000,        // 50%
            defendICR: 14_000,       // 140%
            emergencyICR: 12_000,    // 120%
            skimThresholdBps: 500,   // 5%
            spendableShare: 5_000    // 50%
        });
    }

    function setUp() public {
        musd = new MockMUSD();
        troveManager = new MockTroveManager();
        borrowerOps = new MockBorrowerOperations(address(musd), address(troveManager));
        troveManager.setBorrowerOps(address(borrowerOps));
        priceFeed = new MockPriceFeed(BTC_PRICE);
        savingsVault = new MockSavingsVault(address(musd));

        impl = new CerminVault(
            address(borrowerOps),
            address(troveManager),
            address(priceFeed),
            address(musd),
            address(savingsVault)
        );
        factory = new CerminFactory(address(impl));

        vm.deal(user, 100 ether);
    }

    function _open(uint256 btc) internal returns (CerminVault v) {
        vm.prank(user);
        address vaultAddr = factory.createVault{value: btc}(_balancedParams(), 0, address(0), address(0));
        v = CerminVault(payable(vaultAddr));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Open
    // ─────────────────────────────────────────────────────────────────────────

    function test_Open_AllocatesSpendableAndVault() public {
        vault = _open(ONE_BTC);

        // 1 BTC × $100k × 50% = $50k borrow. Half spendable, half to vault.
        ICerminVault.VaultState memory s = vault.state();
        assertEq(s.spendableMusd, 25_000e18, "spendable bucket");
        assertGt(s.smusdShares, 0, "vault shares minted");
        assertEq(troveManager.debt(address(vault)), 50_000e18, "trove debt");
        assertEq(troveManager.collateral(address(vault)), ONE_BTC, "trove coll");
        assertEq(s.lastSkimPrice, BTC_PRICE, "skim baseline price");
        assertEq(vault.owner(), user, "owner");
    }

    function test_Open_RevertsWhenBorrowBelowMinDebt() public {
        // Need at least 2000 MUSD debt. At 50% LTV that means $4000 BTC value → 0.04 BTC.
        // Try 0.01 BTC → $1000 borrow → below min.
        vm.deal(user, 1 ether);
        vm.prank(user);
        vm.expectRevert(ICerminVault.MinDebtNotMet.selector);
        factory.createVault{value: 0.01 ether}(_balancedParams(), 0, address(0), address(0));
    }

    function test_Open_HonoursMaxBorrowCap() public {
        vm.prank(user);
        vm.expectRevert(ICerminVault.BorrowExceedsCap.selector);
        factory.createVault{value: ONE_BTC}(_balancedParams(), 10_000e18, address(0), address(0));
    }

    function test_Open_RevertsWhenVaultExists() public {
        _open(ONE_BTC);
        vm.deal(user, 5 ether);
        vm.prank(user);
        vm.expectRevert();
        factory.createVault{value: ONE_BTC}(_balancedParams(), 0, address(0), address(0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Skim
    // ─────────────────────────────────────────────────────────────────────────

    function test_Skim_AddsCapacityWhenPriceRises() public {
        vault = _open(ONE_BTC);
        priceFeed.setPrice(BTC_PRICE * 11 / 10); // +10%

        uint256 spendableBefore = vault.state().spendableMusd;

        vm.prank(keeper);
        vault.skim(address(0), address(0));

        ICerminVault.VaultState memory s = vault.state();
        assertGt(s.spendableMusd, spendableBefore, "spendable grew");
        // 1 BTC × $110k × 50% = $55k cap, debt 50k → 5k new capacity
        assertEq(s.spendableMusd - spendableBefore, 2_500e18, "skim spendable share");
        assertEq(troveManager.debt(address(vault)), 55_000e18, "debt increased");
        assertEq(s.lastSkimPrice, BTC_PRICE * 11 / 10);
    }

    function test_Skim_RevertsBelowThreshold() public {
        vault = _open(ONE_BTC);
        priceFeed.setPrice(BTC_PRICE * 1001 / 1000); // +0.1%, below 5% threshold

        vm.expectRevert(ICerminVault.PriceMoveBelowThreshold.selector);
        vault.skim(address(0), address(0));
    }

    function test_Skim_RevertsWhenPriceFlat() public {
        vault = _open(ONE_BTC);

        vm.expectRevert(ICerminVault.PriceMoveBelowThreshold.selector);
        vault.skim(address(0), address(0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Defend
    // ─────────────────────────────────────────────────────────────────────────

    function test_Defend_DrainsVaultThenRepays() public {
        vault = _open(ONE_BTC);

        // BTC drops to $65k → ICR = 130%, below the 140% defend threshold.
        priceFeed.setPrice(65_000e18);

        uint256 debtBefore = troveManager.debt(address(vault));
        uint256 sharesBefore = vault.state().smusdShares;

        vm.prank(keeper);
        vault.defend(address(0), address(0));

        uint256 debtAfter = troveManager.debt(address(vault));
        assertLt(debtAfter, debtBefore, "debt repaid");
        assertLt(vault.state().smusdShares, sharesBefore, "vault drained first");
    }

    function test_Defend_RevertsWhenIcrAboveThreshold() public {
        vault = _open(ONE_BTC);
        // No price drop; ICR is 200%, above defendICR=140%.
        vm.expectRevert(ICerminVault.ICRAboveDefend.selector);
        vault.defend(address(0), address(0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Withdraw / Close
    // ─────────────────────────────────────────────────────────────────────────

    function test_WithdrawSpendable_OwnerOnly() public {
        vault = _open(ONE_BTC);

        vm.prank(keeper);
        vm.expectRevert(ICerminVault.NotOwner.selector);
        vault.withdrawSpendable(1_000e18, keeper);

        vm.prank(user);
        vault.withdrawSpendable(1_000e18, user);
        assertEq(musd.balanceOf(user), 1_000e18);
        assertEq(vault.state().spendableMusd, 24_000e18);
    }

    function test_Close_ReturnsBtcAndExcessMusd() public {
        vault = _open(ONE_BTC);

        // Simulate yield: top up MockSavingsVault with 1000 MUSD so vault value > debt-share.
        musd.mint(address(this), 1_000e18);
        musd.approve(address(savingsVault), 1_000e18);
        savingsVault.accrueYield(1_000e18);

        uint256 btcBefore = user.balance;

        vm.prank(user);
        vault.close();

        assertEq(troveManager.debt(address(vault)), 0, "debt cleared");
        assertEq(troveManager.collateral(address(vault)), 0, "coll returned");
        assertEq(user.balance, btcBefore + ONE_BTC, "btc back");
        assertGt(musd.balanceOf(user), 0, "musd remainder paid");
    }

    function test_Close_RevertsWhenInsufficientFunds() public {
        vault = _open(ONE_BTC);

        // Owner drains spendable then attempts close — vault value alone covers ~25k
        // of 50k debt; closeTrove path needs full debt held by the caller.
        vm.startPrank(user);
        vault.withdrawSpendable(vault.state().spendableMusd, user);
        vm.expectRevert(ICerminVault.InsufficientFundsToClose.selector);
        vault.close();
        vm.stopPrank();
    }

    function test_Close_OwnerOnly() public {
        vault = _open(ONE_BTC);
        vm.prank(keeper);
        vm.expectRevert(ICerminVault.NotOwner.selector);
        vault.close();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Initialization safety
    // ─────────────────────────────────────────────────────────────────────────

    function test_Implementation_CannotBeInitialized() public {
        vm.expectRevert(ICerminVault.AlreadyInitialized.selector);
        impl.initialize(user, _balancedParams());
    }

    function test_Implementation_OpenReverts() public {
        // Regression for M-01: even with funded BTC, the implementation must
        // reject open() so a griefer cannot create a trove on the impl and
        // lock funds permanently.
        vm.deal(address(this), 1 ether);
        vm.expectRevert(ICerminVault.AlreadyOpened.selector);
        impl.open{value: ONE_BTC}(0, address(0), address(0));
    }

    function test_Clone_CannotBeInitializedTwice() public {
        vault = _open(ONE_BTC);
        vm.expectRevert(ICerminVault.AlreadyInitialized.selector);
        vault.initialize(user, _balancedParams());
    }
}
