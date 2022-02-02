import React from 'react';
import { Button, makeStyles } from '@material-ui/core';
import { calculateDepositWithFineOrReward } from '../../../wallet/stakeContract';

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

  let period = 3 * 30 * 86400;
  if (item.stakeType == 1) period = 6 * 30 * 86400;
  if (item.stakeType == 2) period = 12 * 30 * 86400;

  let buttonLabel = 'get deposit with fine';
  if (item.start + period < Math.floor(Date.now() / 1000)) {
    buttonLabel = 'get deposit with reward';
  }

  return (
    <Button variant="outlined" color="primary">{buttonLabel}</Button>
  );
};

export default CanWithdraw;
