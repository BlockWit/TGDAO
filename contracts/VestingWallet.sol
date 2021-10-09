// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IERC20Cutted.sol";
import "./RecoverableFunds.sol";

contract VestingWallet is Ownable, RecoverableFunds {

    using SafeMath for uint256;

    IERC20Cutted public token;
    uint256 public start;
    uint256 public duration;
    uint256 public interval;
    uint256 public initialTokens;
    uint256 public withdrawedTokens;
    bool private isActive;

    modifier notActive() {
        require(!isActive, "Already active");
        _;
    }

    constructor(uint256 _start, uint256 _duration, uint256 _interval) {
        start = _start;
        duration = _duration;
        interval = _interval;
    }

    function setToken(address tokenAddress) public onlyOwner notActive {
        token = IERC20Cutted(tokenAddress);
    }

    function init() public onlyOwner notActive {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "Initial balance is empty");
        initialTokens = balance;
        isActive = true;
    }

    function withdraw() public onlyOwner {
        require(block.timestamp >= start, "No tokens available for withdrawal at this moment");
        if (block.timestamp >= start.add(duration)) {
            token.transfer(msg.sender, token.balanceOf(address(this)));
        } else {
            uint256 parts = duration.div(interval);
            uint256 tokensByPart = initialTokens.div(parts);
            uint256 timeSinceStart = block.timestamp.sub(start);
            uint256 pastParts = timeSinceStart.div(interval);
            uint256 tokensToWithdrawSinceStart = pastParts.mul(tokensByPart);
            uint256 tokensToWithdraw = tokensToWithdrawSinceStart.sub(withdrawedTokens);
            require(tokensToWithdraw > 0, "No tokens available for withdrawal at this moment");
            withdrawedTokens = withdrawedTokens.add(tokensToWithdraw);
            token.transfer(msg.sender, tokensToWithdraw);
        }
    }

    function retrieveTokens(address to, address anotherToken) override public onlyOwner {
        require(address(token) != anotherToken, "You should only use this method to withdraw extraneous tokens");
        super.retrieveTokens(to, anotherToken);
    }

}
