const { getEvents } = require('./util');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('TGDAOToken');
const VestingWallet = contract.fromArtifact('VestingWallet');

const [owner, account1, beneficiary] = accounts;
const SUPPLY1 = ether('10000000');
const WALLET_SUPPLY = ether('10000000');

const initialBalances = [SUPPLY1, WALLET_SUPPLY];

describe('VestingWallet', async function () {
  let token;
  let wallet;
  let START_DATE;
  let DURATION = 360 * 24 * 3600;
  let INTERVAL = 90 * 24 * 3600;

  describe('with a regular token release schedule', function () {
    beforeEach(async function () {
      START_DATE = (await time.latest()).toNumber();
      wallet = await VestingWallet.new(beneficiary, START_DATE, DURATION, INTERVAL, { from: owner });
      token = await Token.new([account1, await wallet.address], initialBalances, { from: owner });
      await wallet.setToken(await token.address, { from: owner });
      await wallet.lock({ from: owner });
    });

    it('should have owner', async function () {
      expect(await wallet.owner()).to.equal(owner);
    });

    it('should have beneficiary', async function () {
      expect(await wallet.beneficiary()).to.equal(beneficiary);
    });

    it('should not allow withdrawing ahead of schedule', async function () {
      await expectRevert(wallet.withdraw({ from: beneficiary }), 'No tokens available for withdrawal at this moment');
    });

    it('should not allow beneficiary to withdraw TGO tokens using retriveTokens method', async function () {
      await expectRevert(wallet.retrieveTokens(beneficiary, await token.address, { from: beneficiary }), 'Ownable: caller is not the owner');
    });

    it('should allow owner to withdraw TGO tokens using retriveTokens method', async function () {
      const balance = await token.balanceOf(await wallet.address);
      const { tx } = await wallet.retrieveTokens(owner, await token.address, { from: owner });
      const tokensReceived = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
      expect(tokensReceived).to.be.bignumber.equal(balance);
    });

    it('should allow withdrawal of tokens in accordance with the vesting schedule', async function () {
      const withdrawals = DURATION / INTERVAL;
      const tranche = WALLET_SUPPLY.divn(withdrawals);
      function *intervals () {
        let index = 0;
        while (index < withdrawals) yield {
          idx: index++,
          delay: index * INTERVAL,
          remainder: WALLET_SUPPLY.sub(tranche.muln(index))
        };
      }
      for (const { delay, remainder } of intervals()) {
        const currentDate = await time.latest();
        if (currentDate.toNumber() < START_DATE + delay) await time.increaseTo(START_DATE + delay);
        const { receipt: { transactionHash } } = await wallet.withdraw({ from: beneficiary });
        const events = await getEvents(transactionHash, token, 'Transfer', web3);
        const tokensToSend = new BN(events[0].args.value);
        const tokensRemained = await token.balanceOf(await wallet.address);
        expect(tokensToSend).to.be.bignumber.equal(tranche);
        expect(tokensRemained).to.be.bignumber.equal(remainder);
      }
    });
  });

  describe('with duration equal to interval', function () {

    beforeEach(async function () {
      START_DATE = (await time.latest()).toNumber();
      DURATION = 360 * 24 * 3600;
      INTERVAL = 360 * 24 * 3600;
      wallet = await VestingWallet.new(beneficiary, START_DATE, DURATION, INTERVAL, { from: owner });
      token = await Token.new([account1, await wallet.address], initialBalances, { from: owner });
      await wallet.setToken(await token.address, { from: owner });
      await wallet.lock({ from: owner });
    });

    it('should allow withdrawal of tokens', async function () {
      const delay = INTERVAL;
      const currentDate = await time.latest();
      if (currentDate.toNumber() < START_DATE + delay) await time.increaseTo(START_DATE + delay);
      const { receipt: { transactionHash } } = await wallet.withdraw({ from: beneficiary });
      const events = await getEvents(transactionHash, token, 'Transfer', web3);
      const tokensToSend = new BN(events[0].args.value);
      const tokensRemained = await token.balanceOf(await wallet.address);
      expect(tokensToSend).to.be.bignumber.equal(WALLET_SUPPLY);
      expect(tokensRemained).to.be.bignumber.equal(ether('0'));
    });
  });
});
