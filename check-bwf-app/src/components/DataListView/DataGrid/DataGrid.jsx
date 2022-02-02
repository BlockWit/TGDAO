import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import exists from '../../../utils/exist';
import notExists from '../../../utils/notExist';

const useStyles = makeStyles((theme) => ({
  dataContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  dataContainerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #e0e0e0'
  },
  dataContainerRowBody: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#f3f3f3'
    }
  },
  dataContainerRowBodyLast: {
    borderBottom: 'none'
  },
  dataContainerRowHeader: {
    fontWeight: 'bold'
  },
  dataContainerCell: {
    alignItems: 'center',
    display: 'flex'
  }
}));

const TRIM_THRESHOLD = 100;

const getCustom = (options, name) => {
  if (exists(options)) {
    const custom = options.custom;
    if (exists(custom)) {
      return custom[name];
    }
  }
};

const getCustomStylesFromCustom = fieldOptions => {
  if (exists(fieldOptions)) {
    return fieldOptions.styles;
  }
};

const getCustomHeaderStylesFromCustom = fieldOptions => {
  if (exists(fieldOptions)) {
    return fieldOptions.titleStyles;
  }
};

const getCustomBodyStylesFromCustom = fieldOptions => {
  if (exists(fieldOptions)) {
    return fieldOptions.bodyStyles;
  }
};

const trimValue = (fieldOptions, value) => {
  if (notExists(value) || value.length === 0) {
    return value;
  }

  let actualTrimCount = TRIM_THRESHOLD;

  if (exists(fieldOptions)) {
    const trimSymbolsCount = fieldOptions.trim;
    if (exists(trimSymbolsCount)) {
      if (trimSymbolsCount < actualTrimCount) {
        actualTrimCount = trimSymbolsCount;
      }
    }
  }

  if (value.length < actualTrimCount) {
    return value;
  }

  return value.substring(0, actualTrimCount) + '...';
};

const getCustomActions = fieldOptions => {
  if (exists(fieldOptions)) {
    return exists(fieldOptions.actions) ? fieldOptions.actions : {};
  }
};

const getCustomWrapper = fieldOptions => {
  if (exists(fieldOptions)) {
    return fieldOptions.customWrapper;
  }
};

const getCustomTitle = fieldOptions => {
  if (exists(fieldOptions)) {
    return fieldOptions.title;
  }
};

// const getCustomStyles = name => getCustomStylesFromCustom(getCustom(name))

const performWidth = length => ({ width: 100 / length + '%' });

const DataGrid = ({
  items,
  options
}) => {

  const classes = useStyles();

  const columnNames = Object.keys(items[0]);

  return (
    <>
      <div className={classes.dataContainer}>
        <div className={classes.dataContainerRow + '  ' + classes.dataContainerRowHeader}>
          {columnNames.map((colName, colNameIndex) => {

            const custom = getCustom(options, colName);
            const value = trimValue(custom, colName);
            const customStyle = getCustomStylesFromCustom(custom);
            const customTitle = getCustomTitle(custom);
            const customTitleStyle = getCustomHeaderStylesFromCustom(custom);

            return (
              <div className={classes.dataContainerCell}
                   style={{ ...(customStyle ? customStyle : performWidth(columnNames.length)), ...(customTitleStyle ? customTitleStyle : {}) }}
                   key={colNameIndex}>
                {customTitle ? customTitle : value}
              </div>
            );
          })}
        </div>
        {items.map((item, itemIndex) =>
          <div
            className={classes.dataContainerRow + '  ' + classes.dataContainerRowBody + ' ' + (items.length === (itemIndex + 1) ? classes.dataContainerRowBodyLast : '')}
            key={itemIndex}>
            {Object.entries(item).map(([colName, colValue], index) => {

              const custom = getCustom(options, colName);
              const colValueString = typeof colValue == 'boolean' ? colValue.toString() : (colValue ? colValue.toString() : '');
              const value = trimValue(custom, colValueString);
              const customStyle = getCustomStylesFromCustom(custom);
              const customWrapper = getCustomWrapper(custom);
              const customActions = getCustomActions(custom);
              const customBodyStyle = getCustomBodyStylesFromCustom(custom);

              if (exists(customActions) && exists(customActions.onClick)) {
                return <div
                  className={classes.dataContainerCell}
                  style={{ ...(customStyle ? customStyle : performWidth(columnNames.length)), ...(customBodyStyle ? customBodyStyle : {}) }}
                  key={colName}
                  onClick={e => customActions.onClick(item, e)}
                >
                  {exists(customWrapper) ? customWrapper(value, item) : value}
                </div>;
              } else {
                return <div
                  className={classes.dataContainerCell}
                  style={{ ...(customStyle ? customStyle : performWidth(columnNames.length)), ...(customBodyStyle ? customBodyStyle : {}) }}
                  key={colName}
                >
                  {exists(customWrapper) ? customWrapper(value, item) : value}
                </div>;
              }

            })}
          </div>
        )}
      </div>
    </>
  );

}

export default DataGrid;
