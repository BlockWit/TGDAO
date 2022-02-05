const {
  accounts,
  contract,
  web3
} = require('@openzeppelin/test-environment');
const {
  BN,
  ether,
  expectEvent,
  expectRevert,
  time
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { latestBlock } = require('@openzeppelin/test-helpers/src/time');

const Token = contract.fromArtifact('TGDAOToken');
const Staking = contract.fromArtifact('TGDAOStaking');

const [account1, account2, account3, owner] = accounts;
const SUPPLY1 = ether('100000000');
const SUPPLY2 = ether('500000000');

const initialAccounts = [account1, account2];
const initialBalances = [SUPPLY1, SUPPLY2];

const countOfStakingTypes = 3;
const countOfStakingTypesBN = new BN(countOfStakingTypes);

const ZERO_BN = new BN(0);
const ONE_BN = new BN(1);
const TWO_BN = new BN(2);
const THREE_BN = new BN(3);

const FINE_PERIOD_1_BN = new BN(0);
const FINE_PERIOD_2_BN = new BN(1);
const FINE_PERIOD_3_BN = new BN(2);

const PERCENT_RATE_BN = new BN(100);

const SECONDS_IN_DAY_BN = new BN(86400);
const DAYS_IN_YEAR_BN = new BN(365);

const STAKE_PROGRAM_1 = 0;
const STAKE_PROGRAM_2 = 1;
const STAKE_PROGRAM_3 = 2;

const STAKE_PROGRAM_1_BN = new BN(STAKE_PROGRAM_1);
const STAKE_PROGRAM_2_BN = new BN(STAKE_PROGRAM_2);
const STAKE_PROGRAM_3_BN = new BN(STAKE_PROGRAM_3);

const stakeProgram = [
  {
    active: true,
    periodInDaysBN: new BN(90),
    apyBN: new BN(7),
    finesPeriodsCountBN: new BN(3),
    fineDaysBSs: [new BN(30), new BN(60), new BN(90)],
    finesBSs: [new BN(30), new BN(25), new BN(20)]
  },
  {
    active: true,
    periodInDaysBN: new BN(180),
    apyBN: new BN(14),
    finesPeriodsCountBN: new BN(3),
    fineDaysBSs: [new BN(60), new BN(120), new BN(180)],
    finesBSs: [new BN(30), new BN(25), new BN(20)]
  },
  {
    active: true,
    periodInDaysBN: new BN(360),
    apyBN: new BN(21),
    finesPeriodsCountBN: new BN(3),
    fineDaysBSs: [new BN(120), new BN(240), new BN(360)],
    finesBSs: [new BN(30), new BN(25), new BN(20)]
  }
];

const stakeFinishedTimeForFinePeriod = (startTime, stakeProgramIndex, stakePeriodIndex) => {
  return startTime.add(stakeProgram[stakeProgramIndex].fineDaysBSs[stakePeriodIndex].mul(SECONDS_IN_DAY_BN));
};

const stakeFinePercent = (stakeProgramIndex, stakePeriodIndex) => {
  return stakeProgram[stakeProgramIndex].finesBSs[stakePeriodIndex];
};

const stakeAfterFinePercent = (stakeProgramIndex, stakePeriodIndex) => {
  return PERCENT_RATE_BN.sub(stakeFinePercent(stakeProgramIndex, stakePeriodIndex));
};

const stakeAfterFine = (depositAmount, stakeProgramIndex, stakePeriodIndex) => {
  return depositAmount.mul(stakeAfterFinePercent(stakeProgramIndex, stakePeriodIndex)).div(PERCENT_RATE_BN);
};

const rewardPercent = (stakeProgramIndex) => {
  const stakeProgramType = stakeProgram[stakeProgramIndex];
  return stakeProgramType.apyBN.mul(stakeProgramType.periodInDaysBN).div(DAYS_IN_YEAR_BN);
};

async function increaseStakePeriod (stakeProgramIndex) {
  await time.increase(time.duration.days(periodInDaysNumber(stakeProgramIndex)));
};

async function increaseFineDays (stakeProgramIndex, stakePeriodIndex) {
  await time.increase(time.duration.days(fineDaysNumber(stakeProgramIndex, stakePeriodIndex)));
};

const fineDays = (stakeProgramIndex, stakePeriodIndex) => {
  return stakeProgram[stakeProgramIndex].fineDaysBSs[stakePeriodIndex];
};

const periodInDaysNumber = (stakeProgramIndex) => {
  return periodInDays(stakeProgramIndex).toNumber();
};

const periodInDays = (stakeProgramIndex) => {
  return stakeProgram[stakeProgramIndex].periodInDaysBN;
};

const fineDaysNumber = (stakeProgramIndex, stakePeriodIndex) => {
  return fineDays(stakeProgramIndex, stakePeriodIndex).toNumber();
};

const reward = (depositAmount, stakeProgramIndex) => {
  return depositAmount.add(stakeProgram[stakeProgramIndex].apyBN.mul(stakeProgram[stakeProgramIndex].periodInDaysBN).mul(depositAmount).div(new BN(36500)));
  //return depositAmount.add(depositAmount.mul(rewardPercent(stakeProgramIndex)).div(PERCENT_RATE_BN));
};

const intgrData = {
  accounts: [
    {
      account: account1,
      balanceBefore: SUPPLY1,
      stakes: [
        {
          amount: ether('100'),
          period: new BN(1),
          program: 0,
          shouldWithdraw: ether('70'),
          depositIndex: 0,
          start: ZERO_BN,
          finished: false
        },
        {
          amount: ether('100'),
          period: new BN(31),
          program: 0,
          shouldWithdraw: ether('75'),
          depositIndex: 1,
          start: ZERO_BN,
          finished: false
        },
        {
          amount: ether('200'),
          period: new BN(91),
          program: 0,
          shouldWithdraw: reward(ether('200'), 0),
          depositIndex: 2,
          start: ZERO_BN,
          finished: false
        }
      ],
      summerDeposited: ether('400'),
      summerAfter: SUPPLY1.sub(ether('400')).add(ether('145').add(reward(ether('200'), 0)))
    },
    {
      account: account2,
      balanceBefore: SUPPLY2,
      stakes: [
        {
          amount: ether('200'),
          period: new BN(1),
          program: 1,
          shouldWithdraw: ether('140'),
          depositIndex: 0,
          start: ZERO_BN,
          finished: false
        },
        {
          amount: ether('400'),
          period: new BN(121),
          program: 1,
          shouldWithdraw: ether('320'),
          depositIndex: 1,
          start: ZERO_BN,
          finished: false
        },
        {
          amount: ether('800'),
          period: new BN(180),
          program: 1,
          shouldWithdraw: reward(ether('800'), 1),
          depositIndex: 2,
          start: ZERO_BN,
          finished: false
        }
      ],
      summerDeposited: ether('1400'),
      summerAfter: SUPPLY2.sub(ether('1400')).add(ether('460').add(reward(ether('800'), 1)))
    }
  ]
};

describe('Staking', async () => {
  let token;
  let staking;

  console.log('Награда программы 3 месяца для 100 токенов: ', reward(new BN('100000000000000000000'), 0).toString());
  console.log('Награда программы 6 месяцeв для 100 токенов: ', reward(new BN('100000000000000000000'), 1).toString());
  console.log('Награда программы 12 месяцeв для 100 токенов: ', reward(new BN('100000000000000000000'), 2).toString());

  beforeEach(async function () {
    token = await Token.new(initialAccounts, initialBalances, { from: owner });
    staking = await Staking.new({ from: owner });
  });

  describe('setToken', function () {
    it('not owner can not call setToken', async function () {
      await expectRevert(staking.setToken(token.address, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('owner setToken works correctly', async function () {
      await staking.setToken(token.address, { from: owner });
      expect(await staking.token()).to.be.equal(token.address);
    });
  });

  describe('Check only owner functions throws corresponding excepion', function () {
    it('addStakeTypeWithFines', async function () {
      await expectRevert(staking.addStakeTypeWithFines(1, 2, [3, 3], [1, 2], { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('setStakeTypeFines', async function () {
      await expectRevert(staking.setStakeTypeFines(1, [3, 3], [1, 2], { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('changeStakeType', async function () {
      await expectRevert(staking.changeStakeType(1, false, 12, 14, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('addStakeType', async function () {
      await expectRevert(staking.addStakeType(1, 2, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('setToken', async function () {
      await expectRevert(staking.setToken(token.address, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
  });

  describe('configure', function () {
    it('not owner can not configure', async function () {
      await expectRevert(staking.configure(token.address, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('owner configure works correctly', async function () {
      await staking.configure(token.address, { from: owner });
      expect(await staking.token()).to.be.equal(token.address);
      await expectRevert(staking.configure(token.address, { from: owner }),
        'Already configured'
      );
      expect(await staking.countOfStakeTypes()).to.be.bignumber.equal(countOfStakingTypesBN);
      for (let i = 0; i < stakeProgram.length; i++) {
        const stakeType = await staking.stakeTypes(i);
        expect(stakeType.active).to.be.equal(stakeProgram[i].active);
        expect(stakeType.periodInDays).to.be.bignumber.equal(stakeProgram[i].periodInDaysBN);
        expect(stakeType.apy).to.be.bignumber.equal(stakeProgram[i].apyBN);
        expect(stakeType.finesPeriodsCount).to.be.bignumber.equal(stakeProgram[i].finesPeriodsCountBN);
        for (let j = 0; j < stakeProgram.length; j++) {
          const finePeriodAndPercent = await staking.getStakeTypeFinePeriodAndFine(i, j);
          expect(finePeriodAndPercent[0]).to.be.bignumber.equal(stakeProgram[i].fineDaysBSs[j]);
          expect(finePeriodAndPercent[1]).to.be.bignumber.equal(stakeProgram[i].finesBSs[j]);
        }
      }
      await expectRevert.unspecified(staking.stakeTypes(stakeProgram.length));
    });
  });

  describe('withdrawAll', function () {
    it('not owner can not withdrawAll', async function () {
      await expectRevert(staking.withdrawAll(account2, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('owner can withdrawAll correctly', async function () {
      await staking.configure(token.address, { from: owner });
      expect(await token.balanceOf(staking.address)).to.be.bignumber.equal(ZERO_BN);
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1);
      const amountToTransferForWithdrawAll1 = ether('100');
      await token.transfer(staking.address, amountToTransferForWithdrawAll1, { from: account1 });
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1.sub(amountToTransferForWithdrawAll1));
      expect(await token.balanceOf(staking.address)).to.be.bignumber.equal(amountToTransferForWithdrawAll1);
      expect(await token.balanceOf(account2)).to.be.bignumber.equal(SUPPLY2);
      const amountToTransferForWithdrawAll2 = ether('300');
      await token.transfer(staking.address, amountToTransferForWithdrawAll2, { from: account2 });
      expect(await token.balanceOf(account2)).to.be.bignumber.equal(SUPPLY2.sub(amountToTransferForWithdrawAll2));
      expect(await token.balanceOf(staking.address)).to.be.bignumber.equal(amountToTransferForWithdrawAll2.add(amountToTransferForWithdrawAll1));
      await staking.withdrawAll(account3, { from: owner });
      expect(await token.balanceOf(account3)).to.be.bignumber.equal(amountToTransferForWithdrawAll1.add(amountToTransferForWithdrawAll2));
      expect(await token.balanceOf(staking.address)).to.be.bignumber.equal(ZERO_BN);
    });
  });

  describe('deposit', function () {
    it('account can not deposit if not allow corresponding amount', async function () {
      await staking.configure(token.address, { from: owner });
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1);
      const account1DepositBN = ether('100');
      await expectRevert(staking.deposit(STAKE_PROGRAM_1_BN, account1DepositBN, { from: account1 }),
        'ERC20: transfer amount exceeds allowance'
      );
    });
    it('account can not deposit if allowed not enough', async function () {
      await staking.configure(token.address, { from: owner });
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1);
      const account1AllowBN = ether('100');
      await token.approve(staking.address, account1AllowBN, { from: account1 });
      expect(await token.allowance(account1, staking.address)).to.be.bignumber.equal(account1AllowBN);
      const account1DepositBN = ether('200');
      await expectRevert(staking.deposit(STAKE_PROGRAM_1_BN, account1DepositBN, { from: account1 }),
        'ERC20: transfer amount exceeds allowance'
      );
    });
    it('deposit', async function () {
      await staking.configure(token.address, { from: owner });
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1);
      const account1DepositBN = ether('100');
      await token.approve(staking.address, account1DepositBN, { from: account1 });
      expect(await token.allowance(account1, staking.address)).to.be.bignumber.equal(account1DepositBN);
      const depositTx = await staking.deposit(STAKE_PROGRAM_1_BN, account1DepositBN, { from: account1 });
      expectEvent(depositTx.receipt, 'Deposit', [account1, account1DepositBN, STAKE_PROGRAM_1_BN, ZERO_BN]);
      const depositTimestampBN = new BN((await web3.eth.getBlock(depositTx.receipt.blockNumber)).timestamp);
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1.sub(account1DepositBN));
      expect(await token.balanceOf(staking.address)).to.be.bignumber.equal(account1DepositBN);
      expect(await staking.stakersAddressesCount()).to.be.bignumber.equal(ONE_BN);
      expect(await staking.stakersAddressesCount()).to.be.bignumber.equal(ONE_BN);
      expect(await staking.stakersAddresses(ZERO_BN)).to.be.equal(account1);
      const staker1 = await staking.stakers(account1);
      expect(staker1.exists).to.be.equal(true);
      expect(staker1.count).to.be.bignumber.equal(ONE_BN);
      expect(staker1.summerDeposit).to.be.bignumber.equal(account1DepositBN);
      expect(staker1.summerAfter).to.be.bignumber.equal(ZERO_BN);
      const stakeParams = await staking.getStakerStakeParams(account1, ZERO_BN);
      expect(stakeParams.closed).to.be.equal(false);
      expect(stakeParams.amount).to.be.bignumber.equal(account1DepositBN);
      expect(stakeParams.amountAfter).to.be.bignumber.equal(ZERO_BN);
      expect(stakeParams.stakeType).to.be.bignumber.equal(STAKE_PROGRAM_1_BN);
      expect(stakeParams.start).to.be.bignumber.equal(depositTimestampBN);
      expect(stakeParams.finished).to.be.bignumber.equal(ZERO_BN);
    });
  });

  describe('deposit and withdraw', function () {
    it('deposit and withdraw before stake time limit immediately', async function () {
      await staking.configure(token.address, { from: owner });
      const account1DepositBN = new BN('100123456789000000000');
      await token.approve(staking.address, account1DepositBN, { from: account1 });
      const depositTx = await staking.deposit(STAKE_PROGRAM_1_BN, account1DepositBN, { from: account1 });
      expectEvent(depositTx.receipt, 'Deposit', [account1, account1DepositBN, STAKE_PROGRAM_1_BN, ZERO_BN]);
      const depositTimestampBN = new BN((await web3.eth.getBlock(depositTx.receipt.blockNumber)).timestamp);
      const stakeIndex = (await staking.stakers(account1)).count.sub(ONE_BN);
      const finishedTx = await staking.withdraw(stakeIndex, { from: account1 });
      const finishedTimestampBN = new BN((await web3.eth.getBlock(finishedTx.receipt.blockNumber)).timestamp);
      expect(finishedTimestampBN.toNumber()).to.be.greaterThanOrEqual(depositTimestampBN.toNumber());

      const staker1 = await staking.stakers(account1);
      expect(staker1.exists).to.be.equal(true);
      expect(staker1.count).to.be.bignumber.equal(ONE_BN);
      expect(staker1.summerDeposit).to.be.bignumber.equal(account1DepositBN);
      const rewardAfterFineShouldBeBN = stakeAfterFine(account1DepositBN, STAKE_PROGRAM_1, FINE_PERIOD_1_BN);
      const stakeParams = await staking.getStakerStakeParams(account1, stakeIndex);
      expect(stakeParams.finished).to.be.bignumber.equal(finishedTimestampBN);
      expect(stakeParams.amountAfter).to.be.bignumber.equal(rewardAfterFineShouldBeBN);
      expect(staker1.summerAfter).to.be.bignumber.equal(rewardAfterFineShouldBeBN);
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1.sub(account1DepositBN).add(rewardAfterFineShouldBeBN));
    });
    it('deposit and withdraw before stake time limit after first fine period', async function () {
      await staking.configure(token.address, { from: owner });
      const account1DepositBN = ether('100');
      await token.approve(staking.address, account1DepositBN, { from: account1 });
      const depositTx = await staking.deposit(STAKE_PROGRAM_1_BN, account1DepositBN, { from: account1 });
      expectEvent(depositTx.receipt, 'Deposit', [account1, account1DepositBN, STAKE_PROGRAM_1_BN, ZERO_BN]);
      const depositTimestampBN = new BN((await web3.eth.getBlock(depositTx.receipt.blockNumber)).timestamp);
      const stakeIndex = (await staking.stakers(account1)).count.sub(ONE_BN);
      await increaseFineDays(STAKE_PROGRAM_1, FINE_PERIOD_1_BN);

      const finishedTx = await staking.withdraw(stakeIndex, { from: account1 });
      const rewardAfterFineShouldBeBN = stakeAfterFine(account1DepositBN, STAKE_PROGRAM_1, FINE_PERIOD_2_BN);
      expectEvent(finishedTx.receipt, 'Withdraw', [account1, rewardAfterFineShouldBeBN, STAKE_PROGRAM_1_BN, ZERO_BN]);
      const finishedTimestampBN = new BN((await web3.eth.getBlock(finishedTx.receipt.blockNumber)).timestamp);
      expect(finishedTimestampBN).to.be.bignumber.greaterThan(depositTimestampBN);
      const staker1 = await staking.stakers(account1);
      expect(staker1.exists).to.be.equal(true);
      expect(staker1.count).to.be.bignumber.equal(ONE_BN);
      expect(staker1.summerDeposit).to.be.bignumber.equal(account1DepositBN);
      const stakeParams = await staking.getStakerStakeParams(account1, stakeIndex);
      expect(stakeParams.finished).to.be.bignumber.equal(finishedTimestampBN);
      expect(stakeParams.amountAfter).to.be.bignumber.equal(rewardAfterFineShouldBeBN);
      expect(staker1.summerAfter).to.be.bignumber.equal(rewardAfterFineShouldBeBN);
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1.sub(account1DepositBN).add(rewardAfterFineShouldBeBN));
    });
    it('deposit and withdraw before stake time limit after second fine period', async function () {
      await staking.configure(token.address, { from: owner });
      const account1DepositBN = ether('100');
      await token.approve(staking.address, account1DepositBN, { from: account1 });
      const depositTx = await staking.deposit(STAKE_PROGRAM_1_BN, account1DepositBN, { from: account1 });
      expectEvent(depositTx.receipt, 'Deposit', [account1, account1DepositBN, STAKE_PROGRAM_1_BN, ZERO_BN]);
      const depositTimestampBN = new BN((await web3.eth.getBlock(depositTx.receipt.blockNumber)).timestamp);
      const stakeIndex = (await staking.stakers(account1)).count.sub(ONE_BN);
      await increaseFineDays(STAKE_PROGRAM_1, FINE_PERIOD_2_BN);

      const finishedTx = await staking.withdraw(stakeIndex, { from: account1 });
      const rewardAfterFineShouldBeBN = stakeAfterFine(account1DepositBN, STAKE_PROGRAM_1, FINE_PERIOD_3_BN);
      expectEvent(finishedTx.receipt, 'Withdraw', [account1, rewardAfterFineShouldBeBN, STAKE_PROGRAM_1_BN, ZERO_BN]);
      const finishedTimestampBN = new BN((await web3.eth.getBlock(finishedTx.receipt.blockNumber)).timestamp);
      expect(finishedTimestampBN).to.be.bignumber.greaterThan(depositTimestampBN);
      const staker1 = await staking.stakers(account1);
      expect(staker1.exists).to.be.equal(true);
      expect(staker1.count).to.be.bignumber.equal(ONE_BN);
      expect(staker1.summerDeposit).to.be.bignumber.equal(account1DepositBN);
      const stakeParams = await staking.getStakerStakeParams(account1, stakeIndex);
      expect(stakeParams.finished).to.be.bignumber.equal(finishedTimestampBN);
      expect(stakeParams.amountAfter).to.be.bignumber.equal(rewardAfterFineShouldBeBN);
      expect(staker1.summerAfter).to.be.bignumber.equal(rewardAfterFineShouldBeBN);
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1.sub(account1DepositBN).add(rewardAfterFineShouldBeBN));
    });
    it('deposit and withdraw before stake time limit after third fine period - rewards should failed - not enough funds', async function () {
      await staking.configure(token.address, { from: owner });
      const account1DepositBN = ether('100');
      await token.approve(staking.address, account1DepositBN, { from: account1 });
      const depositTx = await staking.deposit(STAKE_PROGRAM_1_BN, account1DepositBN, { from: account1 });
      expectEvent(depositTx.receipt, 'Deposit', [account1, account1DepositBN, STAKE_PROGRAM_1_BN, ZERO_BN]);
      const stakeIndex = (await staking.stakers(account1)).count.sub(ONE_BN);
      await increaseStakePeriod(STAKE_PROGRAM_1);
      await expectRevert(staking.withdraw(stakeIndex, { from: account1 }),
        'Staking contract does not have enough funds! Owner should deposit funds...'
      );
    });
    it('deposit and withdraw before stake time limit after third fine period - rewards', async function () {
      await staking.configure(token.address, { from: owner });
      const account1DepositBN = ether('100');
      await token.approve(staking.address, account1DepositBN, { from: account1 });
      const depositTx = await staking.deposit(STAKE_PROGRAM_1_BN, account1DepositBN, { from: account1 });
      expectEvent(depositTx.receipt, 'Deposit', [account1, account1DepositBN, STAKE_PROGRAM_1_BN, ZERO_BN]);
      const depositTimestampBN = new BN((await web3.eth.getBlock(depositTx.receipt.blockNumber)).timestamp);
      const stakeIndex = (await staking.stakers(account1)).count.sub(ONE_BN);
      await increaseStakePeriod(STAKE_PROGRAM_1);
      // fill contract to withdraw rewards
      const rewardAfterFineShouldBeBN = reward(account1DepositBN, STAKE_PROGRAM_1);
      await token.transfer(staking.address, rewardAfterFineShouldBeBN.sub(account1DepositBN), { from: account2 });
      const finishedTx = await staking.withdraw(stakeIndex, { from: account1 });
      expectEvent(finishedTx.receipt, 'Withdraw', [account1, rewardAfterFineShouldBeBN, STAKE_PROGRAM_1_BN, ZERO_BN]);
      const finishedTimestampBN = new BN((await web3.eth.getBlock(finishedTx.receipt.blockNumber)).timestamp);
      expect(finishedTimestampBN).to.be.bignumber.greaterThan(depositTimestampBN);
      const staker1 = await staking.stakers(account1);
      expect(staker1.exists).to.be.equal(true);
      expect(staker1.count).to.be.bignumber.equal(ONE_BN);
      expect(staker1.summerDeposit).to.be.bignumber.equal(account1DepositBN);
      const stakeParams = await staking.getStakerStakeParams(account1, stakeIndex);
      expect(stakeParams.finished).to.be.bignumber.equal(finishedTimestampBN);
      expect(stakeParams.amountAfter).to.be.bignumber.equal(rewardAfterFineShouldBeBN);
      expect(staker1.summerAfter).to.be.bignumber.equal(rewardAfterFineShouldBeBN);
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1.sub(account1DepositBN).add(rewardAfterFineShouldBeBN));
    });
  });
  describe('integration tests', function () {
    it('deposit and withdraw for single user for two different staking programs', async function () {
      await staking.configure(token.address, { from: owner });
      const account1Deposit1BN = ether('100');
      const account1Deposit2BN = ether('150');
      const accountSummerDepositedBN = account1Deposit1BN.add(account1Deposit2BN);
      await token.approve(staking.address, accountSummerDepositedBN, { from: account1 });

      const depositTx1 = await staking.deposit(STAKE_PROGRAM_1_BN, account1Deposit1BN, { from: account1 });
      expectEvent(depositTx1.receipt, 'Deposit', [account1, account1Deposit1BN, STAKE_PROGRAM_1_BN, ZERO_BN]);
      const stakeIndex1 = (await staking.stakers(account1)).count.sub(ONE_BN);
      const depositTimestamp1BN = new BN((await web3.eth.getBlock(depositTx1.receipt.blockNumber)).timestamp);

      const depositTx2 = await staking.deposit(STAKE_PROGRAM_2_BN, account1Deposit2BN, { from: account1 });
      expectEvent(depositTx2.receipt, 'Deposit', [account1, account1Deposit2BN, STAKE_PROGRAM_2_BN, ONE_BN]);
      const stakeIndex2 = (await staking.stakers(account1)).count.sub(ONE_BN);
      const depositTimestamp2BN = new BN((await web3.eth.getBlock(depositTx2.receipt.blockNumber)).timestamp);

      // increase time
      await increaseStakePeriod(STAKE_PROGRAM_1);

      // fill contract to withdraw rewards for program 1
      const rewardAfterFineShouldBe1BN = reward(account1Deposit1BN, STAKE_PROGRAM_1);
      await token.transfer(staking.address, rewardAfterFineShouldBe1BN.sub(account1Deposit1BN), { from: account2 });
      const finished1Tx = await staking.withdraw(stakeIndex1, { from: account1 });

      expectEvent(finished1Tx.receipt, 'Withdraw', [account1, rewardAfterFineShouldBe1BN, STAKE_PROGRAM_1_BN, stakeIndex1]);
      const finishedTimestamp1BN = new BN((await web3.eth.getBlock(finished1Tx.receipt.blockNumber)).timestamp);
      expect(finishedTimestamp1BN).to.be.bignumber.greaterThan(depositTimestamp1BN);
      let staker1 = await staking.stakers(account1);
      expect(staker1.exists).to.be.equal(true);
      expect(staker1.count).to.be.bignumber.equal(TWO_BN);
      expect(staker1.summerDeposit).to.be.bignumber.equal(accountSummerDepositedBN);
      const stakeParams1 = await staking.getStakerStakeParams(account1, stakeIndex1);
      expect(stakeParams1.finished).to.be.bignumber.equal(finishedTimestamp1BN);
      expect(stakeParams1.amountAfter).to.be.bignumber.equal(rewardAfterFineShouldBe1BN);
      expect(staker1.summerAfter).to.be.bignumber.equal(rewardAfterFineShouldBe1BN);
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1.sub(accountSummerDepositedBN).add(rewardAfterFineShouldBe1BN));

      await expectRevert(staking.withdraw(stakeIndex1, { from: account1 }),
        'Stake already closed'
      );

      const finished2Tx = await staking.withdraw(stakeIndex2, { from: account1 });
      const finishedTimestamp2BN = new BN((await web3.eth.getBlock(finished2Tx.receipt.blockNumber)).timestamp);
      expect(finishedTimestamp2BN).to.be.bignumber.greaterThan(depositTimestamp2BN);

      const stakeProgram2FinishedPeriod1 = stakeFinishedTimeForFinePeriod(depositTimestamp2BN, STAKE_PROGRAM_2, FINE_PERIOD_1_BN);
      const stakeProgram2FinishedPeriod2 = stakeFinishedTimeForFinePeriod(depositTimestamp2BN, STAKE_PROGRAM_2, FINE_PERIOD_2_BN);

      expect(finishedTimestamp2BN).to.be.bignumber.greaterThan(stakeProgram2FinishedPeriod1);
      expect(stakeProgram2FinishedPeriod2).to.be.bignumber.greaterThan(finishedTimestamp2BN);

      const rewardAfterFineShouldBe2BN = stakeAfterFine(account1Deposit2BN, STAKE_PROGRAM_2, FINE_PERIOD_2_BN);
      expectEvent(finished2Tx.receipt, 'Withdraw', [account1, rewardAfterFineShouldBe2BN, STAKE_PROGRAM_2_BN, stakeIndex2]);

      const stakeParams2 = await staking.getStakerStakeParams(account1, stakeIndex2);
      expect(stakeParams2.start).to.be.bignumber.equal(depositTimestamp2BN);
      expect(stakeParams2.finished).to.be.bignumber.equal(finishedTimestamp2BN);
      expect(stakeParams2.amountAfter).to.be.bignumber.equal(rewardAfterFineShouldBe2BN);

      // update staker information
      staker1 = await staking.stakers(account1);
      expect(staker1.summerAfter).to.be.bignumber.equal(rewardAfterFineShouldBe2BN.add(rewardAfterFineShouldBe1BN));
      const account1AfterAllRewards = SUPPLY1.sub(accountSummerDepositedBN).add(rewardAfterFineShouldBe1BN).add(rewardAfterFineShouldBe2BN);
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(account1AfterAllRewards);
    });
  });

  describe('integration tests', function () {
    it('deposit and withdraw for two users for two different staking programs', async function () {
      await staking.configure(token.address, { from: owner });
      let deposited = ZERO_BN;
      for (let i = 0; i < intgrData.accounts.length; i++) {
        const accountData = intgrData.accounts[i];
        let depositedByAccount = ZERO_BN;
        for (let j = 0; j < accountData.stakes.length; j++) {
          const deposit = accountData.stakes[j];
          await token.approve(staking.address, deposit.amount, { from: accountData.account });
          const depositTx = await staking.deposit(deposit.program, deposit.amount, { from: accountData.account });
          const depositTxTimestamp = new BN((await web3.eth.getBlock(depositTx.receipt.blockNumber)).timestamp);
          deposit.start = depositTxTimestamp;
          expectEvent(depositTx.receipt, 'Deposit', [accountData.account, deposit.amount, new BN(deposit.program), new BN(deposit.depositIndex)]);
          const stakeIndex = (await staking.stakers(accountData.account)).count.sub(ONE_BN);
          depositedByAccount = depositedByAccount.add(deposit.amount);
          deposited = deposited.add(deposit.amount);
          expect(stakeIndex).to.be.bignumber.equal(new BN(deposit.depositIndex));
          expect(await token.balanceOf(accountData.account)).to.be.bignumber.equal(accountData.balanceBefore.sub(depositedByAccount));
          expect(await token.balanceOf(staking.address)).to.be.bignumber.equal(deposited);
        }
      }
      const tickPeriodInDays = new BN(10);
      const tickPeriods = 40;
      for (let t = 0; t < tickPeriods; t++) {
        await time.increase(time.duration.days(tickPeriodInDays));
        const currentBlockNumber = await latestBlock();
        const currentTimestamp = new BN((await web3.eth.getBlock(currentBlockNumber)).timestamp);
        for (let i = 0; i < intgrData.accounts.length; i++) {
          const accountData = intgrData.accounts[i];
          for (let j = 0; j < accountData.stakes.length; j++) {
            const deposit = accountData.stakes[j];
            if (!deposit.finished) {
              const whenWithdrawDecision = deposit.start.add(deposit.period.mul(SECONDS_IN_DAY_BN));
              if (currentTimestamp.gt(whenWithdrawDecision)) {
                const accountBalanceBefore = await token.balanceOf(accountData.account);
                const withdrawTx = await staking.withdraw(deposit.depositIndex, { from: accountData.account });
                expectEvent(withdrawTx.receipt, 'Withdraw', [accountData.account, deposit.shouldWithdraw, new BN(deposit.program), new BN(deposit.depositIndex)]);
                const accountBalanceAfter = await token.balanceOf(accountData.account);
                expect(accountBalanceAfter).to.be.bignumber.equal(accountBalanceBefore.add(deposit.shouldWithdraw));
                deposit.finished = true;
              }
            }
          }
        }
      }
      for (let i = 0; i < intgrData.accounts.length; i++) {
        const accountData = intgrData.accounts[i];
        expect(await token.balanceOf(accountData.account)).to.be.bignumber.equal(accountData.summerAfter);
      }
    });
  });
});
