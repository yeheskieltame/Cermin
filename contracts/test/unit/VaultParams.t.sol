// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";

import {CerminVault} from "../../src/CerminVault.sol";
import {CerminFactory} from "../../src/CerminFactory.sol";
import {ICerminVault} from "../../src/interfaces/ICerminVault.sol";

import {MockBorrowerOperations} from "../mocks/MockBorrowerOperations.sol";
import {MockTroveManager} from "../mocks/MockTroveManager.sol";
import {MockPriceFeed} from "../mocks/MockPriceFeed.sol";
import {MockSavingsVault} from "../mocks/MockSavingsVault.sol";
import {MockMUSD} from "../mocks/MockMUSD.sol";

/// @notice Exercises the parameter validation rules in CerminVault.initialize.
contract VaultParamsTest is Test {
    CerminVault internal impl;
    CerminFactory internal factory;

    function setUp() public {
        MockMUSD musd = new MockMUSD();
        MockTroveManager troveManager = new MockTroveManager();
        MockBorrowerOperations bo = new MockBorrowerOperations(address(musd), address(troveManager));
        troveManager.setBorrowerOps(address(bo));
        MockPriceFeed price = new MockPriceFeed(100_000e18);
        MockSavingsVault sv = new MockSavingsVault(address(musd));
        impl = new CerminVault(address(bo), address(troveManager), address(price), address(musd), address(sv));
        factory = new CerminFactory(address(impl));
    }

    function _good() internal pure returns (ICerminVault.VaultParams memory) {
        return ICerminVault.VaultParams({
            targetLTV: 5_000,
            defendICR: 14_000,
            emergencyICR: 12_000,
            skimThresholdBps: 500,
            spendableShare: 5_000
        });
    }

    function _expectInvalid(ICerminVault.VaultParams memory p) internal {
        address user = makeAddr("u");
        vm.deal(user, 10 ether);
        vm.prank(user);
        vm.expectRevert(ICerminVault.InvalidParams.selector);
        factory.createVault{value: 1 ether}(p, 0, address(0), address(0));
    }

    function test_TargetLtvBelowFloor() public {
        ICerminVault.VaultParams memory p = _good();
        p.targetLTV = 999;
        _expectInvalid(p);
    }

    function test_TargetLtvAboveCeiling() public {
        ICerminVault.VaultParams memory p = _good();
        p.targetLTV = 9_001;
        _expectInvalid(p);
    }

    function test_EmergencyIcrBelowFloor() public {
        ICerminVault.VaultParams memory p = _good();
        p.emergencyICR = 11_499;
        _expectInvalid(p);
    }

    function test_DefendIcrNotAboveEmergency() public {
        ICerminVault.VaultParams memory p = _good();
        p.defendICR = p.emergencyICR;
        _expectInvalid(p);
    }

    function test_SkimThresholdOutOfRange() public {
        ICerminVault.VaultParams memory p = _good();
        p.skimThresholdBps = 99;
        _expectInvalid(p);

        p = _good();
        p.skimThresholdBps = 5_001;
        _expectInvalid(p);
    }

    function test_SpendableShareTooHigh() public {
        ICerminVault.VaultParams memory p = _good();
        p.spendableShare = 10_001;
        _expectInvalid(p);
    }

    function test_DefendIcrTooCloseToOpenIcr() public {
        // At 50% LTV the trove opens at ICR=20000. defendICR must be ≤ 19000.
        ICerminVault.VaultParams memory p = _good();
        p.defendICR = 19_500;
        _expectInvalid(p);
    }
}
