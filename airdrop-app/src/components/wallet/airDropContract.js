import { ethers } from 'ethers';
import { useWeb3 } from './walletUtils';

const STAKING_ABI = [
  'function owner() public view returns(address)',
  'function setToken(address tokenAddress) public returns(uint)',
  'function balanceOfPredefinedToken() public view returns(uint)',
  'function airdropMultiple(address tokenAddress, address[] memory addresses, uint[] memory values) public',
  'function airdropMultipleWithPredefinedToken(address[] memory addresses, uint[] memory values) public',
  'function airdropMultipleEquals(uint value, address tokenAddress, address[] memory addresses) public',
  'function airdropMultipleWithEqualsPredefinedToken(uint value, address[] memory addresses) public'
];

export const AIRDROP_ADDRESS = '0x4DEbDF80D5aC6Cab5845B797CEBeE63167435Fba';

const airDropContractFromProvider = (web3provider) => {
  return new ethers.Contract(AIRDROP_ADDRESS, STAKING_ABI, web3provider);
};

const useAirDropContract = () => {
  return airDropContractFromProvider(useWeb3());
};

export async function owner (web3Provider) {
  const airDropContract = airDropContractFromProvider(web3Provider);
  return await airDropContract.owner();
}

export async function airdropMultipleWithPredefinedToken (web3Provider, addresses, values) {
  console.log("airdropMultipleWithPredefinedToken called");
  const airDropContract = airDropContractFromProvider(web3Provider);
  const signer = web3Provider.getSigner();
  const contractWithSigner = airDropContract.connect(signer);
  return await contractWithSigner.airdropMultipleWithPredefinedToken(addresses, values);
}

