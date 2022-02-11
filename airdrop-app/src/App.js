import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Container, createTheme, makeStyles, MuiThemeProvider } from '@material-ui/core';
import HomePage from './components/pages/home/HomePage';
import { PATH_AIRDROP, PATH_REQWALLETCONN, PATH_ROOT } from './config/urlsConfig';
import Navbar from './components/Navbar/Navbar';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import ReqWalletConnPage from './components/pages/reqwalletconn/ReqWalletConnPage';
import { UseWalletProvider } from 'use-wallet';
import AirDropPage from './components/pages/airdrop/AirDropPage';

const frontTheme = createTheme({});

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: '100px'
  },
}));

const App = () => {
  const classes = useStyles();

  return (<UseWalletProvider chainId={1}
                             connectors={{
                               // This is how connectors get configured
                               portis: { dAppId: 'my-dapp-id-123-xyz' },
                             }}>
    <MuiThemeProvider theme={frontTheme}>
      <Navbar/>
      <Container className={classes.container}>
        <Routes>
          <Route exact path={PATH_ROOT} element={<HomePage/>}/>
          <Route exact path={PATH_REQWALLETCONN} element={<ReqWalletConnPage/>}/>
          <Route exact path={PATH_AIRDROP} element={<PrivateRoute/>}>
            <Route exact path={PATH_AIRDROP} element={<AirDropPage/>}/>
          </Route>
        </Routes>
      </Container>
    </MuiThemeProvider>
  </UseWalletProvider>);

};

export default App;
