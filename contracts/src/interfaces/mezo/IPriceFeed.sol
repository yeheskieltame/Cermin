// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IPriceFeed — Mezo BTC/USD price oracle interface
interface IPriceFeed {
    /// @notice Fetches the current BTC/USD price, updating the oracle state
    function fetchPrice() external returns (uint256);

    /// @notice Returns the last cached good price without updating state
    function lastGoodPrice() external view returns (uint256);
}
