import { BigNumber, ethers } from 'ethers';
import { useWeb3 } from './walletUtils';
import { parseEther } from 'ethers/lib/utils';

const STAKING_ABI = [
  'function stakers(address stakerAddress) public view returns (uint256 extsts, uint256 count, uint256 summerDeposit, uint256 summerAfter)',
  'function countOfStakeTypes() public view returns (uint256)',
  'function addStakeTypeWithFines(uint periodInDays, uint apy, uint[] memory fines, uint[] memory fineDays) public',
  'function setStakeTypeFines(uint stakeTypeIndex, uint[] memory fines, uint[] memory fineDays) public',
  'function changeStakeType(uint stakeTypeIndex, bool active, uint periodInDays, uint apy) public',
  'function addStakeType(uint periodInDays, uint apy) public returns(uint)',
  'function setToken(address tokenAddress) public',
  'function deposit(uint8 stakeTypeIndex, uint256 amount) public returns(uint)',
  'function withdraw(uint8 stakeIndex) public',
  'function withdrawAll(address to) public',
  'function getStakeTypeFinePeriodAndFine(uint8 stakeTypeIndex, uint periodIndex) public view returns(uint, uint)',
  'function getStakerStakeParams(address stakerAddress, uint stakeIndex) public view returns(bool closed, uint amount, uint amountAfter, uint stakeType, uint start, uint finished)'
];

export const STAKING_ADDRESS = '0xff447f75C476757fA3669D75a3CEC9856daCE384';

const stakeContractFromProvider = (web3provider) => {
  return new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, web3provider);
};

const useStakeContract = () => {
  return stakeContractFromProvider(useWeb3());
};

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
  // const stakingContract = stakeContractFromProvider(web3Provider);
  // return await stakingContract.getStakerStakeParams(stakerAddress, stakeIndex);
}

// const useDeposite = (stakeProgramIndex, amount) => {
//   const web3Provider = useWeb3();
//
//   const [params, setParams] = useState({
//     approveTried: false,
//     depositeTried: false,
//     approve: false,
//     deposit: false,
//     approveProcessing: false,
//     depositProcessing: false,
//     approveError: false,
//     depositError: false,
//     approveTx: null
//   });
//
//   if (params.approveTried === false && params.approveProcessing === false) {
//     approve(web3Provider, amount).then(tx => {
//       setParams({
//         ...params,
//         approveTried: true,
//         approveProcessing: true,
//         approveTx: tx
//       });
//     });
//   } else if (params.approveTried === true && params.approveProcessing === true) {
//     console.log("Should check Tx mined");
//   }
//
//   return params;
// }

// const useAllStakes = () => {
//   const stakeContract = useStakeContract();
//   stakeContract.
//   const [ initialCDO, withdrawedCDO, balanceETH, withdrawalPolicy ] = await contract.balances(accountAddress);
//   return { initialCDO: initialCDO.toString(), withdrawedCDO: withdrawedCDO.toString(), balanceETH: balanceETH.toString(), withdrawalPolicy: withdrawalPolicy.toString() };
// }

export const stakePrograms = [
  {
    active: true,
    periodInDaysBN: 90,
    apyBN: 7,
    finesPeriodsCountBN: 3,
    fineDaysBSs: [30, 60, 90],
    finesBSs: [30, 25, 20]
  },
  {
    active: true,
    periodInDaysBN: 180,
    apyBN: 14,
    finesPeriodsCountBN: 3,
    fineDaysBSs: [60, 120, 180],
    finesBSs: [30, 25, 20]
  },
  {
    active: true,
    periodInDaysBN: 360,
    apyBN: 21,
    finesPeriodsCountBN: 3,
    fineDaysBSs: [120, 240, 360],
    finesBSs: [30, 25, 20]
  }
];

export const calculateDepositWithFineOrReward = (amount, stakeProgramIndex, start) => {
  const stakeProgram = stakePrograms[stakeProgramIndex];
  const now = Math.floor(Date.now() / 1000);
  if(now > start + stakeProgram.periodInDaysBN*86400) {
    // TODO: Wrong calculation
    return amount.mul(BigNumber.from(100 + stakeProgram.apyBN)).div(BigNumber.from(100));
  }

  let takeFinePeriodIndex = stakeProgram.finesBSs.length - 1;
  for(let i = stakeProgram.fineDaysBSs.length - 1; i>=0 ;i--) {
    if(now < start + stakeProgram.fineDaysBSs[i]*86400) {
      takeFinePeriodIndex = i;
    }
  }

  return amount.mul(BigNumber.from(100 - stakeProgram.finesBSs[takeFinePeriodIndex])).div(BigNumber.from(100));
}



