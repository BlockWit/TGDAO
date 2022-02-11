const Staking = artifacts.require('TGDAOStaking');
const { logger } = require('./util');

async function deploy () {
  const args = process.argv.slice(2);
  const TOKEN_ADDRESS = args[args.findIndex(argName => argName === '--token') + 1];

  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();

  const staking = await Staking.new({ from: deployer });
  log(`Staking contract deployed: @address{${staking.address}}`);

  log(`Staking. Configure using token address ${TOKEN_ADDRESS}.`);
  const tx = await staking.configure(TOKEN_ADDRESS, { from: deployer });
  log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
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
