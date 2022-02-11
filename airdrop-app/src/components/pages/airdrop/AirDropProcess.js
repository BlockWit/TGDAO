import React, { useEffect, useRef, useState } from 'react';
import { Container, Grid, makeStyles, Typography } from '@material-ui/core';
import DataListView from '../../DataListView/DataListView';
import ShrinkAddress from '../../common/ShrinkAddress/ShrinkAddress';
import ShrinkAddressTx from '../../common/ShrinkAddress/ShrinkAddressTx';
import { Check } from '@material-ui/icons';

function useInterval (callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick () {
      savedCallback.current();
    }

    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

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

const AirDropProcess = ({
  wallet,
  web3Provider,
  account,
  airDrops
}) => {
  const classes = useStyles();

  const airDropsTxs = airDrops.map(airDropAcc => {
    return {
      account: airDropAcc.address,
      balance: airDropAcc.balance,
      withdrawed: false,
      tx: null
    };
  });

  const [state, setState] = useState({
    txs: [],
  });

  const divider = 100;

  useInterval(() => {

    const iterations = [];
    for (let i = 0; i < airDrops.length; i++) {
      if(airDrops[i].tx === null) {

      }
    }

    // Your custom logic here
    console.log('Interval call');
  }, 1000);

  const options = {
    custom: {
      account: {
        title: 'Account',
        styles: {
          width: '380px',
          justifyContent: 'flex-end'
        },
        customWrapper: (value, item) => {
          return <ShrinkAddress address={item.account} shrink={false}/>;
        }
      },
      balance: {
        title: 'Tokens',
        styles: {
          width: '200px',
          justifyContent: 'flex-end'
        },
        customWrapper: (value, item) => {
          return item.balance.toString();
        }
      },
      withdrawed: {
        title: 'Sent',
        styles: {
          width: '20px',
          justifyContent: 'flex-end'
        },
        customWrapper: (value, item) => {
          if (item.withdrawed) {
            return <Check/>;
          }
          return <></>;
        }
      },
      tx: {
        title: 'Tx',
        styles: {
          width: '200px',
          justifyContent: 'flex-end'
        },
        customWrapper: (value, item) => {
          if (item.tx === null) {
            return <></>;
          }
          return <ShrinkAddressTx tx={item.tx}/>;
        }
      }
    }
  };

  return (
    <Container className={classes.container} maxWidth={'lg'}>
      <Typography variant={'h4'}>AirDrop process</Typography>
      <Grid container spacing={3}>
        <Grid item lg={12}>
          <DataListView items={airDropsTxs} options={options}/>
        </Grid>
      </Grid>
    </Container>
  );

};

export default AirDropProcess;
