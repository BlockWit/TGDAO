import React, { useEffect, useRef, useState } from 'react';
import { Container, Grid, makeStyles, Typography } from '@material-ui/core';
import DataListView from '../../DataListView/DataListView';
import ShrinkAddress from '../../common/ShrinkAddress/ShrinkAddress';
import ShrinkAddressTx from '../../common/ShrinkAddress/ShrinkAddressTx';
import Loading from '../../common/Loading/Loading';
import { Check, Error } from '@material-ui/icons';
import { airdropMultipleWithPredefinedToken } from '../../wallet/airDropContract';

let lock = false;

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
  web3Provider,
  airDrops
}) => {
  const classes = useStyles();

  const [state, setState] = useState({
    txs: [],
    bucketsSent: false,
    buckets: null
  });

  useInterval(() => {
    if (state.bucketsSent == true) {
      let processingTx = null;
      for (let i = 0; i < state.txs.length; i++) {
        if (state.txs[i].txState === 'processing') {
          processingTx = i;
          break;
        }
      }

      if (processingTx != null) {
        web3Provider.getTransactionReceipt(state.txs[processingTx].tx.hash).then(txReceipt => {
          if (txReceipt != null) {
            console.log('tx receipt ', txReceipt);
            if (txReceipt.status === 1) {
              const newTxs = [...state.txs];
              newTxs[processingTx] = {
                ...newTxs[processingTx],
                txState: 'finished'
              };
              setState({
                ...state,
                txs: newTxs
              });
            } else {
              const newTxs = [...state.txs];
              newTxs[processingTx] = {
                ...newTxs[processingTx],
                txState: 'failed'
              };
              setState({
                ...state,
                txs: newTxs
              });
            }
          }
        });
      }
    }
  }, 10000);

  useEffect(() => {
    if (state.bucketsSent === false) {
      if (state.buckets != null) {
        Promise.all(state.buckets.map((bucket) => {
          console.log('bucket : item');
          return airdropMultipleWithPredefinedToken(web3Provider, bucket.map(t => t.address), bucket.map(t => t.balance)).then(tx => {
            return {
              tx: tx,
              txState: 'processing',
              accounts: bucket.map(t => t.address)
            };
          });
        })).then(txs => {
          console.log('Set state ', true);
          setState({
            ...state,
            txs: txs,
            bucketsSent: true
          });
        });
      }
    }
  }, [state.bucketsSent, state.buckets]);

  console.log('BS ', state.bucketsSent);
  if (state.bucketsSent === false) {
    if (state.buckets == null) {
      const buckets = [];
      let bucket = [];
      for (let i = 0; i < airDrops.length; i++) {
        bucket.push(airDrops[i]);
        if (bucket.length >= 200) {
          buckets.push(bucket);
          bucket = [];
        }
      }
      if (bucket.length > 0) {
        buckets.push(bucket);
      }

      if (buckets.length > 0) {
        setState({
          ...state,
          buckets: buckets
        });
      }
    } else {
      // console.log('HERES!');
      // return (
      //   <Container className={classes.container} maxWidth={'lg'}>
      //     <Typography variant={'h4'}>Approving</Typography>
      //   </Container>
      // );
    }
  }

  const options = {
    custom: {
      id: {
        title: 'Id',
        styles: {
          width: '20px',
          justifyContent: 'flex-end'
        }
      },
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
      txStatus: {
        title: 'Status',
        styles: {
          width: '20px',
          justifyContent: 'flex-end'
        },
        customWrapper: (value, item) => {
          if (item.txStatus === 'unknown') {
            return <></>;
          } else if (item.txStatus === 'processing') {
            return <Loading/>;
          } else if (item.txStatus === 'finished') {
            return <Check/>;
          } else if (item.txStatus === 'failed') {
            return <Error/>;
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
          return <ShrinkAddressTx tx={item.tx.hash}/>;
        }
      }
    }
  };

  const airDropsTxs = [];
  for (let i = 0; i < airDrops.length; i++) {
    let foundAccount = false;
    let tx = null;
    for (let j = 0; j < state.txs.length; j++) {
      for (let k = 0; k < state.txs[j].accounts.length; k++) {
        const curAccount = state.txs[j].accounts[k];
        if (curAccount === airDrops[i].address) {
          tx = state.txs[j];
          foundAccount = true;
          break;
        }
      }
    }
    if (foundAccount) {
      airDropsTxs.push({
        id: i + 1,
        account: airDrops[i].address,
        balance: airDrops[i].balance,
        txStatus: tx.txState,
        tx: tx.tx
      });
    } else {
      airDropsTxs.push({
        id: i + 1,
        account: airDrops[i].address,
        balance: airDrops[i].balance,
        txStatus: 'unknown',
        tx: null
      });
    }
  }
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
