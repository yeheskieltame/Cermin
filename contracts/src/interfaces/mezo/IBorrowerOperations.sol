// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IBorrowerOperations — Mezo BorrowerOperations interface (subset used by Cermin)
interface IBorrowerOperations {
    /// @notice Open a new trove, minting MUSD against deposited BTC collateral
    function openTrove(
        uint256 _maxFeePercentage,
        uint256 _MUSDAmount,
        address _upperHint,
        address _lowerHint
    ) external payable;

    /// @notice Adjust an existing trove (add/withdraw collateral, increase/decrease debt)
    function adjustTrove(
        uint256 _maxFeePercentage,
        uint256 _collWithdrawal,
        uint256 _MUSDChange,
        bool _isDebtIncrease,
        address _upperHint,
        address _lowerHint
    ) external payable;

    /// @notice Repay MUSD to reduce debt
    function repayMUSD(
        uint256 _MUSDAmount,
        address _upperHint,
        address _lowerHint
    ) external;

    /// @notice Withdraw additional MUSD, increasing debt
    function withdrawMUSD(
        uint256 _maxFeePercentage,
        uint256 _MUSDAmount,
        address _upperHint,
        address _lowerHint
    ) external;

    /// @notice Add BTC collateral to an existing trove
    function addColl(address _upperHint, address _lowerHint) external payable;

    /// @notice Close trove, repay all debt, receive BTC collateral back
    function closeTrove() external;
}
