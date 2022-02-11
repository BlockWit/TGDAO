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
const transferred = [ether('10'), ether('20'), ether('30'), ether('40'), ether('50'), ether('60')];
const afterTransfer = [ether('110'), ether('220'), ether('330'), ether('440'), ether('550'), ether('660')];
const summerTransfer = ether('210');
const ownerAfterTransfer = ether('9790');

const initialAccounts = [account1, account2, account3, account4, account5, account6, owner];
const airDropAccounts = [account1, account2, account3, account4, account5, account6];
const initialBalances = supply;



const transferredEquals = ether('10');
const afterTransferEquals = [ether('110'), ether('210'), ether('310'), ether('410'), ether('510'), ether('610')];
const summerTransferEquals = ether('60');
const ownerAfterTransferEquals = ether('9940');


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
    it('airdropMultiple: Predefined airdrop', async function () {
      await token.transfer(airDrop.address, summerTransfer, { from: owner });
      expect(await token.balanceOf(owner)).to.be.bignumber.equal(ownerAfterTransfer);
      expect(await token.balanceOf(airDrop.address)).to.be.bignumber.equal(summerTransfer);
      await airDrop.airdropMultiple(token.address, airDropAccounts, transferred, { from: owner });
      expect(await token.balanceOf(airDrop.address)).to.be.bignumber.equal(ether('0'));
      for (let i = 0; i < airDropAccounts.length; i++) {
        expect(await token.balanceOf(airDropAccounts[i])).to.be.bignumber.equal(afterTransfer[i]);
      }
    });
    it('airdropMultipleWithPredefinedToken: Predefined airdrop', async function () {
      await airDrop.setToken(token.address, { from: owner });
      expect(await airDrop.token()).to.be.equal(token.address);
      await token.transfer(airDrop.address, summerTransfer, { from: owner });
      expect(await token.balanceOf(owner)).to.be.bignumber.equal(ownerAfterTransfer);
      expect(await token.balanceOf(airDrop.address)).to.be.bignumber.equal(summerTransfer);
      await airDrop.airdropMultipleWithPredefinedToken(airDropAccounts, transferred, { from: owner });
      expect(await token.balanceOf(airDrop.address)).to.be.bignumber.equal(ether('0'));
      for (let i = 0; i < airDropAccounts.length; i++) {
        expect(await token.balanceOf(airDropAccounts[i])).to.be.bignumber.equal(afterTransfer[i]);
      }
    });
    it('airdropMultipleEquals: Predefined airdrop', async function () {
      await token.transfer(airDrop.address, summerTransferEquals, { from: owner });
      expect(await token.balanceOf(owner)).to.be.bignumber.equal(ownerAfterTransferEquals);
      expect(await token.balanceOf(airDrop.address)).to.be.bignumber.equal(summerTransferEquals);
      await airDrop.airdropMultipleEquals(transferredEquals, token.address, airDropAccounts, { from: owner });
      expect(await token.balanceOf(airDrop.address)).to.be.bignumber.equal(ether('0'));
      for (let i = 0; i < airDropAccounts.length; i++) {
        expect(await token.balanceOf(airDropAccounts[i])).to.be.bignumber.equal(afterTransferEquals[i]);
      }
    });
    it('airdropMultipleWithEqualsPredefinedToken: Predefined airdrop', async function () {
      await airDrop.setToken(token.address, { from: owner });
      expect(await airDrop.token()).to.be.equal(token.address);
      await token.transfer(airDrop.address, summerTransferEquals, { from: owner });
      expect(await token.balanceOf(owner)).to.be.bignumber.equal(ownerAfterTransferEquals);
      expect(await token.balanceOf(airDrop.address)).to.be.bignumber.equal(summerTransferEquals);
      await airDrop.airdropMultipleWithEqualsPredefinedToken(transferredEquals, airDropAccounts, { from: owner });
      expect(await token.balanceOf(airDrop.address)).to.be.bignumber.equal(ether('0'));
      for (let i = 0; i < airDropAccounts.length; i++) {
        expect(await token.balanceOf(airDropAccounts[i])).to.be.bignumber.equal(afterTransferEquals[i]);
      }
    });
  });
});
