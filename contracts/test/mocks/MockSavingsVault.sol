// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Simple 1:1 ERC4626 vault mock with optional simulated yield
contract MockSavingsVault is ERC4626 {
    uint256 private _extraAssets; // simulated yield

    constructor(address musd_) ERC20("sMUSD", "sMUSD") ERC4626(IERC20(musd_)) {}

    /// @notice Simulate yield accrual by minting MUSD directly to the vault
    function accrueYield(uint256 amount) external {
        // Transfer MUSD from caller to simulate vault yield
        IERC20(asset()).transferFrom(msg.sender, address(this), amount);
        _extraAssets += amount;
    }

    /// @notice Total assets includes deposited principal plus simulated yield
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }
}
