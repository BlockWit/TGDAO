import React from 'react';
import { Button } from '@material-ui/core';
import { useWallet } from 'use-wallet';
import ShrinkAddress from '../../../common/ShrinkAddress/ShrinkAddress';

const NavbarMenuItem = () => {
  const wallet = useWallet();

  if (wallet.isConnected()) {
    return <ShrinkAddress address={wallet.account}></ShrinkAddress>;
  }

  return (
    <Button onClick={() => wallet.connect()} variant="outlined" color="primary">MetaMask</Button>
  );

};
export default NavbarMenuItem;
