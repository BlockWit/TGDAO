// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/ICallbackContract.sol";
import "./RecoverableFunds.sol";
import "./WithCallback.sol";

interface ILiquidityRestrictor {
    function assureByAgent(
        address token,
        address from,
        address to
    ) external returns (bool allow, string memory message);

    function assureLiquidityRestrictions(address from, address to)
    external
    returns (bool allow, string memory message);
}

interface IAntisnipe {
    function assureCanTransfer(
        address sender,
        address from,
        address to,
        uint256 amount
    ) external returns (bool response);
}

/**
 * @dev TGDAO Token
 */
contract TGDAOToken is ERC20, ERC20Burnable, RecoverableFunds, WithCallback {
    constructor(
        address[] memory initialAccounts,
        uint256[] memory initialBalances
    ) payable ERC20("TGDAO", "TGDAO") {
        for (uint8 i = 0; i < initialAccounts.length; i++) {
            _mint(initialAccounts[i], initialBalances[i]);
        }
    }

    function _burn(address account, uint256 amount) internal override {
        super._burn(account, amount);
        _burnCallback(account, amount);
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal override {
        super._transfer(sender, recipient, amount);
        _transferCallback(sender, recipient, amount);
    }

    IAntisnipe public antisnipe = IAntisnipe(address(0));
    ILiquidityRestrictor public liquidityRestrictor =
    ILiquidityRestrictor(0xeD1261C063563Ff916d7b1689Ac7Ef68177867F2);

    bool public antisnipeEnabled = true;
    bool public liquidityRestrictionEnabled = true;

    event AntisnipeDisabled(uint256 timestamp, address user);
    event LiquidityRestrictionDisabled(uint256 timestamp, address user);
    event AntisnipeAddressChanged(address addr);
    event LiquidityRestrictionAddressChanged(address addr);

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from == address(0) || to == address(0)) return;
        if (
            liquidityRestrictionEnabled &&
            address(liquidityRestrictor) != address(0)
        ) {
            (bool allow, string memory message) = liquidityRestrictor
            .assureLiquidityRestrictions(from, to);
            require(allow, message);
        }

        if (antisnipeEnabled && address(antisnipe) != address(0)) {
            require(antisnipe.assureCanTransfer(msg.sender, from, to, amount));
        }
    }

    function setAntisnipeDisable() external onlyOwner {
        require(antisnipeEnabled);
        antisnipeEnabled = false;
        emit AntisnipeDisabled(block.timestamp, msg.sender);
    }

    function setLiquidityRestrictorDisable() external onlyOwner {
        require(liquidityRestrictionEnabled);
        liquidityRestrictionEnabled = false;
        emit LiquidityRestrictionDisabled(block.timestamp, msg.sender);
    }

    function setAntisnipeAddress(address addr) external onlyOwner {
        antisnipe = IAntisnipe(addr);
        emit AntisnipeAddressChanged(addr);
    }

    function setLiquidityRestrictionAddress(address addr) external onlyOwner {
        liquidityRestrictor = ILiquidityRestrictor(addr);
        emit LiquidityRestrictionAddressChanged(addr);
    }
}
