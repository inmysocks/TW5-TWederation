/*\
title: $:/plugins/inmysocks/FetchTiddlers/bundleOptions.js
type: application/javascript
module-type: utils

These are functions that define how tiddlers are bundled when a tiddler bundle is requested. 
bundleTiddlers is the default one. The function should create the Bundle object which is added as a tiddler in the receiving wiki.

If you want to add more options without chaing this you can create a new tiddler, just copy this one, change the title, the title listed in the first line at the top and replace 
the function bundleTiddlers with your function. This way we can have multiple plugins use the same communication mechanism without all having to modify the smae tiddlers to work.

You can use this as a function template:

For new ones just use $tw.wiki.functionName = function (event) {
	<<function Content>>
	event.source.postMessage({verb:"DELIVER_BUNDLE", bundle: Bundle, origin: event.data.destination},"*");
}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "bundleOptions";
exports.platforms = ["browser"];
exports.before = ["browser-messaging"];
exports.synchronous = true;

$tw.wiki.bundleHandler = $tw.wiki.bundleHandler || {};
$tw.wiki.bundleFunction = $tw.wiki.bundleFunction || {};

$tw.wiki.bundleHandler.full = function(event) {
	$tw.wiki.addTiddler(new $tw.Tiddler(event.data.bundle));
};

$tw.wiki.bundleHandler.shortMessages = function(event) {
  var messagesObject;
  var i;
	var name = '$:/Messages/' + event.data.sender;
	var messagesTiddler = $tw.wiki.getTiddler(name);
	if (messagesTiddler) {
		messagesObject = JSON.parse(messagesTiddler.fields.text);
	} else {
		messagesObject = {};
	}
	var messageThing = JSON.parse(event.data.bundle.text);
	for (i in messageThing) {
		messagesObject[i] = messageThing[i];
	}
	event.data.bundle.text = JSON.stringify(messagesObject);
	$tw.wiki.addTiddler(new $tw.Tiddler(event.data.bundle));
};

$tw.wiki.bundleFunction.fetchShortMessages = function(event, status_message) {
	var status = status_message || '';
	var separator = event.data.separator ? event.data.separator:'thisisthetiddlerdivisionstringwhywouldyouevenhavethisinyourtiddlerseriouslywhythisisjustridiculuous';
	var messageTiddlerTitle = '$:/Messages/' + event.data.sender;
	var messageTiddler = $tw.wiki.getTiddler(messageTiddlerTitle);
	var bundleTitle = 'MessageBundle';
	var Bundle = {title: bundleTitle, text: messageTiddler.fields.text, list: '', tags: '[[Tiddler Bundle]]', separator: separator, type: 'application/json', status: status};
	event.source.postMessage({verb:"DELIVER_BUNDLE", bundle: Bundle, origin: event.data.destination, type: 'shortMessages', sender: event.data.sender, recipient: event.data.recipient},"*");
};

$tw.wiki.bundleFunction.bundleTiddlers = function(event, status_message) {
	var status = status_message || '';
	var separator = event.data.separator ? event.data.separator:'thisisthetiddlerdivisionstringwhywouldyouevenhavethisinyourtiddlerseriouslywhythisisjustridiculuous';
  var bundleFilter = event.data.filter ? event.data.filter : '[is[system]!is[system]]';
	var bundleTitle = event.data.bundlename ? event.data.bundlename:"Default Bundle";
	var bundleTiddlers = $tw.wiki.filterTiddlers(bundleFilter);
	for (var i = 0; i < bundleTiddlers.length; i++) {
		bundleTiddlers[i] = decodeURI(bundleTiddlers[i]);
	}
	var bundleText = '';
	for (i = 0; i < bundleTiddlers.length; i++) {
		var currentBundleTiddler = $tw.wiki.getTiddler(decodeURI(bundleTiddlers[i]));
	    if (currentBundleTiddler) {
			bundleText += 'title:' + currentBundleTiddler.fields.title + '\n';
			var fieldTitle;
			for (fieldTitle in currentBundleTiddler.fields) {
				if (fieldTitle !== 'title' && fieldTitle !== 'text') {
					bundleText += fieldTitle + ':' + currentBundleTiddler.fields[fieldTitle] + '\n';
				}
			}
			bundleText += 'text:' + currentBundleTiddler.fields.text + '\n' + separator;
	    }
	}
	var Bundle = {title: bundleTitle, text: bundleText, list: $tw.utils.stringifyList(bundleTiddlers), tags: '[[Tiddler Bundle]]', separator: separator, type: 'text/plain', status: status};
	event.source.postMessage({verb:"DELIVER_BUNDLE", bundle: Bundle, origin: event.data.destination, type: 'full'},"*");
};

$tw.wiki.bundleFunction.tiddlerSummary = function(event, status_message) {
	var status = status_message || '';
	var separator = event.data.separator ? event.data.separator:'thisisthetiddlerdivisionstringwhywouldyouevenhavethisinyourtiddlerseriouslywhythisisjustridiculuous';
  var bundleFilter = event.data.filter ? event.data.filter : '[is[system]!is[system]]';
	var bundleTitle = event.data.bundlename ? event.data.bundlename:"Summary Bundle";
	var bundleTiddlers = $tw.wiki.filterTiddlers(bundleFilter);
	for (var i = 0; i < bundleTiddlers.length; i++) {
		bundleTiddlers[i] = decodeURI(bundleTiddlers[i]);
	}
	var bundleText = '';
	for (i = 0; i < bundleTiddlers.length; i++) {
		var currentBundleTiddler = $tw.wiki.getTiddler(decodeURI(bundleTiddlers[i]));
	    if (currentBundleTiddler) {
			bundleText += 'title:' + currentBundleTiddler.fields.title + '\n';
			var fieldTitle;
			for (fieldTitle in currentBundleTiddler.fields) {
				if (fieldTitle !== 'title' && fieldTitle !== 'text') {
					bundleText += fieldTitle + ':' + currentBundleTiddler.fields[fieldTitle] + '\n';
				}
			}
			bundleText += '\n\n';
	    }
	}
	var Bundle = {title: bundleTitle, text: bundleText, list: $tw.utils.stringifyList(bundleTiddlers), tags: '[[Bundle Summary]]', separator: separator, type: 'text/plain', status: status};
	event.source.postMessage({verb:"DELIVER_BUNDLE", bundle: Bundle, origin: event.data.destination, type: 'summary'},"*");

};

})();