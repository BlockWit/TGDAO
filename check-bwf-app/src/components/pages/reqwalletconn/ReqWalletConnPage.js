import React from 'react';
import { Container } from '@material-ui/core';
import { useLocation } from 'react-router';
import { Navigate } from 'react-router-dom';
import { useWallet } from 'use-wallet';

const ReqWalletConnPage = () => {

  const connected = useWallet().isConnected();

  let location = useLocation();

  if (connected) {
    return <Navigate to={location.state.from}/>;
  }

  return (
    <Container>
      Requires wallet connection. Press MetaMask button on top right corner your browser menu.
      After wallet selected you automatically redirected to previous page.
    </Container>
  );

};

export default ReqWalletConnPage;
