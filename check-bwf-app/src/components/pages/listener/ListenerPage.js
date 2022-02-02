import React from 'react';
import { Container, makeStyles } from '@material-ui/core';

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

const ListenerPage = () => {

  const classes = useStyles();

  return (
    <Container className={classes.container}>
      <h2>Listener debug</h2>
    </Container>
  );

};

export default ListenerPage;
