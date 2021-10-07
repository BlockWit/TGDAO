// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20Cutted.sol";
import "./RecoverableFunds.sol";


contract TokenDistributor is Ownable, RecoverableFunds {

    IERC20Cutted public token;

    function setToken(address newTokenAddress) public onlyOwner {
        token = IERC20Cutted(newTokenAddress);
    }

    function distribute(address[] memory receivers, uint[] memory balances) public onlyOwner {
        for(uint i = 0; i < receivers.length; i++) {
            token.transfer(receivers[i], balances[i]);
        }
    }

}
