// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./RecoverableFunds.sol";
import "./interfaces/ICallbackContract.sol";
import "./WithCallback.sol";

/**
 * @dev TGDAO Token
 */
contract TGDAOToken is ERC20, ERC20Burnable, Pausable, RecoverableFunds, WithCallback {

    constructor(address[] memory initialAccounts, uint256[] memory initialBalances) payable ERC20("TGDAO", "TGDAO") {
        for(uint8 i = 0; i < initialAccounts.length; i++) {
            _mint(initialAccounts[i], initialBalances[i]);
        }
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _burn(address account, uint256 amount) internal override {
        super._burn(account, amount);
        _burnCallback(account, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount) internal override {
        super._transfer(sender, recipient, amount);
        _transferCallback(sender, recipient, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override notPaused(from) {
        super._beforeTokenTransfer(from, to, amount);
    }

}
