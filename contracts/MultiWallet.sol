// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RecoverableFunds.sol";
import "./Vesting.sol";

contract MultiWallet is Ownable, Pausable, RecoverableFunds {

    using SafeMath for uint256;
    using Vesting for Vesting.Map;

    IERC20 public token;
    Vesting.Map private schedules;
    mapping(uint256 => mapping(address => Vesting.Balance)) public balances;

    event Deposit(address account, uint256 tokens);
    event Withdrawal(address account, uint256 tokens);

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setToken(address tokenAddress) public onlyOwner {
        token = IERC20(tokenAddress);
    }

    function setVestingSchedule(uint256 id, uint256 start, uint256 duration, uint256 interval) public onlyOwner {
        Vesting.Schedule memory schedule = Vesting.Schedule(start, duration, interval);
        schedules.set(id, schedule);
    }

    function getVestingSchedule(uint256 id) public view returns (Vesting.Schedule memory) {
        return schedules.get(id);
    }

    function setBalance(uint256 schedule, address account, uint256 initial, uint256 withdrawn) public onlyOwner {
        Vesting.Balance storage balance = balances[schedule][account];
        balance.initial = initial;
        balance.withdrawn = withdrawn;
    }

    function addBalances(uint256 schedule, address[] calldata addresses, uint256[] calldata amounts) public onlyOwner {
        require(addresses.length == amounts.length, "MultiWallet: Incorrect array length.");
        for (uint256 i = 0; i < addresses.length; i++) {
            Vesting.Balance storage balance = balances[schedule][addresses[i]];
            balance.initial = balance.initial.add(amounts[i]);
            emit Deposit(addresses[i], amounts[i]);
        }
    }

    function deposit(uint256 schedule, address beneficiary, uint256 amount) public {
        token.transferFrom(msg.sender, address(this), amount);
        Vesting.Balance storage balance = balances[schedule][beneficiary];
        balance.initial = balance.initial.add(amount);
        emit Deposit(beneficiary, amount);
    }

    function getAccountInfo(address account) public view returns (uint256, uint256, uint256) {
        uint256 initial;
        uint256 withdrawn;
        uint256 vested;
        for (uint256 index = 0; index < schedules.length(); index++) {
            Vesting.Balance memory balance = balances[index][account];
            Vesting.Schedule memory schedule = schedules.get(index);
            uint256 vestedAmount = calculateVestedAmount(balance, schedule);
            initial = initial.add(balance.initial);
            withdrawn = withdrawn.add(balance.withdrawn);
            vested = vested.add(vestedAmount);
        }
        return (initial, withdrawn, vested);
    }

    function withdraw() public whenNotPaused returns (uint256) {
        uint256 tokens;
        for (uint256 index = 0; index < schedules.length(); index++) {
            Vesting.Balance storage balance = balances[index][msg.sender];
            if (balance.initial == 0) continue;
            Vesting.Schedule memory schedule = schedules.get(index);
            uint256 vestedAmount = calculateVestedAmount(balance, schedule);
            if (vestedAmount == 0) continue;
            balance.withdrawn = balance.withdrawn.add(vestedAmount);
            tokens = tokens.add(vestedAmount);
        }
        require(tokens > 0, "MultiWallet: No tokens available for withdrawal");
        token.transfer(msg.sender, tokens);
        emit Withdrawal(msg.sender, tokens);
        return tokens;
    }

    function calculateVestedAmount(Vesting.Balance memory balance, Vesting.Schedule memory schedule) internal view returns (uint256) {
        if (block.timestamp < schedule.start) return 0;
        uint256 tokensAvailable;
        if (block.timestamp >= schedule.start.add(schedule.duration)) {
            tokensAvailable = balance.initial;
        } else {
            uint256 parts = schedule.duration.div(schedule.interval);
            uint256 tokensByPart = balance.initial.div(parts);
            uint256 timeSinceStart = block.timestamp.sub(schedule.start);
            uint256 pastParts = timeSinceStart.div(schedule.interval);
            tokensAvailable = tokensByPart.mul(pastParts);
        }
        return tokensAvailable.sub(balance.withdrawn);
    }

}
