// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RecoverableFunds.sol";

/**
 * @dev TGDAO Staking
 */
contract TGDAOStaking is RecoverableFunds {

    using SafeMath for uint256;

    uint public PERCENT_DIVIDER = 100;

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

    uint public countOfStakeTypes;

    StakeType[] public stakeTypes;

    mapping(address => Staker) public stakers;

    address[] public stakersAddresses;

    uint public stakersAddressesCount;

    IERC20 public token;

    bool public firstConfigured;

    event Deposit(address account, uint amount, uint stakingTypeIndex, uint stakeIndex);

    event Withdraw(address account, uint amount, uint stakingTypeIndex, uint stakeIndex);

    function configure(address tokenAddress) public onlyOwner {
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

        addStakeTypeWithFines(3*30, 7, fines, fineDays);

        // 2nd
        fineDays[0] = 60;
        fineDays[1] = 120;
        fineDays[2] = 180;

        fines[0] = 30;
        fines[1] = 25;
        fines[2] = 20;

        addStakeTypeWithFines(6*30, 14, fines, fineDays);


        // 3d
        fineDays[0] = 120;
        fineDays[1] = 240;
        fineDays[2] = 360;

        fines[0] = 30;
        fines[1] = 25;
        fines[2] = 20;

        addStakeTypeWithFines(12*30, 21, fines, fineDays);
        token = IERC20(tokenAddress);

        firstConfigured = true;
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
        for(uint i=0; i<fines.length; i++) {
            stakeType.fines[i] = fines[i];
            stakeType.fineDays[i] = fineDays[i];
        }
    }

    function changeStakeType(uint stakeTypeIndex, bool active, uint periodInDays, uint apy) public onlyOwner {
        require(stakeTypeIndex < countOfStakeTypes, "Wrong stake type index");
        StakeType storage stakeType = stakeTypes[stakeTypeIndex];
        stakeType.active = active;
        stakeType.periodInDays = periodInDays;
        stakeType.apy = apy;
    }

    function addStakeType(uint periodInDays, uint apy) public onlyOwner returns(uint) {
        stakeTypes.push();
        StakeType storage stakeType = stakeTypes[countOfStakeTypes++];
        stakeType.active = true;
        stakeType.periodInDays = periodInDays;
        stakeType.apy = apy;
        return countOfStakeTypes-1;
    }

    function setToken(address tokenAddress) public onlyOwner {
        token = IERC20(tokenAddress);
    }

    function deposit(uint8 stakeTypeIndex, uint256 amount) public returns(uint) {
        require(stakeTypeIndex < countOfStakeTypes, "Wrong stake type index");
        StakeType storage stakeType = stakeTypes[stakeTypeIndex];
        require(stakeType.active, "Stake type not active");

        Staker storage staker = stakers[_msgSender()];
        if(!staker.exists) {
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

    function withdraw(uint8 stakeIndex) public {
        Staker storage staker = stakers[_msgSender()];
        require(staker.exists, "Staker not registered");
        require(!staker.closed[stakeIndex], "Stake already closed");

        uint stakeTypeIndex = staker.stakeType[stakeIndex];
        StakeType storage stakeType = stakeTypes[staker.stakeType[stakeTypeIndex]];
        require(stakeType.active, "Stake type not active");

        staker.closed[stakeIndex] = true;
        uint startTimestamp =  staker.start[stakeIndex];
        if(block.timestamp >= startTimestamp.add(stakeType.periodInDays.mul(1 days))) {
            staker.amountAfter[stakeIndex] = staker.amount[stakeIndex].mul(PERCENT_DIVIDER + stakeType.apy).div(PERCENT_DIVIDER);
        } else {
            uint stakePeriodIndex = stakeType.finesPeriodsCount - 1;
            for(uint i = stakeType.finesPeriodsCount; i > 0; i--) {
                if(block.timestamp < startTimestamp.add(stakeType.fineDays[i - 1].mul(1 days))) {
                    stakePeriodIndex = i - 1;
                }
            }
            staker.amountAfter[stakeIndex] = staker.amount[stakeIndex].mul(PERCENT_DIVIDER - stakeType.fines[stakePeriodIndex]).div(PERCENT_DIVIDER);
        }
        require(token.balanceOf(address(this)) >= staker.amountAfter[stakeIndex], "Staking contract does not have enough funds! Owner should deposit funds...");

        staker.summerAfter = staker.summerAfter.add(staker.amountAfter[stakeIndex]);
        staker.finished[stakeIndex] = block.timestamp;

        require(token.transfer(_msgSender(), staker.amountAfter[stakeIndex]), "Can't transfer reward");

        emit Withdraw(_msgSender(), staker.amountAfter[stakeIndex], stakeTypeIndex, stakeIndex);
    }

    function withdrawAll(address to) public onlyOwner {
        token.transfer(to, token.balanceOf(address(this)));
    }

    function getStakeTypeFinePeriodAndFine(uint8 stakeTypeIndex, uint periodIndex) public view returns(uint, uint) {
        require(stakeTypeIndex < countOfStakeTypes, "Wrong stake type index");
        StakeType storage stakeType = stakeTypes[stakeTypeIndex];
        //require(stakeType.active, "Stake type not active");
        require(periodIndex < stakeType.finesPeriodsCount , "Requetsed period idnex greater than max period index");
        return (stakeType.fineDays[periodIndex], stakeType.fines[periodIndex]);
    }

    modifier stakerStakeChecks(address stakerAddress, uint stakeIndex) {
        Staker storage staker = stakers[stakerAddress];
        require(staker.exists, "Staker not registered");
        require(stakeIndex < staker.count, "Wrong stake index");
        _;
    }

    function getStakerStakeParams(address stakerAddress, uint stakeIndex) public view stakerStakeChecks(stakerAddress, stakeIndex)
        returns(bool closed, uint amount, uint amountAfter, uint stakeType, uint start, uint finished) {
        Staker storage staker = stakers[stakerAddress];

        uint[] memory uintValues = new uint[](5);
        uintValues[0] = staker.amount[stakeIndex];
        uintValues[1] = staker.amountAfter[stakeIndex];
        uintValues[2] = staker.stakeType[stakeIndex];
        uintValues[3] = staker.start[stakeIndex];
        uintValues[4] = staker.finished[stakeIndex];

        return (false, uintValues[0], uintValues[1], uintValues[2], uintValues[3], uintValues[4]);
    }

//    function isStakerStakeClosed(address stakerAddress, uint stakeIndex) public view stakerStakeChecks(stakerAddress, stakeIndex) returns(bool) {
//        return stakers[stakerAddress].closed[stakeIndex];
//    }
//
//    function getStakerStakeStart(address stakerAddress, uint stakeIndex) public view stakerStakeChecks(stakerAddress, stakeIndex) returns(uint) {
//        return stakers[stakerAddress].start[stakeIndex];
//    }
//
//    function getStakerStakeFinished(address stakerAddress, uint stakeIndex) public view stakerStakeChecks(stakerAddress, stakeIndex) returns(uint) {
//        return stakers[stakerAddress].finished[stakeIndex];
//    }
//
//    function getStakerStakeAmount(address stakerAddress, uint stakeIndex) public view stakerStakeChecks(stakerAddress, stakeIndex) returns(uint) {
//        return stakers[stakerAddress].amount[stakeIndex];
//    }
//
//    function getStakerStakeAmountAfter(address stakerAddress, uint stakeIndex) public view stakerStakeChecks(stakerAddress, stakeIndex) returns(uint) {
//        return stakers[stakerAddress].amount[amountAfter];
//    }
//
//    function getStakerStakeTypeIndex(address stakerAddress, uint stakeIndex) public view stakerStakeChecks(stakerAddress, stakeIndex) returns(uint) {
//        return stakers[stakerAddress].stakeType[amountAfter];
//    }

}

