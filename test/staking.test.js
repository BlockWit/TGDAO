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

const PERCENT_RATE_BN = new BN(100);

const SECONDS_IN_DAY_BN = new BN(86400);

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

describe('Staking', async () => {
  let token;
  let staking;

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
      const account1DepositBN = ether('100');
      await token.approve(staking.address, account1DepositBN, { from: account1 });
      const depositTx = await staking.deposit(STAKE_PROGRAM_1_BN, account1DepositBN, { from: account1 });
      const depositTimestampBN = new BN((await web3.eth.getBlock(depositTx.receipt.blockNumber)).timestamp);
      const stakeIndex = (await staking.stakers(account1)).count.sub(ONE_BN);
      const finishedTx = await staking.withdraw(stakeIndex, { from: account1 });
      const finishedTimestampBN = new BN((await web3.eth.getBlock(finishedTx.receipt.blockNumber)).timestamp);
      expect(finishedTimestampBN).to.be.bignumber.equal(depositTimestampBN);

      const staker1 = await staking.stakers(account1);
      expect(staker1.exists).to.be.equal(true);
      expect(staker1.count).to.be.bignumber.equal(ONE_BN);
      expect(staker1.summerDeposit).to.be.bignumber.equal(account1DepositBN);
      const rewardAfterFineShouldBeBN = account1DepositBN
        .mul(PERCENT_RATE_BN.sub(stakeProgram[STAKE_PROGRAM_1].finesBSs[ZERO_BN]))
        .div(PERCENT_RATE_BN);
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
      const depositTimestampBN = new BN((await web3.eth.getBlock(depositTx.receipt.blockNumber)).timestamp);
      const stakeIndex = (await staking.stakers(account1)).count.sub(ONE_BN);
      await time.increase(time.duration.days(stakeProgram[STAKE_PROGRAM_1].fineDaysBSs[ZERO_BN].toNumber()));

      const finishedTx = await staking.withdraw(stakeIndex, { from: account1 });
      const finishedTimestampBN = new BN((await web3.eth.getBlock(finishedTx.receipt.blockNumber)).timestamp);
      expect(finishedTimestampBN).to.be.bignumber.greaterThan(depositTimestampBN);
      const staker1 = await staking.stakers(account1);
      expect(staker1.exists).to.be.equal(true);
      expect(staker1.count).to.be.bignumber.equal(ONE_BN);
      expect(staker1.summerDeposit).to.be.bignumber.equal(account1DepositBN);
      const rewardAfterFineShouldBeBN = account1DepositBN
        .mul(PERCENT_RATE_BN.sub(stakeProgram[STAKE_PROGRAM_1].finesBSs[ONE_BN]))
        .div(PERCENT_RATE_BN);
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
      const depositTimestampBN = new BN((await web3.eth.getBlock(depositTx.receipt.blockNumber)).timestamp);
      const stakeIndex = (await staking.stakers(account1)).count.sub(ONE_BN);
      await time.increase(time.duration.days(stakeProgram[STAKE_PROGRAM_1].fineDaysBSs[ONE_BN].toNumber()));

      const finishedTx = await staking.withdraw(stakeIndex, { from: account1 });
      const finishedTimestampBN = new BN((await web3.eth.getBlock(finishedTx.receipt.blockNumber)).timestamp);
      expect(finishedTimestampBN).to.be.bignumber.greaterThan(depositTimestampBN);
      const staker1 = await staking.stakers(account1);
      expect(staker1.exists).to.be.equal(true);
      expect(staker1.count).to.be.bignumber.equal(ONE_BN);
      expect(staker1.summerDeposit).to.be.bignumber.equal(account1DepositBN);
      const rewardAfterFineShouldBeBN = account1DepositBN
        .mul(PERCENT_RATE_BN.sub(stakeProgram[STAKE_PROGRAM_1].finesBSs[TWO_BN]))
        .div(PERCENT_RATE_BN);
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
      await staking.deposit(STAKE_PROGRAM_1_BN, account1DepositBN, { from: account1 });
      const stakeIndex = (await staking.stakers(account1)).count.sub(ONE_BN);
      await time.increase(time.duration.days(stakeProgram[STAKE_PROGRAM_1].periodInDaysBN.toNumber()));
      await expectRevert(staking.withdraw(stakeIndex, { from: account1 }),
        'Staking contract does not have enough funds! Owner should deposit funds...'
      );
    });
    it('deposit and withdraw before stake time limit after third fine period - rewards', async function () {
      await staking.configure(token.address, { from: owner });
      const account1DepositBN = ether('100');
      await token.approve(staking.address, account1DepositBN, { from: account1 });
      const depositTx = await staking.deposit(STAKE_PROGRAM_1_BN, account1DepositBN, { from: account1 });
      const depositTimestampBN = new BN((await web3.eth.getBlock(depositTx.receipt.blockNumber)).timestamp);
      const stakeIndex = (await staking.stakers(account1)).count.sub(ONE_BN);
      await time.increase(time.duration.days(stakeProgram[STAKE_PROGRAM_1].periodInDaysBN.toNumber()));
      // fill contract to withdraw rewards
      const addToContractFunds = account1DepositBN
        .mul(stakeProgram[STAKE_PROGRAM_1].apyBN)
        .div(PERCENT_RATE_BN);
      await token.transfer(staking.address, addToContractFunds, { from: account2 });

      const finishedTx = await staking.withdraw(stakeIndex, { from: account1 });
      const finishedTimestampBN = new BN((await web3.eth.getBlock(finishedTx.receipt.blockNumber)).timestamp);
      expect(finishedTimestampBN).to.be.bignumber.greaterThan(depositTimestampBN);
      const staker1 = await staking.stakers(account1);
      expect(staker1.exists).to.be.equal(true);
      expect(staker1.count).to.be.bignumber.equal(ONE_BN);
      expect(staker1.summerDeposit).to.be.bignumber.equal(account1DepositBN);
      const rewardAfterFineShouldBeBN = account1DepositBN
        .mul(PERCENT_RATE_BN.add(stakeProgram[STAKE_PROGRAM_1].apyBN))
        .div(PERCENT_RATE_BN);
      const stakeParams = await staking.getStakerStakeParams(account1, stakeIndex);
      expect(stakeParams.finished).to.be.bignumber.equal(finishedTimestampBN);
      expect(stakeParams.amountAfter).to.be.bignumber.equal(rewardAfterFineShouldBeBN);
      expect(staker1.summerAfter).to.be.bignumber.equal(rewardAfterFineShouldBeBN);
      expect(await token.balanceOf(account1)).to.be.bignumber.equal(SUPPLY1.sub(account1DepositBN).add(rewardAfterFineShouldBeBN));
    });
  });
});
