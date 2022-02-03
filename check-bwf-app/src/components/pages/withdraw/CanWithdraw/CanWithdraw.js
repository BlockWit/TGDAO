import React, { useState } from 'react';
import { Button, makeStyles, Typography } from '@material-ui/core';
import ShrinkAddressTx from '../../../common/ShrinkAddress/ShrinkAddressTx';
import Loading from '../../../common/Loading/Loading';
import { useWeb3 } from '../../../wallet/walletUtils';
import { withdraw } from '../../../wallet/stakeContract';

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

const CanWithdraw = ({ item }) => {
  const classes = useStyles();

  const [state, setState] = useState({
    withdrawTried: false,
    withdrawProcessing: false,
    withdrawSuccess: false,
    withdrawTx: null,
    withdrawError: null
  });

  const web3Provider = useWeb3();

  let period = 3 * 30 * 86400;
  if (item.stakeType == 1) period = 6 * 30 * 86400;
  if (item.stakeType == 2) period = 12 * 30 * 86400;

  let buttonLabel = 'get deposit with fine';
  if (item.start + period < Math.floor(Date.now() / 1000)) {
    buttonLabel = 'get deposit with reward';
  }

  const onWithdraw = (e) => {
    e.preventDefault();
    console.log('Withdraw program clicked ', item.stakeIndex);
    withdraw(web3Provider, item.stakeIndex).then(tx => {
      setState({
        ...state,
        withdrawTried: true,
        withdrawProcessing: true,
        withdrawTx: tx
      });
    });
  };

  if (state.withdrawTried) {
    if (state.withdrawProcessing) {
      web3Provider.getTransactionReceipt(state.withdrawTx.hash).then(txReceipt => {
        if (txReceipt != null) {
          console.log('tx receipt ', txReceipt);
          if (txReceipt.status === 1) {
            setState({
              ...state,
              withdrawProcessing: false,
              withdrawSuccess: true
            });
          } else {
            setState({
              ...state,
              withdrawProcessing: false,
              withdrawSuccess: false
            });
          }
        }
      });
      return (
        <>
          <Typography variant="h4">Approve processing</Typography>
          <ShrinkAddressTx tx={state.withdrawTx.hash}></ShrinkAddressTx>
          <Loading/>
        </>
      );
    } else {
      if (state.withdrawSuccess) {
        return (
          <>
            Successfully withdrawed
            <ShrinkAddressTx tx={state.withdrawTx.hash}/>
          </>
        );
      } else {
        return <>Error occurs</>;
      }
    }
  } else {
    const buttonId = "withdraw-" + item.stakeIndex;
    return <Button id={buttonId} variant="outlined" color="primary" onClick={onWithdraw}>{buttonLabel}</Button>;
  }

};

export default CanWithdraw;
