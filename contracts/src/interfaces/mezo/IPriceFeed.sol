// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IPriceFeed — Mezo BTC/USD oracle (subset used by Cermin)
/// @notice Verified against live impl on Mezo matsnet (proxy
///         0x86bCF0841622a5dAC14A313a15f96A95421b9366, impl
///         0xec42B37C12b8D73d320f4075A1BCd58B306629c1) on 2026-05-18.
///         Only one method: `fetchPrice()` and it is `view`. The Liquity
///         v1 `lastGoodPrice()` was removed.
interface IPriceFeed {
    /// @notice Returns the current BTC/USD price scaled to 1e18.
    function fetchPrice() external view returns (uint256);
}
