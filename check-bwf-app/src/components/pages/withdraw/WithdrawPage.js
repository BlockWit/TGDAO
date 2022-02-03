import React, { useState } from 'react';
import { makeStyles, Typography } from '@material-ui/core';
import { useWallet } from 'use-wallet';
import Loading from '../../common/Loading/Loading';
import { allStakerInfo, countOfStakeTypes } from '../../wallet/stakeContract';
import { getWeb3FromWallet } from '../../wallet/walletUtils';
import DataListView from '../../DataListView/DataListView';
import CanWithdraw from './CanWithdraw/CanWithdraw';
import { formatEther } from 'ethers/lib/utils';
import { calculateDepositWithFineOrReward } from '../../wallet/stakeHelpers';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  container: {
    backgroundColor: '#f2f2ff'
  },
  paper: {
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

const WithdrawPage = () => {
  const classes = useStyles();

  const [state, setState] = useState({
    loadingCountOfStakeTypes: false,
    loadedCountOfStakeTypes: false,
    countOfStakeTypes: null,
    loadingStakerInfo: false,
    loadedStakerInfo: false,
    stakerInfo: null
  });

  const wallet = useWallet();
  const account = wallet.account;
  const web3Provider = getWeb3FromWallet(wallet);

  if (state.loadedCountOfStakeTypes) {
    if (state.loadedStakerInfo) {
      const options = {
        custom: {
          stakeIndex: {
            title: 'Id',
            styles: {
              width: '20px',
              justifyContent: "flex-end"
            },
            customWrapper: (value) => {
              if(value == '')
                return 0;
              return parseInt(value);
            }
          },
          closed: {
            styles: {
              width: '40px'
            }
          },
          amount: {
            title: 'Amount',
            styles: {
              width: '50px',
              justifyContent: "flex-end"
            },
            customWrapper: (value) => formatEther(value)
          },
          amountAfter: {
            title: 'After withdraw',
            styles: {
              width: '120px',
              justifyContent: "flex-end"
            },
            customWrapper: (value, item) => {
              if (item.closed) {
                return formatEther(value);
              }
              return formatEther(calculateDepositWithFineOrReward(item.amount, item.stakeType, item.start));
            }
          },
          stakeType: {
            title: 'Stake program',
            styles: {
              width: '120px',
              justifyContent: "flex-end"
            },
            customWrapper: (value) => {
              const nvalue = parseInt(value);
              let stakeTypeInfo = '3 month';
              if (nvalue === 1) stakeTypeInfo = '6 month';
              if (nvalue === 2) stakeTypeInfo = '12 month';
              return <>{stakeTypeInfo}</>;
            }
          },
          start: {
            title: 'Deposited',
            styles: {
              width: '150px',
              justifyContent: "flex-end"
            },
            customWrapper: (value) => {
              const hrDate = new Date(value * 1000).toISOString().replace('T', ' ').substring(0, 19);
              return <>{hrDate}</>;
            }
          },
          finished: {
            title: 'Withdrawed',
            styles: {
              width: '150px',
              justifyContent: "flex-end"
            },
            customWrapper: (value) => {
              if (value == 0) {
                return <></>;
              }
              const hrDate = new Date(value * 1000).toISOString().replace('T', ' ').substring(0, 19);
              return <>{hrDate}</>;
            }
          },
          action: {
            title: ' ',
            styles: {
              width: '210px'
            },
            customWrapper: (value, item) => {
              if (!item.closed) {
                return <CanWithdraw item={item}/>;
              }
              return <></>;
            }
          }
        }
      };

      //const options = {};
      return <DataListView items={state.stakerInfo} options={options}/>;

    } else {
      allStakerInfo(web3Provider, account)
        .then(stakerInfo => {
          let index = 0;
          return stakerInfo.map(stakeInfo => {
            return {
              stakeIndex: index++,
              closed: stakeInfo.closed,
              amount: stakeInfo.amount,
              amountAfter: stakeInfo.amountAfter.toString(),
              stakeType: stakeInfo.stakeType.toNumber(),
              start: stakeInfo.start.toNumber(),
              finished: stakeInfo.finished.toNumber(),
              action: 'action'
            };
          });
        })
        .then(stakerInfo => {
          setState({
            ...state,
            stakerInfo: stakerInfo,
            loadingStakerInfo: false,
            loadedStakerInfo: true
          });
        });
      return (
        <>
          <Typography variant="h4">Loading all staker info for {account}</Typography>
          <Loading/>
        </>
      );
    }
  } else {
    if (state.loadingCountOfStakeTypes) {
      return (
        <>
          <Typography variant="h4">Loading count of stake types</Typography>
          <Loading/>
        </>
      );
    } else {
      countOfStakeTypes(web3Provider).then(countOfStakeTypesResult => {
        const countOfStakeTypesResultFixed = parseInt(countOfStakeTypesResult.toString());
        setState({
          ...state,
          countOfStakeTypes: countOfStakeTypesResultFixed,
          loadingCountOfStakeTypes: false,
          loadedCountOfStakeTypes: true
        });
      });
      return (
        <>
          <Typography variant="h4">Loading count of stake types</Typography>
          <Loading/>
        </>
      );
    }
  }

};

export default WithdrawPage;
