import React from "react";
import ReactDOM from "react-dom";
import CssBaseline from "@mui/material/CssBaseline";
import * as serviceworker from './serviceWorker'

import App from "./App";

ReactDOM.render(
	<CssBaseline>
		<App />
	</CssBaseline>,
	document.getElementById("root"),
	() => {
		window.finishProgress();
	}
);

serviceworker.register()