pragma solidity ^0.6.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../util/IERC20Cutted.sol";
import "../util/RetrieveTokensFeature.sol";


contract TokenDistributor is Ownable, RetrieveTokensFeature {

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
