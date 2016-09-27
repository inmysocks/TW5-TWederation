/*\
title: $:/plugins/Federation/Federation-core/bundleOptions.js
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
	var creationFields = $tw.wiki.getCreationFields();
	event.data.bundle.title = event.data.bundle.title + ' - ' + event.data.origin;
	$tw.wiki.addTiddler(new $tw.Tiddler(creationFields, event.data.bundle));
	var historyTiddler = $tw.wiki.getTiddler('$:/FetchHistory/' + event.data.origin);
	if (historyTiddler) {
		var newText = JSON.parse(historyTiddler.fields.text);
		newText[event.data.filter] = event.data.bundle.most_recent ? event.data.bundle.most_recent:'0';
	} else {
		var newText = {};
		newText[event.data.filter] = event.data.bundle.most_recent ? event.data.bundle.most_recent:'0';
		historyTiddler = {
			title: '$:/FetchHistory/' + event.data.origin,
			type: 'application/json',
			text: ''
		};
	}
	$tw.wiki.addTiddler(new $tw.Tiddler(historyTiddler, {text: JSON.stringify(newText)}));
};

$tw.wiki.bundleHandler.shortMessages = function(event) {
	var creationFields = $tw.wiki.getCreationFields();
	var messagesObject;
	var name = '$:/Messages/' + event.data.sender;
	var messagesTiddler = $tw.wiki.getTiddler(name);
	if (messagesTiddler) {
		messagesObject = JSON.parse(messagesTiddler.fields.text);
	} else {
		messagesObject = {};
	}
	var messageThing = JSON.parse(event.data.bundle.text);
	for (var i in messageThing) {
		messagesObject[i] = messageThing[i];
	}
	event.data.bundle.text = JSON.stringify(messagesObject);
	$tw.wiki.addTiddler(new $tw.Tiddler(creationFields, event.data.bundle));
};

$tw.wiki.bundleFunction.fetchShortMessages = function(event, status_message) {
	var status = status_message || '';
	var separator = event.data.separator ? event.data.separator:'thisisthetiddlerdivisionstringwhywouldyouevenhavethisinyourtiddlerseriouslywhythisisjustridiculuous';
	var messageTiddlerTitle = '$:/Messages/' + event.data.sender;
	var messageTiddler = $tw.wiki.getTiddler(messageTiddlerTitle);
	var currentTimeStamp = new Date();
	var messageSuffix = ' - (' + $tw.utils.pad(currentTimeStamp.getHours()) + ":" + $tw.utils.pad(currentTimeStamp.getMinutes()) + ":" + $tw.utils.pad(currentTimeStamp.getSeconds()) + '-' + $tw.utils.pad(currentTimeStamp.getDate()) + '/' + $tw.utils.pad(currentTimeStamp.getMonth()+1) + '/' + + currentTimeStamp.getFullYear() + ')';
	var bundleTitle = 'MessageBundle';
	bundleTitle += messageSuffix;
	var Bundle = {
		title: bundleTitle,
		text: messageTiddler.fields.text,
		list: '',
		tags: '[[Tiddler Bundle]]',
		separator: separator,
		type: 'application/json',
		status: status
	};
	var messageObject = {
		verb:"DELIVER_BUNDLE",
		bundle: Bundle,
		origin: event.data.destination,
		type: 'shortMessages',
		sender: event.data.sender,
		recipient: event.data.recipient
	};
	event.source.postMessage(messageObject,"*");
};

$tw.wiki.bundleFunction.bundleTiddlers = function(event, status_message) {
	var status = status_message || '';
	var mostRecent = new Date(0);
	var separator = event.data.separator ? event.data.separator:'thisisthetiddlerdivisionstringwhywouldyouevenhavethisinyourtiddlerseriouslywhythisisjustridiculuous';
	var bundleFilter = event.data.filter ? event.data.filter : '[is[system]!is[system]]';
	var previousTime = event.data.previousTime ? event.data.previousTime : new Date(0);
	var currentTimeStamp = new Date();
	var messagePrefix =
	currentTimeStamp.getFullYear() +
	$tw.utils.pad(currentTimeStamp.getMonth()+1) +
	$tw.utils.pad(currentTimeStamp.getDate()) +
	$tw.utils.pad(currentTimeStamp.getHours()) +  $tw.utils.pad(currentTimeStamp.getMinutes()) +  $tw.utils.pad(currentTimeStamp.getSeconds()) +
	' - ';
	var bundleBaseName = event.data.bundlename ? event.data.bundlename:"Default Bundle";
	var bundleTitle = event.data.bundlename ? event.data.bundlename:"Default Bundle";
	bundleTitle = messagePrefix + bundleTitle;
	var bundleList = [];
	var bundleTiddlers = $tw.wiki.filterTiddlers(bundleFilter);
	for (var i = 0; i < bundleTiddlers.length; i++) {
		bundleTiddlers[i] = decodeURI(bundleTiddlers[i]);
	}
	var bundleText = '';
	for (var i = 0; i < bundleTiddlers.length; i++) {
		var currentBundleTiddler = $tw.wiki.getTiddler(decodeURI(bundleTiddlers[i]));
	    if (currentBundleTiddler) {
			if (currentBundleTiddler.fields.created) {
				//If there is no previous time given assume that all tiddlers are new.
	    		var isNewTiddler = ($tw.utils.stringifyDate(currentBundleTiddler.fields.created) > previousTime) || ($tw.utils.stringifyDate(currentBundleTiddler.fields.modified) > previousTime) || (previousTime.trim() === '');
			} else {
				//Assume tiddler is new if it has no creation fields
				var isNewTiddler = true;
			}
	    	if (isNewTiddler) {
	    		bundleList.push(currentBundleTiddler.fields.title);
				bundleText += 'title:' + currentBundleTiddler.fields.title + '\n';
				if (currentBundleTiddler.fields.tags) {
					bundleText += 'tags:' + $tw.utils.stringifyList(currentBundleTiddler.fields.tags) + '\n';
					//bundleText += 'tags:' + $tw.utils.parseStringArray(currentBundleTiddler.fields.tags) + '\n';
				}
				if (currentBundleTiddler.fields.created) {
					bundleText += 'created:' + $tw.utils.stringifyDate(currentBundleTiddler.fields.created) + '\n';
					if (currentBundleTiddler.fields.created > mostRecent) {
						mostRecent = currentBundleTiddler.fields.created;
					}
				}
				if (currentBundleTiddler.fields.modified) {
					bundleText += 'modified:' + $tw.utils.stringifyDate(currentBundleTiddler.fields.modified) + '\n';
					if (currentBundleTiddler.fields.modified > mostRecent) {
						mostRecent = currentBundleTiddler.fields.modified;
					}
				}
				for (var fieldTitle in currentBundleTiddler.fields) {
					if (fieldTitle !== 'title' && fieldTitle !== 'text' && fieldTitle !== 'tags' && fieldTitle !== 'created' && fieldTitle !== 'modified') {
						bundleText += fieldTitle + ':' + currentBundleTiddler.fields[fieldTitle] + '\n';
					}
				}
				bundleText += 'text:' + currentBundleTiddler.fields.text + '\n' + separator + '\n';
			}
	    }
	}
	var Bundle = {
		title: bundleTitle,
		text: bundleText,
		list: $tw.utils.stringifyList(bundleList),
		tags: '[[Tiddler Bundle]]',
		separator: separator,
		type: 'text/plain',
		status: status,
		origin: event.data.destination,
		bundle_function: event.data.bundleFunction,
		unbundle_function: 'full',
		filter: bundleFilter,
		bundle_size: bundleTiddlers.length,
		bundle_name: bundleBaseName,
		most_recent: $tw.utils.stringifyDate(mostRecent)
	};
	var messageObject = {
		verb:"DELIVER_BUNDLE",
		bundle: Bundle,
		origin: event.data.destination,
		type: 'full',
		filter: bundleFilter
	};
	event.source.postMessage(messageObject,"*");
};

$tw.wiki.bundleFunction.tiddlerSummary = function(event, status_message) {
	var status = status_message || '';
	var separator = event.data.separator ? event.data.separator:'thisisthetiddlerdivisionstringwhywouldyouevenhavethisinyourtiddlerseriouslywhythisisjustridiculuous';
	var bundleFilter = event.data.filter ? event.data.filter : '[is[system]!is[system]]';
	var currentTimeStamp = new Date();
	var messageSuffix = ' - (' + currentTimeStamp.getHours() + ":" + currentTimeStamp.getMinutes() + ":" + currentTimeStamp.getSeconds() + currentTimeStamp.getDate() + '/' + (currentTimeStamp.getMonth()+1) + '/' + + currentTimeStamp.getFullYear() + ')';
	var bundleBaseName = event.data.bundlename ? event.data.bundlename:"Default Bundle";
	var bundleTitle = event.data.bundlename ? event.data.bundlename:"Summary Bundle";
	bundleTitle += messageSuffix;
	var bundleTiddlers = $tw.wiki.filterTiddlers(bundleFilter);
	for (var i = 0; i < bundleTiddlers.length; i++) {
		bundleTiddlers[i] = decodeURI(bundleTiddlers[i]);
	}
	var bundleText = '';
	for (i = 0; i < bundleTiddlers.length; i++) {
		var currentBundleTiddler = $tw.wiki.getTiddler(decodeURI(bundleTiddlers[i]));
	    if (currentBundleTiddler) {
			bundleText += 'title:' + currentBundleTiddler.fields.title + '\n';
			bundleText += 'tags:' + $tw.utils.parseStringArray(currentBundleTiddler.fields.tags) + '\n';
			if (currentBundleTiddler.fields.created) {
				bundleText += 'created:' + $tw.utils.stringifyDate(currentBundleTiddler.fields.created) + '\n';
			}
			if (currentBundleTiddler.fields.modified) {
				bundleText += 'modified:' + $tw.utils.stringifyDate(currentBundleTiddler.fields.modified) + '\n';
			}
			for (var fieldTitle in currentBundleTiddler.fields) {
				if (fieldTitle !== 'title' && fieldTitle !== 'text' && fieldTitle !== 'tags' && fieldTitle !== 'created' && fieldTitle !== 'modified') {
					bundleText += fieldTitle + ':' + currentBundleTiddler.fields[fieldTitle] + '\n';
				}
			}
			bundleText += '\n\n';
	    }
	}
	var Bundle = {
		title: bundleTitle,
		text: bundleText,
		list: $tw.utils.stringifyList(bundleTiddlers),
		tags: '[[Bundle Summary]]',
		separator: separator,
		type: 'text/plain',
		status: status,
		bundle_size: bundleTiddlers.length,
		bundle_name: bundleBaseName
	};
	var messageObject = {
		verb:"DELIVER_BUNDLE",
		bundle: Bundle,
		origin: event.data.destination,
		type: 'summary'
	};
	event.source.postMessage(messageObject,"*");

};

$tw.wiki.bundleFunction.JSONBundle = function(event, status_message) {
	var status = status_message || '';
	var separator = event.data.separator ? event.data.separator:'thisisthetiddlerdivisionstringwhywouldyouevenhavethisinyourtiddlerseriouslywhythisisjustridiculuous';
	var bundleFilter = event.data.filter ? event.data.filter : '[is[system]!is[system]]';
	var previousTime = event.data.previousTime ? event.data.previousTime : '0';
	var currentTimeStamp = new Date();
	var messageSuffix = ' - (' + $tw.utils.pad(currentTimeStamp.getHours()) + ":" + $tw.utils.pad(currentTimeStamp.getMinutes()) + ":" + $tw.utils.pad(currentTimeStamp.getSeconds()) + $tw.utils.pad(currentTimeStamp.getDate()) + '/' + $tw.utils.pad(currentTimeStamp.getMonth()+1) + '/' + + currentTimeStamp.getFullYear() + ')';
	var bundleBaseName = event.data.bundlename ? event.data.bundlename:"Default Bundle";
	var bundleTitle = event.data.bundlename ? event.data.bundlename:"JSON Bundle";
	bundleTitle += messageSuffix;
	var bundleList = [];
	var bundleTiddlers = $tw.wiki.filterTiddlers(bundleFilter);
	for (var i = 0; i < bundleTiddlers.length; i++) {
		bundleTiddlers[i] = decodeURI(bundleTiddlers[i]);
	}
	var bundleObject = {};
	for (i = 0; i < bundleTiddlers.length; i++) {
		bundleObject[bundleTiddlers[i]] = $tw.wiki.getTiddler(decodeURI(bundleTiddlers[i]));
	};
	var Bundle = {
		title: bundleTitle,
		text: JSON.stringify(bundleObject),
		list: $tw.utils.stringifyList(bundleTiddlers),
		tags: '[[JSON Bundle]]',
		separator: separator,
		type: 'text/plain',
		status: status,
		bundle_size: bundleTiddlers.length,
		bundle_name: bundleBaseName
	};
	var messageObject = {
		verb:"DELIVER_BUNDLE",
		bundle: Bundle,
		origin: event.data.destination,
		type: 'JSON Bundle'
	};
	event.source.postMessage(messageObject,"*");
};

})();
