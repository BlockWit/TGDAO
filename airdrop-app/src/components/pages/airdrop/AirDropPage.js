import React, { useState } from 'react';
import { Button, Container, Grid, makeStyles, TextField, Typography } from '@material-ui/core';
import { useWallet } from 'use-wallet';
import { AIRDROP_ADDRESS, owner } from '../../wallet/airDropContract';
import ShrinkAddress from '../../common/ShrinkAddress/ShrinkAddress';
import Loading from '../../common/Loading/Loading';
import { getWeb3FromWallet, REGEXP_ADDRESS, REGEXP_UINT } from '../../wallet/walletUtils';
import { balanceOf } from '../../wallet/erc20Contract';
import { BigNumber } from 'ethers';
import AirDropProcess from './AirDropProcess';
import { getAddress } from 'ethers/lib/utils';

export const calculateAirDropBalance = (values) => {
  let sum = BigNumber.from(0);
  for (let i = 0; i < values.length; i++) {
    sum = sum.add(values[i].balance);
  }
  return sum;
};

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

const AirDropPage = () => {
  const classes = useStyles();
  const wallet = useWallet();
  const web3Provider = getWeb3FromWallet(wallet);
  const account = wallet.account;

  const [state, setState] = useState({
    values: '',
    checkingMoney: false,
    moneyChecked: false,
    airdropBalance: null,
    airdropOwner: null,
    errorValue: true,
    errorValueMsg: 'Fill addresses before start AirDrop process',
    airDrops: []
  });

  if (state.airdropOwner === null) {
    owner(web3Provider).then(ownerAddress => {
      setState({
        ...state,
        airdropOwner: ownerAddress
      });
    });
    return (
      <Container className={classes.container} maxWidth="xs">
        <Typography variant={'h4'}>Loading AirDrop contract params</Typography>
        <Loading></Loading>
      </Container>
    );
  }

  if (account !== state.airdropOwner) {
    return (
      <Container className={classes.container} maxWidth="xs">
        Connected address <ShrinkAddress address={account}/> is not AirDrop contract owner.
        It must be equals <ShrinkAddress address={state.airdropOwner}/>.
      </Container>
    );
  }

  const onChange = (e) => {
    const value = e.target.value;
    if (value === null || value.leading == 0) {
      setState({
        ...state,
        errorValue: true
      });
    } else {
      let errors = false;
      if (value.trim().length === 0) {
        errors = true;
        setState({
          ...state,
          values: value,
          errorValue: true,
          errorValueMsg: 'You must fill addresses and balances'
        });
      }

      if (!errors) {
        const lines = value.split('\n');
        const airDrops = [];

        for (let i = 0; i < lines.length; i++) {
          const splitedValues = lines[i].split(',');
          if (splitedValues.length != 2) {
            errors = true;
            setState({
              ...state,
              values: value,
              errorValue: true,
              errorValueMsg: 'Each line must contains address and balance coma separated. Line ' + (i + 1) + ' not correct'
            });
            break;
          }

          const address = splitedValues[0].trim();
          if (!address.match(REGEXP_ADDRESS)) {
            errors = true;
            setState({
              ...state,
              values: value,
              errorValue: true,
              errorValueMsg: 'Didn\'t match address in line ' + (i + 1)
            });
            break;
          }

          const balance = splitedValues[1].trim();
          if (!balance.match(REGEXP_UINT)) {
            errors = true;
            setState({
              ...state,
              values: value,
              errorValue: true,
              errorValueMsg: 'Didn\'t match balance in line ' + (i + 1)
            });
            break;
          }

          airDrops.push({
            address: getAddress(address),
            balance: BigNumber.from(balance)
          });
        }

        if (!errors) {
          setState({
            ...state,
            values: value,
            errorValue: false,
            errorValueMsg: null,
            airDrops: airDrops
          });
        }
      }
    }
  };

  const checkAirDropBalances = (e) => {
    e.preventDefault();
    setState({
      ...state,
      checkingMoney: true
    });
    balanceOf(web3Provider, AIRDROP_ADDRESS).then(balance => {
      setState({
        ...state,
        airdropBalance: balance,
        checkingMoney: false,
        moneyChecked: true,
      });
    });
  };
  if (state.checkingMoney) {
    return (
      <>
        <Typography variant={'h4'}>Reading balance of AirDrop contract</Typography>
        <Loading/>
      </>
    );
  } else if (!state.checkingMoney && state.moneyChecked) {
    const airDropBalance = calculateAirDropBalance(state.airDrops);
    if (state.airdropBalance.gte(airDropBalance)) {
      return <AirDropProcess wallet={wallet}
                             account={account}
                             web3Provider={web3Provider}
                             airDrops={state.airDrops}
      />;
    } else {
      return (
        <Container className={classes.container} maxWidth={'md'}>
          <Grid container spacing={3}>
            <Grid item md={12}>
              <Typography variant="h6" align="center">
                AirDrop contract balance {state.airdropBalance.toString()} less than
                required {airDropBalance.toString()}
              </Typography>
            </Grid>
            <Grid item md={12}>
              <Button
                color="primary"
                fullWidth
                variant="contained"
                onClick={checkAirDropBalances}
              >
                Check again
              </Button>
            </Grid>
          </Grid>
        </Container>
      );
    }
  } else {

    return (
      <Container className={classes.container} maxWidth={'md'}>
        <Grid container spacing={3}>
          <Grid item md={12}>
            <Typography variant="h6" align="center">AirDrop process</Typography>
          </Grid>
        </Grid>
        <form noValidate autoComplete="off" onSubmit={checkAirDropBalances}>
          <Grid container spacing={3}>
            <Grid item md={12}>
              <TextField
                id="standard-multiline-flexible"
                label="Addresses with balances"
                multiline
                minRows={20}
                maxRows={20}
                value={state.values}
                onChange={onChange}
                variant="outlined"
                helperText={state.errorValueMsg}
                fullWidth
                error={state.errorValue}
              />
            </Grid>
            <Grid item md={12}>
              <Button
                color="primary"
                fullWidth type="submit"
                variant="contained"
                disabled={state.errorValue}
              >
                Prepare AirDrop for {state.airDrops.length} accounts
              </Button>
            </Grid>
          </Grid>
        </form>
      </Container>
    );
  }

  return <>AirDrop page</>;

};

export default AirDropPage;
