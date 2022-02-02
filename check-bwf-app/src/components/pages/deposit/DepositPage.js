import React, { useState } from 'react';
import { Button, Container, Grid, makeStyles, TextField, Typography } from '@material-ui/core';
import { useWeb3 } from '../../wallet/walletUtils';
import { approve } from '../../wallet/erc20Contract';
import { deposit, STAKING_ADDRESS } from '../../wallet/stakeContract';
import Loading from '../../common/Loading/Loading';
import ShrinkAddressTx from '../../common/ShrinkAddress/ShrinkAddressTx';
import { Navigate, useLocation } from 'react-router-dom';
import { PATH_WITHDRAW } from '../../../config/urlsConfig';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  container: {},
  paper: {
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

const DepositPage = () => {
  const classes = useStyles();
  const web3Provider = useWeb3();

  const [state, setState] = useState({
    approveAmount: 50,
    approveTx: null,
    approveTried: false,
    approveError: null,
    approveProcessing: false,
    approveSuccess: false,
    depositProgramIndex: 0,
    depositTx: null,
    depositTried: false,
    depositError: null,
    depositProcessing: false,
    depositSuccess: false
  });

  console.log('state: ', state);

  const location = useLocation();

  const onApprove = (e) => {
    e.preventDefault();
    console.log('approve value ', state.approveAmount);
    approve(web3Provider, STAKING_ADDRESS, state.approveAmount.toString()).then(tx => {
      setState({
        ...state,
        approveTx: tx,
        approveTried: true,
        approveProcessing: true
      });
    });
  };

  const onClickProgram = (e, programIndex) => {
    e.preventDefault();
    console.log('Deposit program clicked ', programIndex);
    deposit(web3Provider, programIndex, state.approveAmount.toString()).then(tx => {
      setState({
        ...state,
        depositProgramIndex: programIndex,
        depositTx: tx,
        depositTried: true,
        depositProcessing: true
      });
    });
  };

  const onChangeAmountToApprove = (e) => {
    e.preventDefault();
    setState({
      ...state,
      approveAmount: e.target.value
    });
  };

  if (state.approveProcessing) {
    web3Provider.getTransactionReceipt(state.approveTx.hash).then(txReceipt => {
      if (txReceipt != null) {
        console.log('tx receipt ', txReceipt);
        if (txReceipt.status === 1) {
          setState({
            ...state,
            approveProcessing: false,
            approveSuccess: true
          });
        }
      }
    });
    return (
      <>
        <Typography variant="h4">Approve processing</Typography>
        <ShrinkAddressTx tx={state.approveTx.hash}></ShrinkAddressTx>
        <Loading/>
      </>
    );
  }

  if (state.approveTried && !state.approveProcessing && !state.depositTried) {
    if (state.approveSuccess) {
      return (
        <Container className={classes.container} maxWidth="xs">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" align="center">desposit</Typography>
            </Grid>
          </Grid>
          <form noValidate autoComplete="off" onSubmit={onApprove}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Button color="primary" fullWidth type="submit" variant="contained"
                        onClick={(e) => onClickProgram(e, 0)}>Deposit {state.approveAmount} to program 3m</Button>
              </Grid>
              <Grid item xs={12}>
                <Button color="primary" fullWidth type="submit" variant="contained"
                        onClick={(e) => onClickProgram(e, 1)}>Deposit {state.approveAmount} to program 6m</Button>
              </Grid>
              <Grid item xs={12}>
                <Button color="primary" fullWidth type="submit" variant="contained"
                        onClick={(e) => onClickProgram(e, 2)}>Deposit {state.approveAmount} to program 12m</Button>
              </Grid>
            </Grid>
          </form>
        </Container>
      );
    } else {
      return (
        <>
          <Typography variant="h4">Approve failed</Typography>
          <ShrinkAddressTx tx={state.approveTx.hash}></ShrinkAddressTx>
        </>
      );
    }
  }

  if (state.depositProcessing) {
    web3Provider.getTransactionReceipt(state.depositTx.hash).then(txReceipt => {
      if (txReceipt != null) {
        console.log('tx receipt for deposit ', txReceipt);
        if (txReceipt.status === 1) {
          setState({
            ...state,
            depositProcessing: false,
            depositSuccess: true
          });
        }
      }
    });
    return (
      <>
        <Typography variant="h4">Deposit processing</Typography>
        <ShrinkAddressTx tx={state.depositTx.hash}></ShrinkAddressTx>
        <Loading/>
      </>
    );
  }

  if (state.depositTried && !state.depositProcessing) {
    if (state.depositSuccess) {
      return <Navigate to={PATH_WITHDRAW} state={{ from: location.pathname }}/>;
    } else {
      return (
        <>
          <Typography variant="h4">Deposit failed</Typography>
          <ShrinkAddressTx tx={state.depositTx.hash}></ShrinkAddressTx>
        </>
      );
    }
  }

  return (
    <Container className={classes.container} maxWidth="xs">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" align="center">approve</Typography>
        </Grid>
      </Grid>
      <form noValidate autoComplete="off" onSubmit={onApprove}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Amount"
                  variant="outlined"
                  value={state.approveAmount}
                  onChange={onChangeAmountToApprove}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Button color="primary" fullWidth type="submit" variant="contained">Approve</Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );

};

export default DepositPage;
