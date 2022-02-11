import { ethers } from 'ethers';
import { useWallet } from 'use-wallet';

export const REGEXP_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
export const REGEXP_UINT = /^\d{1,36}$/;

const NETWORK_NAME_ROPSTEN = 'ropsten';

export const networkName = NETWORK_NAME_ROPSTEN;

export const getWeb3FromWallet = (wallet) => {
  return new ethers.providers.Web3Provider(wallet.ethereum);
};

export const useWeb3 = () => {
  return getWeb3FromWallet(useWallet());
};
