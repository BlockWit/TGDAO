import React from "react";
import {CircularProgress} from "@material-ui/core";
import styles from './Loading.module.css';

const Loading = () => {
	return (
		<div className={styles.loading}>
			<CircularProgress/>
		</div>
	)
}

export default Loading;