import { ethers } from 'ethers';
import { useWeb3 } from './walletUtils';
import { parseEther } from 'ethers/lib/utils';

const ERC20_ABI = [
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address recipient, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)'
];

const ERC20_ADDRESS = '0x60CA35A6FD8Ea3560176475CedAbac8a5DB4E4cF';

export const useERC20Contract = () => {
  return erc20ContractFromProvider(useWeb3());
};

export const erc20ContractFromProvider = (web3provider) => {
  return new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, web3provider);
};

export async function approve(web3Provider, to, amount) {
  const erc20Contract = erc20ContractFromProvider(web3Provider);
  const signer = web3Provider.getSigner();
  const contractWithSigner = erc20Contract.connect(signer);
  return await contractWithSigner.approve(to, parseEther(amount));
}
