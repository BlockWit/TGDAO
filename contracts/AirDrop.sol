// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RecoverableFunds.sol";

/**
 * @dev AirDrop contract
 */
contract AirDrop is RecoverableFunds {

    IERC20 public token;

    function setToken(address tokenAddress) public onlyOwner() {
        token = IERC20(tokenAddress);
    }

    function balanceOfPredefinedToken() public view returns(uint) {
        return token.balanceOf(address(token));
    }

    function airdropMultiple(address tokenAddress, address[] memory addresses, uint[] memory values) public onlyOwner() {
        require(addresses.length == values.length, "Addreses and values size must equals");
        IERC20 localToken = IERC20(tokenAddress);
        for(uint i = 0; i<addresses.length; i++) {
            localToken.transfer(addresses[i], values[i]);
        }
    }

    function airdropMultipleWithPredefinedToken(address[] memory addresses, uint[] memory values) public onlyOwner() {
        require(addresses.length == values.length, "Addreses and values size must equals");
        for(uint i = 0; i<addresses.length; i++) {
            token.transfer(addresses[i], values[i]);
        }
    }

    function airdropMultipleEquals(uint value, address tokenAddress, address[] memory addresses) public onlyOwner() {
        IERC20 localToken = IERC20(tokenAddress);
        for(uint i = 0; i<addresses.length; i++) {
            localToken.transfer(addresses[i], value);
        }
    }

    function airdropMultipleWithEqualsPredefinedToken(uint value, address[] memory addresses) public onlyOwner() {
        for(uint i = 0; i<addresses.length; i++) {
            token.transfer(addresses[i], value);
        }
    }

}
