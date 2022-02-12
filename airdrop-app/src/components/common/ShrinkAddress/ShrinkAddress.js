import React from 'react';
import { makeStyles } from '@material-ui/core';
import { networkName } from '../../wallet/walletUtils';

const useStyles = makeStyles((theme) => ({
  link: {
    textDecoration: 'none !important',
    color: theme.palette.primary + ' !important'
  }
}));

const ShrinkAddress = ({ address, shrinkLength = 10, shrink = true}) => {
  const classes = useStyles();

  let visibleAddress = address;

  if(shrink) {
    if (address.length >= 20) {
      visibleAddress = address.substring(0, shrinkLength) + '...' + address.substring(address.length - shrinkLength);
    }
  }

  return (
    <a href={'https://' + networkName + 'bscscan.com/address/' + address} target={'_blank'}
       className={classes.link}
    >{visibleAddress}</a>
  );
};

export default ShrinkAddress;
