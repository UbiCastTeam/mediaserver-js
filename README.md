mediaserver-js
==============

This project contains some JavaScript modules for UbiCast MediaServer.

Dependencies:
-------------

* jquery
* utils.js (https://github.com/UbiCastTeam/utils-js.git)


Modules:
--------

* ms-api.js:

    A module to facilitate the use of MediaServer API.

* ms-tree.js:

    A module to display the MediaServer channels tree.

* ms-browser.js:

    A module to display the MediaServer content browser. `ms-api.js`, `ms-tree.js`, `utils.js` in the submodule and all files starting with `ms-browser` are required to use this module.

    Example of imports:
    ```html
    <link rel="stylesheet" type="text/css" href="dist/ms-js.min.css"/>
    <script type="text/javascript" src="utils-js/utils.js"></script>
    <script type="text/javascript" src="dist/ms-js.min.js"></script>
    ```
