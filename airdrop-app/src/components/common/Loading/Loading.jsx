import React from "react";
import {CircularProgress} from "@material-ui/core";
import styles from './Loading.module.css';

const Loading = () => {
	return (
		<div className={styles.loading}>
			<CircularProgress size='1.1rem'/>
		</div>
	)
}

export default Loading;
