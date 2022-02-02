import React from "react";
import NavbarMenuItem from "./NavbarMenuItem/NavbarMenuItem";
import {Box} from "@material-ui/core";
import {Apps} from "@material-ui/icons";
import {PATH_DEPOSIT, PATH_LISTENER, PATH_WITHDRAW} from "../../../config/urlsConfig";
import WalletNavbarMenuItem from "./WalletNavbarMenuItem/WalletNavbarMenuItem";

const NavbarMenu = () => {
    return (
        <>
            <Box display='flex' flexGrow={1}>
                <NavbarMenuItem to={PATH_DEPOSIT} name='deposit' icon={<Apps/>} auth={true}/>
                <NavbarMenuItem to={PATH_WITHDRAW} name='withdraw' icon={<Apps/>} auth={true}/>
                <NavbarMenuItem to={PATH_LISTENER} name='listener' icon={<Apps/>} auth={true}/>
            </Box>
            <WalletNavbarMenuItem/>
        </>
    );
}

export default NavbarMenu;