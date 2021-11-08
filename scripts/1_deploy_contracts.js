const Token = artifacts.require('TGDAOToken');
const Sale = artifacts.require('CommonSale');
const Wallet = artifacts.require('VestingWallet');
const { logger } = require('./util');
const { toWei } = web3.utils;
const { time } = require('@openzeppelin/test-helpers');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();

  const OWNER_ADDRESS = '0x5FbcC7e4b7aFe31a5eE13Df24abd50E0f3068Cd8';
  const ETH_WALLET_ADDRESS = '0x67B8CAF85C727A27935570Caf0e62f265c0d95ff';
  const VESTING_START = time.duration.seconds(1636416000);

  // casual eth accounts
  const accounts = [];
  accounts[0] = '0x0113518FBcE33BA055d3753DaF0903f64a49554E'; // Liquidity
  accounts[1] = '0x7bd37252Fd94D98Dd9aF3e1aB45a58aC31B8a45F'; // Farming
  accounts[2] = '0xEb39C884d2C7B54520D0F9a24E0ffcf1aE6B58D0'; // Airdrop
  accounts[3] = '0x0e0B94E5EE8F82305e7Ca3f83c3d3B6b5dD80d44'; // Swap fund

  // owners of vesting wallets
  const walletOwners = [];
  walletOwners[0] = '0x9241750A09CdB56D33582e2Ea92Ed448806B8f53'; // Company reserve
  walletOwners[1] = '0xf1edD24D2c517A17Ab1D32EE8d46C327c1389539'; // Launch team
  walletOwners[2] = '0x594c80E7dF5775b142587Cf3A609a010248EaBEc'; // Development team
  walletOwners[3] = '0xD00e8C8151Fadc16392796c50327E73d20Bb0dc1'; // Marketing
  walletOwners[4] = '0x68E543680f1b91236c30d009FFE699f7f8DE1a49'; // Advisors
  walletOwners[5] = '0x76E945bc22fd03C7268a33aD39beC7042Dfe5288'; // Seed round

  // vesting schedules
  const schedules = [];
  // Company reserve: lock for 6 months
  schedules[0] = { start: VESTING_START, duration: time.duration.days(180), interval: time.duration.days(180) };
  // Launch team: unlock 10% monthly after 3 months
  schedules[1] = { start: VESTING_START.add(time.duration.days(90)), duration: time.duration.days(300), interval: time.duration.days(30) };
  // Development team: unlock 2,5% monthly after 6 months
  schedules[2] = { start: VESTING_START.add(time.duration.days(180)), duration: time.duration.days(1200), interval: time.duration.days(30) };
  // Marketing: lock for 6 months
  schedules[3] = { start: VESTING_START, duration: time.duration.days(180), interval: time.duration.days(180) };
  // Advisors: unlock 10% monthly after 6 months
  schedules[4] = { start: VESTING_START.add(time.duration.days(180)), duration: time.duration.days(300), interval: time.duration.days(30) };
  // Seed round: unlock 20% monthly after 6 months
  schedules[5] = { start: VESTING_START.add(time.duration.days(180)), duration: time.duration.days(150), interval: time.duration.days(30) };

  // supplies
  const supplies = [];
  supplies[0] = toWei('3000000', 'ether'); // Liquidity
  supplies[1] = toWei('600000', 'ether'); // Farming
  supplies[2] = toWei('250000', 'ether'); // Airdrop
  supplies[3] = toWei('3000000', 'ether'); // Swap fond
  supplies[4] = toWei('2400000', 'ether'); // Company Reserve
  supplies[5] = toWei('2250000', 'ether'); // Launch team
  supplies[6] = toWei('2250000', 'ether'); // Development team
  supplies[7] = toWei('4500000', 'ether'); // Marketing
  supplies[8] = toWei('1000000', 'ether'); // Advisors
  supplies[9] = toWei('3750000', 'ether'); // Seed round
  supplies[10] = toWei('7000000', 'ether'); // Funds (3.5M) + Public partners (500K) + Public sale (3M)

  // create vesting wallets
  const wallets = [];
  for (let i = 0; i < walletOwners.length; i++) {
    const { start, duration, interval } = schedules[i];
    const wallet = await Wallet.new(walletOwners[i], start, duration, interval);
    log(`Wallet deployed: @address{${wallet.address}}`);
    wallets.push(wallet);
    accounts.push(wallet.address);
  }

  const sale = await Sale.new({ from: deployer });
  log(`Sale deployed: @address{${sale.address}}`);
  await sale.setWallet(ETH_WALLET_ADDRESS);
  log(`Sale wallet set`);
  await sale.setPrice(toWei('3500', 'ether'), { from: deployer });
  log(`Sale price set`);
  await sale.setVestingSchedule(1, VESTING_START.add(time.duration.days(90)), time.duration.days(300), time.duration.days(30));
  log(`Sale vesting schedule set`);
  // funds round
  await sale.addStage(1634256000, 1635120000, 200, toWei('23.786', 'ether'), 0, 0, toWei('3500000', 'ether'), 1);
  log(`Sale stage 0 added`);
  // public partners round
  await sale.addStage(1635120000, 1635206400, 50, toWei('23.786', 'ether'), 0, 0, toWei('500000', 'ether'), 0);
  log(`Sale stage 1 added`);
  // public sale round
  await sale.addStage(1635897600, 1635984000, 0, toWei('23.786', 'ether'), 0, 0, toWei('6000000', 'ether'), 0);
  log(`Sale stage 2 added`);

  accounts.push(sale.address);

  if (accounts.length !== supplies.length) throw new Error('accounts and supplies have different lengths');

  const token = await Token.new(accounts, supplies, { from: deployer });
  log(`Token deployed: @address{${token.address}}`);
  await token.transferOwnership(OWNER_ADDRESS);
  log(`Token ownership transferred`);

  // finish sale configuration
  await sale.setToken(token.address);
  log(`Sale token set`);
  await sale.transferOwnership(OWNER_ADDRESS);
  log(`Sale ownership transferred`);

  // finish wallet configuration
  for (let i = 0; i < wallets.length; i++) {
    await wallets[i].setToken(token.address);
    log(`Wallet ${i} token set`);
    await wallets[i].transferOwnership(OWNER_ADDRESS);
    log(`Wallet ${i} ownership transferred`);
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
