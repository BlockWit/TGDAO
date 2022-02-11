import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import {Container} from "@material-ui/core";
import NavbarMenu from "./NavbarMenu/NavbarMenu";
import {NavLink} from "react-router-dom";
import {PATH_ROOT} from "../../config/urlsConfig";

const useStyles = makeStyles((theme) => ({
    appBar: {
        background: 'white',
        color: "gray"
    },
    appBarLogo: {
        height: '45px',
        marginLeft: '10px',
        marginRight: '20px'
    }
}));

const Navbar = () => {
    const classes = useStyles();

    return (
        <AppBar position="fixed" className={classes.appBar} elevation={3}>
            <Container>
                <Toolbar>
                    <NavLink to={PATH_ROOT}>
                        <img src='/logo_dark.png' alt='BlockWit' className={classes.appBarLogo}/>
                    </NavLink>
                    <NavbarMenu/>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default Navbar;