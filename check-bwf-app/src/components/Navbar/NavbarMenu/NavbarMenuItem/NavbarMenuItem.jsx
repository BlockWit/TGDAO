import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconButton, makeStyles, Typography } from '@material-ui/core';
import { useWallet } from 'use-wallet';

const useStyles = makeStyles((theme) => ({
  activeIconButton: {
    color: 'black',
  },
  inactiveIconButton: {},
}));

const NavbarMenuItem = ({
  auth = null,
  to,
  name,
  icon
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const active = location.pathname === to;

  const walletConnected = useWallet().isConnected();

  if ((auth === true && !walletConnected) || (auth === false && walletConnected)) {
    return <></>;
  }

  return (
    <IconButton color="inherit"
                className={active ? classes.activeIconButton : classes.inactiveIconButton}
                onClick={() => navigate(to)}
    >
      {icon}
      {name && <Typography variant="h6">{name}</Typography>}
    </IconButton>
  );

};
export default NavbarMenuItem;
