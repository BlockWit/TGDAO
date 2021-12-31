const { getEvents } = require('./util');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('TGDAOToken');
const MultiWallet = contract.fromArtifact('MultiWallet');
const DepositorContract = contract.fromArtifact("DepositorContract");

const [owner, account1, beneficiary] = accounts;
const balances = [ether('1000')];

describe('VestingWallet', async function () {
  describe('with a regular token release schedule', function () {
    let token;
    let wallet;
    let depositor;
    beforeEach(async function () {
      token = await Token.new([owner], balances, { from: owner });
      wallet = await MultiWallet.new({ from: owner });
      await wallet.setToken(token.address, { from: owner });
      depositor = await DepositorContract.new(token.address, wallet.address, { from: owner });
      token.transfer(depositor.address, balances[0], { from: owner });
    });

    it('should deposit tokens', async function () {
      await depositor.deposit(balances[0], { from: account1 });
      const yolo = await wallet.balances(1, account1);
      console.log(yolo.initial.toString(), yolo.withdrawn.toString());
    });
  });
});
