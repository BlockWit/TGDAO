// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

/**
 * @dev Interface of MultiWallet contract.
 */
interface IMultiWallet {

    function deposit(uint256 schedule, address beneficiary, uint256 amount) external;

}
