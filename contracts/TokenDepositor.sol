// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IVestingWallet.sol";
import "./RecoverableFunds.sol";

contract TokenDepositor is RecoverableFunds {

    using SafeMath for uint256;

    IERC20 public token;
    IVestingWallet public vestingWallet;

    function setToken(address newTokenAddress) public onlyOwner {
        token = IERC20(newTokenAddress);
    }

    function setVestingWallet(address newVestingWalletAddress) public onlyOwner {
        vestingWallet = IVestingWallet(newVestingWalletAddress);
    }

    function deposit(uint256 unlocked, uint256 schedule, address[] calldata beneficiaries, uint256[] calldata amounts) public onlyOwner {
        uint256 totalAmount;
        for (uint256 i; i < amounts.length; i++) {
            totalAmount = totalAmount.add(amounts[i]);
        }
        token.approve(address(vestingWallet), totalAmount);
        if (unlocked == 0) {
            vestingWallet.deposit(schedule, beneficiaries, amounts);
        } else {
            uint256[] memory unlockedAmounts = new uint256[](amounts.length);
            uint256[] memory lockedAmounts = new uint256[](amounts.length);
            for (uint256 i; i < amounts.length; i++) {
                unlockedAmounts[i] = amounts[i].mul(unlocked).div(100);
                lockedAmounts[i] = amounts[i].sub(unlockedAmounts[i]);
            }
            vestingWallet.deposit(0, beneficiaries, unlockedAmounts);
            vestingWallet.deposit(schedule, beneficiaries, lockedAmounts);
        }
    }
}
