/*\
title: $:/plugins/TWederation/macros/timestamp.js
type: application/javascript
module-type: macro

Macro to return a timestamp in the format tiddlywiki uses internally

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "timestamp";

exports.params = [
	{name: "format"}
];

/*
Run the macro
*/
exports.run = function(format) {
	return $tw.utils.stringifyDate(new Date());
};

})();
