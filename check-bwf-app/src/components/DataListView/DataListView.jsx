import React from 'react';
import { Grid } from '@material-ui/core';
import arrayEmpty from '../../utils/arrayEmpty';
import DataGrid from './DataGrid/DataGrid';

const DataListView = ({
  items,
  options
}) => {

  if (arrayEmpty(items)) {
    return <></>;
  }

  return (
    <>
      <Grid container item xs={12}>
        <DataGrid items={items} options={options}/>
      </Grid>
    </>
  );

};

export default DataListView;
