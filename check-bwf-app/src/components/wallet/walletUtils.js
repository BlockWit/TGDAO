import { ethers } from 'ethers';
import { useWallet } from 'use-wallet';

const NETWORK_NAME_ROPSTEN = 'ropsten';

export const networkName = NETWORK_NAME_ROPSTEN;

export const getWeb3FromWallet = (wallet) => {
  return new ethers.providers.Web3Provider(wallet.ethereum);
};

export const useWeb3 = () => {
  return getWeb3FromWallet(useWallet());
};
