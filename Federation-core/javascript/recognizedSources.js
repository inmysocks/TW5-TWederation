/*\
title: $:/plugins/Federation/Federation-core/recognizedSources.js
type: application/javascript
module-type: utils

This is for listing your recognized tiddler sources. You can list sources in the tiddler $:/plugins/Federation/Federation-core/RecognizedSourcesList

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

var recognizedSourcesList = $tw.wiki.getTiddler('$:/Settings/Federation/RecognizedSources');

for (var i = 0; i < Object.keys(recognizedSourcesList).length; i++) {
    $tw.wiki.recognizedSources[recognizedSourcesList[i]] = 'TRUE';
}

})();
