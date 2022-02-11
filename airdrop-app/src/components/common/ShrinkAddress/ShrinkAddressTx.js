import React from "react";
import {makeStyles, useTheme} from "@material-ui/core";
import { networkName } from '../../wallet/walletUtils';

const useStyles = makeStyles((theme) => ({
    link: {
        textDecoration: "none !important",
        color: theme.palette.text.secondary + " !important"
    }
}));

const ShrinkAddressTx = ({tx}) => {
    const classes = useStyles();

    let visibleAddress = tx;
    if(tx.length >= 20) {
      const shrinkLength = 10;
      visibleAddress = tx.substring(0, shrinkLength) + '...' + tx.substring(tx.length - shrinkLength);
    }

    return (
        <a href={'https://' + networkName + '.etherscan.io/tx/' + tx} target={"_blank"}
           className={classes.link}
        >{visibleAddress}</a>
    );
}

export default ShrinkAddressTx;
