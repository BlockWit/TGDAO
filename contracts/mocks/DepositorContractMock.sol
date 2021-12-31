// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IMultiWallet.sol";

contract DepositorContract {

    IERC20 public token;
    IMultiWallet public multiWallet;

    constructor(address tokenAddress, address multiWalletAddress) {
        token = IERC20(tokenAddress);
        multiWallet = IMultiWallet(multiWalletAddress);
    }

    function deposit(uint256 amount) public {
        token.approve(address(multiWallet), amount);
        multiWallet.deposit(1, msg.sender, amount);
    }

}
