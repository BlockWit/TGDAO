const Sale = artifacts.require('CrowdSale');
const { logger } = require('./util');
const { ether } = require('@openzeppelin/test-helpers');

async function deploy () {
  const args = process.argv.slice(2);
  const SALE_ADDRESS = args[args.findIndex(argName => argName === '--sale') + 1];
  const TOKEN_ADDRESS = args[args.findIndex(argName => argName === '--token') + 1];
  const WALLET_ADDRESS = args[args.findIndex(argName => argName === '--wallet') + 1];

  const PRICE = '23562485996631';
  const FUNDRAISING_WALLET = '0x67B8CAF85C727A27935570Caf0e62f265c0d95ff';
  const STAGE = {
    id: 0,
    start: 1641988800,
    end: 1642593600,
    bonus: 0,
    minInvestmentLimit: ether('5857'),
    hardcap: ether('2500000'),
    vestingSchedule: 6
  };

  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();

  const sale = await Sale.at(SALE_ADDRESS);

  {
    log(`CrowdSale. Set token.`);
    const tx = await sale.setToken(TOKEN_ADDRESS, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`CrowdSale. Set fundraising wallet.`);
    const tx = await sale.setFundraisingWallet(FUNDRAISING_WALLET, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`CrowdSale. Set vesting wallet.`);
    const tx = await sale.setVestingWallet(WALLET_ADDRESS, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`CrowdSale. set price.`);
    const tx = await sale.setPrice(ether(PRICE), { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`CrowdSale. set stage.`);
    const { id, start, end, bonus, minInvestmentLimit, hardcap, vestingSchedule } = STAGE;
    const tx = await sale.setStage(id, start, end, bonus, minInvestmentLimit, hardcap, vestingSchedule, 0, 0, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
}

module.exports = async function main (callback) {
  try {
    await deploy();
    console.log('success');
    callback(null);
  } catch (e) {
    console.log('error');
    console.log(e);
    callback(e);
  }
};
