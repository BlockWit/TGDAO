import { ethers } from 'ethers';
import { useWeb3 } from './walletUtils';
import { parseEther } from 'ethers/lib/utils';

const STAKING_ABI = [
  'function stakers(address stakerAddress) public view returns (uint256 extsts, uint256 count, uint256 summerDeposit, uint256 summerAfter)',
  'function countOfStakeTypes() public view returns (uint256)',
  'function deposit(uint8 stakeTypeIndex, uint256 amount) public returns(uint)',
  'function withdraw(uint8 stakeIndex) public',
  'function getStakeTypeFinePeriodAndFine(uint8 stakeTypeIndex, uint periodIndex) public view returns(uint, uint)',
  'function getStakerStakeParams(address stakerAddress, uint stakeIndex) public view returns(bool closed, uint amount, uint amountAfter, uint stakeType, uint start, uint finished)'
];

export const STAKING_ADDRESS = '0xf71d743C6aA83164222b14FA831A4Cb346Ac0D4e';

const stakeContractFromProvider = (web3provider) => {
  return new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, web3provider);
};

const useStakeContract = () => {
  return stakeContractFromProvider(useWeb3());
};

export async function withdraw (web3Provider, stakeIndex) {
  const stakingContract = stakeContractFromProvider(web3Provider);
  const signer = web3Provider.getSigner();
  const contractWithSigner = stakingContract.connect(signer);
  console.log("WITHDRAW: ", stakeIndex);
  return await contractWithSigner.withdraw(stakeIndex);
}

export async function deposit (web3Provider, stakeProgramIndex, amount) {
  const stakingContract = stakeContractFromProvider(web3Provider);
  const signer = web3Provider.getSigner();
  const contractWithSigner = stakingContract.connect(signer);
  return await contractWithSigner.deposit(stakeProgramIndex, parseEther(amount));
}

export async function countOfStakeTypes (web3Provider) {
  const stakingContract = stakeContractFromProvider(web3Provider);
  return await stakingContract.countOfStakeTypes();
}

export async function stakers (web3Provider, stakerAddress) {
  const stakingContract = stakeContractFromProvider(web3Provider);
  return await stakingContract.stakers(stakerAddress);
}

export async function getStakerStakeParams (web3Provider, stakerAddress, stakeIndex) {
  const stakingContract = stakeContractFromProvider(web3Provider);
  return await stakingContract.getStakerStakeParams(stakerAddress, stakeIndex);
}

export async function allStakerInfo (web3Provider, stakerAddress) {
  return await stakers(web3Provider, stakerAddress).then(staker => {
    const countOfStakes = staker.count.toNumber();
    const arrayOfStakes = [...Array(countOfStakes).keys()];
    return Promise.all(arrayOfStakes.map(stakeIndex => {
      return getStakerStakeParams(web3Provider, stakerAddress, stakeIndex);
    }));
  });
}


