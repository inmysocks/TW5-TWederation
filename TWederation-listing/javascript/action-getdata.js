/*\
title: $:/plugins/Federation/TWederation/action-requestdata.js
type: application/javascript
module-type: widget

Action widget to send an XMLhttprequest asking for data.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var RequestData = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RequestData.prototype = new Widget();

/*
Render this widget into the DOM
*/
RequestData.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
RequestData.prototype.execute = function() {
	this.sheetURL = this.getAttribute("$url");
	this.formTiddler = this.getAttribute("$tiddler");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
RequestData.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"] || changedAttributes["$url"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
RequestData.prototype.invokeAction = function(triggeringWidget,event) {

	//So what we do is we make a generic widget like this and have a set of worker functions in other tiddlers then when we call this widget we pick which worker we want and give in the needed inputs.
	//This way we can have a worker type for fetching plugins, worker types for fetchign different bundles in twederation things and so on.
	//We could even make it more generic and let the widget spawn other types of workers. Like use this to make timers and things for the wiki.


	//this is a cheap way to make the worker
	//I could load this from another file, that may be a better option.
	//var workerFunction = "onmessage = function(e) {var url = e.data.url;var formRequest = new XMLHttpRequest();formRequest.onreadystatechange = function() {if (formRequest.readyState == XMLHttpRequest.DONE) {self.postMessage(formRequest.responseText);self.close();}};	formRequest.open('GET', url);formRequest.send( null );}";
	// var workerBlob = new Blob([workerFunction],{type: "text/javascript"});

	//This is the other way to make it. Possibly a better way. Put the code
	//in another tiddler and put that tiddlers name here.
	//One problem is that this is a way to run arbitrary javascript on your wiki. I need to figure out if I can restrict things like how javascript macros are done.
	var tiddler = this.wiki.getTiddler('$:/plugins/Federation/TWederation/XMLHttpRequestWorker');
	var workerBlob = new Blob([tiddler.getFieldString('text')],{type: "text/javascript"});

	var myWorker = new Worker(URL.createObjectURL(workerBlob));
	var message = {
		url: this.sheetURL
	};
	myWorker.onmessage = this.displayResult;
	myWorker.postMessage(message);

	return true; // Action was invoked
};

RequestData.prototype.displayResult = function(event) {
	//Put whatever things you have to handle the returned data here.
	//console.log(event);
	//console.log(JSON.parse(event.data));
	var responseData = JSON.parse(event.data);
	var row;
	var username;
	var wikiname;
	var wikiurl;
	for (row in responseData.feed.entry) {
		username = responseData.feed.entry[row]['gsx$username']['$t']
		wikiname = responseData.feed.entry[row]['gsx$wikiname']['$t']
		wikiurl = responseData.feed.entry[row]['gsx$wikiurl']['$t']
		var creationFields = $tw.wiki.getCreationFields();
		var tiddlerFields = {'title':'New Card - ' + wikiname + ' - ' + wikiurl, 'text':'', 'author':username, 'name':wikiname, 'wiki_url':wikiurl, 'role':'Wiki twCard Listing'};
		if(!$tw.wiki.getTiddler('$:/twCard/' + wikiname + ' - ' + wikiurl)) {
			$tw.wiki.addTiddler(new $tw.Tiddler(creationFields, tiddlerFields));
		}
	}
}

exports["action-requestdata"] = RequestData;

})();
