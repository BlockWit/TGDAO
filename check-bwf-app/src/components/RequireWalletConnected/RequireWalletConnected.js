import React from "react";
import {Navigate} from "react-router-dom";
import {useWallet} from "@solana/wallet-adapter-react";
import {PATH_REQWALLETCONN} from "../../config/urlsConfig";
import {useLocation} from "react-router";

const RequireWalletConnected = ({children}) => {

    let location = useLocation();
    const wallet = useWallet();
    const connected = wallet && wallet.connected;

    return connected ? children : <Navigate to={{pathname: PATH_REQWALLETCONN, state: {from: location}}}/>;

}

export default RequireWalletConnected;