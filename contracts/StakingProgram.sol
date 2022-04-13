// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RecoverableFunds.sol";

/**
 * @dev StakingProgram
 */
contract StakingProgram is RecoverableFunds {

    using SafeMath for uint256;

    uint public constant PERCENT_DIVIDER = 100;

    uint8 public constant WITHDRAW_KIND_ALL = 1;

    uint8 public constant WITHDRAW_KIND_BY_PROGRAM = 0;

    address public fineWallet;

    bool public paused = false;

    struct StakeType {
        bool active;
        uint periodInDays;
        uint apy;
        uint finesPeriodsCount;
        mapping(uint => uint) fineDays;
        mapping(uint => uint) fines;
    }

    struct Staker {
        bool exists;
        mapping(uint => bool) closed;
        mapping(uint => uint) amount;
        mapping(uint => uint) amountAfter;
        mapping(uint => uint) stakeType;
        mapping(uint => uint) start;
        mapping(uint => uint) finished;
        uint count;
        uint summerDeposit;
        uint summerAfter;
    }

    uint public copyCounter = 0;

    uint public countOfStakeTypes;

    StakeType[] public stakeTypes;

    mapping(address => Staker) public stakers;

    address[] public stakersAddresses;

    uint public stakersAddressesCount;

    IERC20 public token;

    bool public firstConfigured;

    event Deposit(address account, uint amount, uint stakingTypeIndex, uint stakeIndex);

    event Withdraw(address account, uint amount, uint stakingTypeIndex, uint stakeIndex);

    function configure(address tokenAddress, address inFineWallet) public onlyOwner {
        require(!firstConfigured, "Already configured");

        uint[] memory fineDays = new uint[](3);
        uint[] memory fines = new uint[](3);

        // 1st
        fineDays[0] = 30;
        fineDays[1] = 60;
        fineDays[2] = 90;

        fines[0] = 30;
        fines[1] = 25;
        fines[2] = 20;

        addStakeTypeWithFines(3 * 30, 7, fines, fineDays);

        // 2nd
        fineDays[0] = 60;
        fineDays[1] = 120;
        fineDays[2] = 180;

        fines[0] = 30;
        fines[1] = 25;
        fines[2] = 20;

        addStakeTypeWithFines(6 * 30, 14, fines, fineDays);


        // 3d
        fineDays[0] = 120;
        fineDays[1] = 240;
        fineDays[2] = 360;

        fines[0] = 30;
        fines[1] = 25;
        fines[2] = 20;

        addStakeTypeWithFines(12 * 30, 21, fines, fineDays);

        token = IERC20(tokenAddress);

        fineWallet = inFineWallet;

        firstConfigured = true;
    }

    function copyFromAnotherStakingProgram(address addressFrom, uint count) public onlyOwner {
        StakingProgram anotherStakingProgram = StakingProgram(addressFrom);
        uint[] memory uintValues = new uint[](3);
        uintValues[0] = anotherStakingProgram.stakersAddressesCount();
        require(uintValues[0] > copyCounter, "Already copied");
        uintValues[1] = copyCounter + count;
        uintValues[2] = uintValues[0];
        if(uintValues[2] > uintValues[1]) {
            uintValues[2] = uintValues[1];
        }
        for(uint i = copyCounter; i < uintValues[2]; i++) {
            address stakerAddress = anotherStakingProgram.stakersAddresses(i);
            (bool sourceStakerExists,
            uint sourceStakerCount,
            uint sourceStakerSummerDeposit,
            uint sourceStakerSummerAfter) = anotherStakingProgram.stakers(stakerAddress);

            stakersAddresses.push(stakerAddress);
            stakersAddressesCount++;
            Staker storage targetStaker = stakers[stakerAddress];

            targetStaker.exists = sourceStakerExists;
            targetStaker.count = sourceStakerCount;
            targetStaker.summerDeposit = sourceStakerSummerDeposit;
            targetStaker.summerAfter = sourceStakerSummerAfter;

            for(uint j = 0; j < sourceStakerCount; j++) {
                (bool sourceStakeClosed,
                uint sourceStakeAmount,
                uint sourceStakeAmountAfter,
                uint sourceStakeStakeType,
                uint sourceStakeStart,
                uint sourceStakeFinished) = anotherStakingProgram.getStakerStakeParams(stakerAddress, j);
                targetStaker.closed[j] = sourceStakeClosed;
                targetStaker.amount[j] = sourceStakeAmount;
                targetStaker.amountAfter[j] = sourceStakeAmountAfter;
                targetStaker.stakeType[j] = sourceStakeStakeType;
                targetStaker.start[j] = sourceStakeStart;
                targetStaker.finished[j] = sourceStakeFinished;
            }
        }
        copyCounter = uintValues[2];
    }

    function addStakeTypeWithFines(uint periodInDays, uint apy, uint[] memory fines, uint[] memory fineDays) public onlyOwner {
        uint stakeTypeIndex = addStakeType(periodInDays, apy);
        setStakeTypeFines(stakeTypeIndex, fines, fineDays);
    }


    function setStakeTypeFines(uint stakeTypeIndex, uint[] memory fines, uint[] memory fineDays) public onlyOwner {
        require(stakeTypeIndex < countOfStakeTypes, "Wrong stake type index");
        require(fines.length > 0, "Fines array length must be greater than 0");
        require(fines.length == fineDays.length, "Fines and fine days arrays must be equals");
        StakeType storage stakeType = stakeTypes[stakeTypeIndex];
        stakeType.finesPeriodsCount = fines.length;
        for (uint i = 0; i < fines.length; i++) {
            require(fines[i] <= 1000, "Fines can't be more than 1000");
            stakeType.fines[i] = fines[i];
            require(fineDays[i] <= 100000, "Fine days can't be more than 10000");
            stakeType.fineDays[i] = fineDays[i];
        }
    }

    function changeStakeType(uint stakeTypeIndex, bool active, uint periodInDays, uint apy) public onlyOwner {
        require(stakeTypeIndex < countOfStakeTypes, "Wrong stake type index");
        require(apy < 1000, "Apy can't be grater than 1000");
        require(periodInDays < 100000, "Apy can't be grater than 100000");
        StakeType storage stakeType = stakeTypes[stakeTypeIndex];
        stakeType.active = active;
        stakeType.periodInDays = periodInDays;
        stakeType.apy = apy;
    }

    function addStakeType(uint periodInDays, uint apy) public onlyOwner returns (uint) {
        stakeTypes.push();
        StakeType storage stakeType = stakeTypes[countOfStakeTypes++];
        stakeType.active = true;
        stakeType.periodInDays = periodInDays;
        stakeType.apy = apy;
        return countOfStakeTypes - 1;
    }

    function setFineWallet(address inFineWallet) public onlyOwner {
        fineWallet = inFineWallet;
    }

    function setToken(address tokenAddress) public onlyOwner {
        token = IERC20(tokenAddress);
    }

    function setPaused(bool inPaused) public onlyOwner {
        paused = inPaused;
    }

    function deposit(uint8 stakeTypeIndex, uint256 amount) public notPaused returns (uint) {
        require(stakeTypeIndex < countOfStakeTypes, "Wrong stake type index");
        StakeType storage stakeType = stakeTypes[stakeTypeIndex];
        require(stakeType.active, "Stake type not active");

        Staker storage staker = stakers[_msgSender()];
        if (!staker.exists) {
            staker.exists = true;
            stakersAddresses.push(_msgSender());
            stakersAddressesCount++;
        }

        token.transferFrom(_msgSender(), address(this), amount);

        staker.closed[staker.count] = false;
        staker.amount[staker.count] = amount;
        staker.start[staker.count] = block.timestamp;
        staker.stakeType[staker.count] = stakeTypeIndex;
        staker.count += 1;
        staker.summerDeposit += amount;

        emit Deposit(_msgSender(), amount, stakeTypeIndex, staker.count - 1);

        return staker.count;
    }

    function calculateWithdrawValue(address stakerAddress, uint stakeIndex, uint8 kind) public view returns (uint) {
        Staker storage staker = stakers[stakerAddress];
        require(staker.exists, "Staker not registered");
        require(!staker.closed[stakeIndex], "Stake already closed");

        uint stakeTypeIndex = staker.stakeType[stakeIndex];
        StakeType storage stakeType = stakeTypes[stakeTypeIndex];
        require(stakeType.active, "Stake type not active");

        if(kind == WITHDRAW_KIND_ALL) {
            return staker.amount[stakeIndex];
        }

        uint startTimestamp = staker.start[stakeIndex];
        if (block.timestamp >= startTimestamp + stakeType.periodInDays * (1 days)) {
            // Rewards calculation
            return staker.amount[stakeIndex]  + staker.amount[stakeIndex]* stakeType.periodInDays * stakeType.apy / (365 * PERCENT_DIVIDER);
        } else {
            uint stakePeriodIndex = stakeType.finesPeriodsCount - 1;
            for (uint i = stakeType.finesPeriodsCount; i > 0; i--) {
                if (block.timestamp < startTimestamp + stakeType.fineDays[i - 1] * (1 days)) {
                    stakePeriodIndex = i - 1;
                }
            }
            // Fines calculation
            return staker.amount[stakeIndex].mul(PERCENT_DIVIDER - stakeType.fines[stakePeriodIndex]).div(PERCENT_DIVIDER);
        }
    }

    function commonWithdraw(address to, address stakerAddress, uint8 stakeIndex, uint8 kind) private {
        Staker storage staker = stakers[stakerAddress];
        staker.amountAfter[stakeIndex] = calculateWithdrawValue(stakerAddress, stakeIndex, kind);

        require(token.balanceOf(address(this)) >= staker.amountAfter[stakeIndex], "Staking contract does not have enough funds! Owner should deposit funds...");

        staker.summerAfter = staker.summerAfter.add(staker.amountAfter[stakeIndex]);
        staker.finished[stakeIndex] = block.timestamp;
        staker.closed[stakeIndex] = true;

        require(token.transfer(to, staker.amountAfter[stakeIndex]), "Can't transfer reward");
        uint stakeTypeIndex = staker.stakeType[stakeIndex];

        if(staker.amountAfter[stakeIndex] < staker.amount[stakeIndex]) {
            uint fine = staker.amount[stakeIndex] - staker.amountAfter[stakeIndex];
            require(token.transfer(fineWallet, fine), "Can't transfer reward");
        }

        emit Withdraw(stakerAddress, staker.amountAfter[stakeIndex], stakeTypeIndex, stakeIndex);
    }

    function adminWithdraw(address to, address stakerAddress, uint8 stakeIndex) public onlyOwner {
        commonWithdraw(to, stakerAddress, stakeIndex, WITHDRAW_KIND_ALL);
    }

    function withdraw(uint8 stakeIndex) public notPaused {
        commonWithdraw(_msgSender(), _msgSender(), stakeIndex, WITHDRAW_KIND_BY_PROGRAM);
    }

    function withdrawSpecified(address to, uint amount) public onlyOwner {
        token.transfer(to, amount);
    }

    function withdrawAll(address to) public onlyOwner {
        token.transfer(to, token.balanceOf(address(this)));
    }

    function getStakeTypeFinePeriodAndFine(uint8 stakeTypeIndex, uint periodIndex) public view returns (uint, uint) {
        require(stakeTypeIndex < countOfStakeTypes, "Wrong stake type index");
        StakeType storage stakeType = stakeTypes[stakeTypeIndex];
        //require(stakeType.active, "Stake type not active");
        require(periodIndex < stakeType.finesPeriodsCount, "Requetsed period idnex greater than max period index");
        return (stakeType.fineDays[periodIndex], stakeType.fines[periodIndex]);
    }

    modifier notPaused() {
        require(!paused, "Deposit program paused");
        _;
    }

    modifier stakerStakeChecks(address stakerAddress, uint stakeIndex) {
        Staker storage staker = stakers[stakerAddress];
        require(staker.exists, "Staker not registered");
        require(stakeIndex < staker.count, "Wrong stake index");
        _;
    }

    function getStakerStakeParams(address stakerAddress, uint stakeIndex) public view stakerStakeChecks(stakerAddress, stakeIndex)
    returns (bool closed, uint amount, uint amountAfter, uint stakeType, uint start, uint finished) {
        Staker storage staker = stakers[stakerAddress];

        uint[] memory uintValues = new uint[](5);
        uintValues[0] = staker.amount[stakeIndex];
        uintValues[1] = staker.amountAfter[stakeIndex];
        uintValues[2] = staker.stakeType[stakeIndex];
        uintValues[3] = staker.start[stakeIndex];
        uintValues[4] = staker.finished[stakeIndex];

        return (staker.closed[stakeIndex], uintValues[0], uintValues[1], uintValues[2], uintValues[3], uintValues[4]);
    }

}
