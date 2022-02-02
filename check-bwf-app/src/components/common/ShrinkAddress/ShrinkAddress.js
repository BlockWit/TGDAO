import React from 'react';
import { makeStyles } from '@material-ui/core';
import { networkName } from '../../wallet/walletUtils';

const useStyles = makeStyles((theme) => ({
  link: {
    textDecoration: 'none !important',
    color: theme.palette.primary + ' !important'
  }
}));

const ShrinkAddress = ({ address }) => {
  const classes = useStyles();

  let visibleAddress = address;
  if (address.length >= 20) {
    const shrinkLength = 10;
    visibleAddress = address.substring(0, shrinkLength) + '...' + address.substring(address.length - shrinkLength);
  }

  return (
    <a href={'https://' + networkName + '.etherscan.io/address/' + address} target={'_blank'}
       className={classes.link}
    >{visibleAddress}</a>
  );
};

export default ShrinkAddress;
