mediaserver-js
==============

This project contains some JavaScript modules for UbiCast MediaServer.

Modules:

* ms-api.js:

	A module to facilitate the use of MediaServer API.

* ms-tree.js:

	A module to display the MediaServer channels tree.

* ms-browser.js:

	A module to display the MediaServer content browser. `ms-api.js`, `utils.js` in the submodule and all files starting with `ms-browser` are required to use this module.

   	Example of imports:
    ```javascript
	require('./utils.js');
	require('./ms-api.js');
	require('./ms-browser.js');
	require('./ms-browser-display.js');
	require('./ms-browser-search.js');
	require('./ms-browser-latest.js');
	require('./ms-browser-channels.js');
	require('./ms-trans-fr.js'); // optional for french traductions
    ```
    or
    ```html
	<script type="text/javascript" src="utils.js"></script>
	<script type="text/javascript" src="ms-api.js"></script>
	<script type="text/javascript" src="ms-browser.js"></script>
	<script type="text/javascript" src="ms-browser-display.js"></script>
	<script type="text/javascript" src="ms-browser-search.js"></script>
	<script type="text/javascript" src="ms-browser-latest.js"></script>
	<script type="text/javascript" src="ms-browser-channels.js"></script>
	<script type="text/javascript" src="ms-trans-fr.js"></script>
    ```
