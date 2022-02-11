import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { PATH_REQWALLETCONN } from '../../config/urlsConfig';
import { useLocation } from 'react-router';
import { useWallet } from 'use-wallet';

const PrivateRoute = () => {
  let location = useLocation();

  const connected = useWallet().isConnected();

  return connected ? <Outlet/> : <Navigate to={PATH_REQWALLETCONN} state={{ from: location.pathname }}/>;
};

export default PrivateRoute;
