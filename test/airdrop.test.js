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
const AirDrop = contract.fromArtifact('AirDrop');

const [account1, account2, account3, account4, account5, account6, owner] = accounts;

const supply = [ether('100'), ether('200'), ether('300'), ether('400'), ether('500'), ether('600'), ether('10000')];

const initialAccounts = [account1, account2, account3, account4, account5, account6, owner];
const initialBalances = supply;

describe('AirDrop', async () => {
  let token;
  let airDrop;

  beforeEach(async function () {
    token = await Token.new(initialAccounts, initialBalances, { from: owner });
    airDrop = await AirDrop.new({ from: owner });
  });

  describe('setToken', function () {
    it('not owner can not call setToken', async function () {
      await expectRevert(airDrop.setToken(token.address, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('owner setToken works correctly', async function () {
      await airDrop.setToken(token.address, { from: owner });
      expect(await airDrop.token()).to.be.equal(token.address);
    });
  });

  describe('Check only owner functions throws corresponding excepion', function () {
    it('airdropMultiple', async function () {
      await expectRevert(airDrop.airdropMultiple(token.address, initialAccounts, initialBalances, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('airdropMultipleWithPredefinedToken', async function () {
      await expectRevert(airDrop.airdropMultipleWithPredefinedToken(initialAccounts, initialBalances, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('airdropMultipleEquals', async function () {
      await expectRevert(airDrop.airdropMultipleEquals(ether('1'), token.address, initialAccounts, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('airdropMultipleWithEqualsPredefinedToken', async function () {
      await expectRevert(airDrop.airdropMultipleWithEqualsPredefinedToken(ether('1'), initialAccounts, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
    it('setToken', async function () {
      await expectRevert(airDrop.setToken(token.address, { from: account1 }),
        'Ownable: caller is not the owner'
      );
    });
  });

  describe('Check AirDrop', function () {
    it('Predefined airdrop', async function () {

    });
  });
});
