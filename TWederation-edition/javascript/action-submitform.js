/*\
title: $:/plugins/inmysocks/TWederation/action-submitform.js
type: application/javascript
module-type: widget

Action widget to send an XMLhttprequest with form data.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SubmitForm = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SubmitForm.prototype = new Widget();

/*
Render this widget into the DOM
*/
SubmitForm.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
SubmitForm.prototype.execute = function() {
	this.formURL = this.getAttribute("$url");
	this.formTiddler = this.getAttribute("$tiddler");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SubmitForm.prototype.refresh = function(changedTiddlers) {
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
SubmitForm.prototype.invokeAction = function(triggeringWidget,event) {

	var data = '';
	var tiddler = this.wiki.getTiddler(this.formTiddler);
	var parsedTiddler = JSON.parse(tiddler.fields.text);
	for (var field in parsedTiddler) {
		console.log(parsedTiddler[field]);
		data += encodeURIComponent(field) + '=' + encodeURIComponent($tw.wiki.getTextReference(parsedTiddler[field])) + '&';
	}
	console.log(data);
	console.log(data.substr(0, data.length-1));

	var formRequest = new XMLHttpRequest();
	formRequest.open('POST', this.formURL, true);
	formRequest.setRequestHeader('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
	formRequest.send(data.substr(0, data.length-1));

	return true; // Action was invoked
};

exports["action-submitform"] = SubmitForm;

})();
