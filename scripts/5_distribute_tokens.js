const TokenDepositor = artifacts.require('TokenDepositor');
const { logger } = require('./util');

async function deploy () {
  const args = process.argv.slice(2);
  const DEPOSITOR_ADDRESS = args[args.findIndex(argName => argName === '--depositor') + 1];

  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();

  const depositor = await TokenDepositor.at(DEPOSITOR_ADDRESS);

  {
    log(`Depositor. Round B.`);
    const unlocked = 5;
    const schedule = 2;
    const addresses = [];
    const balances = [];
    const tx = await depositor.deposit(unlocked, schedule, addresses, balances, { from: deployer });
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
