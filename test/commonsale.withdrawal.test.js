const { getEvents, dateFromNow, increaseDateTo, getTransactionCost } = require('./util');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('TGDAOToken');
const Sale = contract.fromArtifact('CommonSale');

const [owner, ethWallet, buyer] = accounts;
const SUPPLY = 1000000000;
const PRICE = 21674;

describe('CommonSale', async function () {
  let token;
  let sale;
  let STAGES;
  let VESTING_SCHEDULES;

  beforeEach(async function () {
    STAGES = [
      { start: await dateFromNow(1), end: await dateFromNow(8), bonus: 500, minInvestmentLimit: ether('0.03'), hardcap: ether('40000000'), schedule: 0 },
      { start: await dateFromNow(9), end: await dateFromNow(11), bonus: 0, minInvestmentLimit: ether('0.03'), hardcap: ether('60000000'), schedule: 1 },
      { start: await dateFromNow(11), end: await dateFromNow(13), bonus: 250, minInvestmentLimit: ether('0.03'), hardcap: ether('5000000'), schedule: 2 }
    ];
    VESTING_SCHEDULES = [
      { index: 1, start: STAGES[1].start, duration: time.duration.days(300).toNumber(), interval: time.duration.days(30).toNumber() },
      { index: 2, start: STAGES[2].start, duration: time.duration.days(60).toNumber(), interval: time.duration.days(30).toNumber() }
    ];
    sale = await Sale.new();
    token = await Token.new([await sale.address], [ether(String(SUPPLY))]);
    await sale.setWallet(ethWallet);
    await sale.setPrice(ether(String(PRICE)));
    for (const { start, end, bonus, minInvestmentLimit, hardcap, schedule } of STAGES) {
      await sale.addStage(start, end, bonus, minInvestmentLimit, 0, 0, hardcap, schedule);
    }
    await sale.setToken(await token.address);
    for (const { index, start, duration, interval } of VESTING_SCHEDULES) {
      await sale.setVestingSchedule(index, start, duration, interval);
    }
    await sale.transferOwnership(owner);
  });

  it('should not allow premature token withdrawal', async function () {
    const { start } = STAGES[1];
    await increaseDateTo(start);
    const ethSent = ether('0.123');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    await expectRevert(sale.withdraw({ from: buyer }), 'CommonSale: No tokens available for withdrawal');
  });

  it('should allow to withdraw tokens after the end of the sale', async function () {
    const { start, bonus } = STAGES[1];
    const { duration } = VESTING_SCHEDULES[0];
    await increaseDateTo(start);
    const ethSent = ether('0.123');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    await increaseDateTo(start + duration);
    const { receipt: { transactionHash } } = await sale.withdraw({ from: buyer });
    const events = await getEvents(transactionHash, token, 'Transfer', web3);
    const tokensExpected = ethSent.muln(PRICE * (100 + bonus) / 100);
    const tokensReceived = new BN(events[0].args.value);
    expect(tokensReceived).to.be.bignumber.equal(tokensExpected);
  });

  it('should reject to withdraw tokens from an empty account', async function () {
    const { start } = STAGES[1];
    const { duration } = VESTING_SCHEDULES[0];
    await increaseDateTo(start + duration);
    await expectRevert(sale.withdraw({ from: buyer }), 'CommonSale: No tokens available for withdrawal');
  });

  it('should allow withdrawal of tokens in accordance with the vesting schedule', async function () {
    const { start, bonus } = STAGES[1];
    await increaseDateTo(start);
    const ethSent1 = ether('0.123');
    const ethSent2 = ether('0.456');

    await sale.sendTransaction({ value: ethSent1, from: buyer });
    await sale.sendTransaction({ value: ethSent2, from: buyer });

    const tokensExpected = ethSent1.muln(PRICE * (100 + bonus)).divn(100).add(ethSent2.muln(PRICE * (100 + bonus)).divn(100));

    const { duration, interval } = VESTING_SCHEDULES[0];
    await expectRevert(sale.withdraw({ from: buyer }), 'CommonSale: No tokens available for withdrawal');

    await increaseDateTo(start + interval);
    const { tx: tx1 } = await sale.withdraw({ from: buyer });
    const tranche1 = new BN((await getEvents(tx1, token, 'Transfer', web3))[0].args.value);
    const tokensExpected1 = tokensExpected.divn(Math.floor(duration / interval));
    expect(tranche1).to.be.bignumber.equal(tokensExpected1);

    await increaseDateTo(start + interval * 2);
    const { tx: tx2 } = await sale.withdraw({ from: buyer });
    const tranche2 = new BN((await getEvents(tx2, token, 'Transfer', web3))[0].args.value);
    const tokensExpected2 = tokensExpected.divn(Math.floor(duration / interval));
    expect(tranche2).to.be.bignumber.equal(tokensExpected2);

    await increaseDateTo(start + interval * 4);
    const { tx: tx3 } = await sale.withdraw({ from: buyer });
    const tranche3 = new BN((await getEvents(tx3, token, 'Transfer', web3))[0].args.value);
    const tokensExpected3 = tokensExpected.divn(Math.floor(duration / interval)).muln(2);
    expect(tranche3).to.be.bignumber.equal(tokensExpected3);

    await increaseDateTo(start + duration);
    const { tx: tx4 } = await sale.withdraw({ from: buyer });
    const tranche4 = new BN((await getEvents(tx4, token, 'Transfer', web3))[0].args.value);
    const tokensExpected4 = tokensExpected.sub(tokensExpected1).sub(tokensExpected2).sub(tokensExpected3);
    expect(tranche4).to.be.bignumber.equal(tokensExpected4);

    await expectRevert(sale.withdraw({ from: buyer }), 'CommonSale: No tokens available for withdrawal');
  });

  it('should behave correctly during all stages', async function () {
    const ethSent0 = ether('0.123');
    const ethSent1 = ether('0.456');
    const ethSent2 = ether('0.789');

    await increaseDateTo(STAGES[0].start);
    const { tx: tx0 } = await sale.sendTransaction({ value: ethSent0, from: buyer });
    const tokensExpected0 = ethSent0.muln(PRICE * (100 + STAGES[0].bonus)).divn(100);
    const tokensReceived0 = new BN((await getEvents(tx0, token, 'Transfer', web3))[0].args.value);
    expect(tokensReceived0).to.be.bignumber.equal(tokensExpected0);

    await increaseDateTo(STAGES[1].start);
    await sale.sendTransaction({ value: ethSent1, from: buyer });
    const tokensExpected1 = ethSent1.muln(PRICE * (100 + STAGES[1].bonus)).divn(100);
    const tokensBought1 = (await sale.balances(1, buyer)).initial;
    expect(tokensBought1).to.be.bignumber.equal(tokensExpected1);
    expect(await token.balanceOf(buyer)).to.be.bignumber.equal(tokensReceived0);

    await increaseDateTo(STAGES[2].start);
    await sale.sendTransaction({ value: ethSent2, from: buyer });
    const tokensExpected2 = ethSent2.muln(PRICE * (100 + STAGES[2].bonus)).divn(100);
    const tokensBought2 = (await sale.balances(2, buyer)).initial;
    expect(tokensBought2).to.be.bignumber.equal(tokensExpected2);
    expect(await token.balanceOf(buyer)).to.be.bignumber.equal(tokensReceived0);

    await increaseDateTo(VESTING_SCHEDULES[1].start + VESTING_SCHEDULES[1].interval);
    let { tx } = await sale.withdraw({ from: buyer });
    let tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
    let tokensVested1 = tokensExpected1.divn(Math.floor(VESTING_SCHEDULES[0].duration / VESTING_SCHEDULES[0].interval));
    let tokensVested2 = tokensExpected2.divn(Math.floor(VESTING_SCHEDULES[1].duration / VESTING_SCHEDULES[1].interval));
    let tokensExpected = tokensVested1.add(tokensVested2);
    expect(tranche).to.be.bignumber.equal(tokensExpected);

    await increaseDateTo(VESTING_SCHEDULES[1].start + VESTING_SCHEDULES[1].interval * 2);
    tx = (await sale.withdraw({ from: buyer })).tx;
    tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
    tokensVested1 = tokensExpected1.divn(Math.floor(VESTING_SCHEDULES[0].duration / VESTING_SCHEDULES[0].interval));
    tokensVested2 = tokensExpected2.divn(Math.floor(VESTING_SCHEDULES[1].duration / VESTING_SCHEDULES[1].interval));
    tokensExpected = tokensVested1.add(tokensVested2);
    expect(tranche).to.be.bignumber.equal(tokensExpected);

    await increaseDateTo(VESTING_SCHEDULES[0].start + VESTING_SCHEDULES[0].interval * 3);
    tx = (await sale.withdraw({ from: buyer })).tx;
    tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
    tokensExpected = tokensExpected1.divn(Math.floor(VESTING_SCHEDULES[0].duration / VESTING_SCHEDULES[0].interval));
    expect(tranche).to.be.bignumber.equal(tokensExpected);

    await increaseDateTo(VESTING_SCHEDULES[0].start + VESTING_SCHEDULES[0].duration);
    await sale.withdraw({ from: buyer });
    expect(await token.balanceOf(buyer)).to.be.bignumber.equal(tokensReceived0.add(tokensBought1).add(tokensBought2));

    await expectRevert(sale.withdraw({ from: buyer }), 'CommonSale: No tokens available for withdrawal');
  });

  it('should allow to withdraw all available tokens at the end of the vesting term', async function () {
    const { start, bonus } = STAGES[1];
    const { duration } = VESTING_SCHEDULES[0];
    await increaseDateTo(start);
    const ethSent = ether('0.456');
    await sale.sendTransaction({ value: ethSent, from: buyer });
    const tokensExpected = ethSent.muln(PRICE * (100 + bonus)).divn(100);
    await increaseDateTo(start + duration);
    const { tx } = await sale.withdraw({ from: buyer });
    const tranche = new BN((await getEvents(tx, token, 'Transfer', web3))[0].args.value);
    expect(tranche).to.be.bignumber.equal(tokensExpected);
  });
});
