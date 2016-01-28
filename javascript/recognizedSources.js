/*\
title: $:/plugins/inmysocks/FetchTiddlers/recognizedSources.js
type: application/javascript
module-type: utils

This is for listing your recognized tiddler sources. You can list sources in the tiddler $:/plugins/inmysocks/FetchTiddlers/RecognizedSourcesList

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "bundleOptions";
exports.platforms = ["browser"];
exports.before = ["browser-messaging"];
exports.synchronous = true;

$tw.wiki.recognizedSources = $tw.wiki.recognizedSources || {};

$tw.wiki.recognizedSources['http://tiddlerbundletest.tiddlyspot.com'] = 'TRUE';

})();