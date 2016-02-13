/*\
title: $:/plugins/inmysocks/TWederation/action-tiddlerbundle.js
type: application/javascript
module-type: widget

Action widget that edits lists in any field similarly to how the tags field works.

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ActionTiddlerBundle = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ActionTiddlerBundle.prototype = new Widget();

/*
Render this widget into the DOM
*/
ActionTiddlerBundle.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ActionTiddlerBundle.prototype.execute = function() {
	this.actionBundle = this.getAttribute("$bundle");
	this.bundleFilter = this.getAttribute("$filter");
	this.actionOverwrite = this.getAttribute("$overwrite", false);
	this.actionSeparator = this.getAttribute("$separator");
	this.actionAction = this.getAttribute("$action");
	this.unpackFilter = this.getAttribute("$unpackFilter");
	this.bundleType = this.getAttribute("$type");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ActionTiddlerBundle.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$item"] || changedAttributes["$bundle"] || changedAttributes["$overwrite"] || changedAttributes['$separator'] || changedAttributes['$action']) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ActionTiddlerBundle.prototype.invokeAction = function(triggeringWidget,event) {
	var separator;
	if (this.actionSeparator) {
		separator = this.actionSeparator;
	} else {
		separator = 'thisisthetiddlerdivisionstringwhywouldyouevenhavethisinyourtiddlerseriouslywhythisisjustridiculuous';
	}
	
	if (this.actionAction === 'pack') {
		var bundleType = this.bundleType ? this.bundleType:'Tiddler';
		var urlBundleDefinition = $tw.utils.getLocationHash();
		var action = urlBundleDefinition.split(':',1);
		if (action[0] === '#bundle') {
			var bundleFilter = urlBundleDefinition.slice(urlBundleDefinition.indexOf(':')+1);
			var bundleTiddlers = this.wiki.filterTiddlers(bundleFilter);
			for (var i = 0; i < bundleTiddlers.length; i++) {
				bundleTiddlers[i] = decodeURI(bundleTiddlers[i]);
			}
		} else {
			var bundleFilter = this.bundleFilter;
			var bundleTiddlers = this.wiki.filterTiddlers(bundleFilter);
		}
		var bundleText = '';
		var bundleObject = {};
		for (var i = 0; i < bundleTiddlers.length; i++) {
			if (this.bundleType === "JSON") {
				var currentBundleTiddler = this.wiki.getTiddler(decodeURI(bundleTiddlers[i]));
				bundleObject[bundleTiddlers[i]] = currentBundleTiddler;
			} else {
				var currentBundleTiddler = this.wiki.getTiddler(decodeURI(bundleTiddlers[i]));
				bundleText += 'title:' + currentBundleTiddler.fields.title + '\n';
				bundleText += 'tags:' + $tw.utils.stringifyList(currentBundleTiddler.fields.tags) + '\n';
				var fieldTitle;
				for (fieldTitle in currentBundleTiddler.fields) {
					if (fieldTitle !== 'title' && fieldTitle !== 'text' && fieldTitle !== 'tags') {
						bundleText += fieldTitle + ':' + currentBundleTiddler.fields[fieldTitle] + '\n';
					}
				}
				bundleText += 'text:' + currentBundleTiddler.fields['text'] + '\n' + separator;
			}
		}
		if (this.bundleType === "JSON") {
			bundleText = JSON.stringify(bundleObject);
		}
		$tw.wiki.setText(this.actionBundle, 'list', undefined, $tw.utils.stringifyList(bundleTiddlers));
		$tw.wiki.setText(this.actionBundle, 'tags', undefined, '[[Tiddler Bundle]]');
		$tw.wiki.setText(this.actionBundle, 'text', undefined, bundleText);
		$tw.wiki.setText(this.actionBundle, 'separator', undefined, separator);
		$tw.wiki.setText(this.actionBundle, 'bundle_type', undefined, bundleType);
	}


	if (this.actionAction === 'unpack') {
		var filterOutput = this.unpackFilter ? true:false;
		if (filterOutput) {
			var unpackList = this.wiki.filterTiddlers(this.unpackFilter);
		}
		var tiddler = $tw.wiki.getTiddler(this.actionBundle);
		if (tiddler) {
			//Get the raw text for the bundle.
			var bundleText = tiddler.getFieldString('text');
			if (tiddler.fields.bundle_type === 'JSON') {
				var bundleObject = JSON.parse(tiddler.fields.text);
				for (var tiddlerName in bundleObject) {
					if (filterOutput === false || (unpackList.indexOf(tiddlerName) !== -1)) {
						if (this.actionOverwrite || !this.wiki.getTiddler(tiddlerName)) {
							this.wiki.addTiddler(bundleObject[tiddlerName].fields);
						}
					}
				}
			} else {
				//Get the raw text for each tiddler.
				var rawBundleTiddlers = bundleText.split(separator);
				//Create a tiddler from each tiddler. Only overwrite existing tiddlers if this.actionOverwrite is true
				for (var i = 0; i < rawBundleTiddlers.length; i++) {
					if (rawBundleTiddlers[i].trim() !== '') {
						//Get the raw fields text.
						var rawOtherFields = rawBundleTiddlers[i].split('text:',1);
						var otherFields = rawOtherFields[0].split('\n');
						var textField = rawBundleTiddlers[i].replace(otherFields.join('\n') + 'text:','');
						var fields = {};
						for (var j = 0; j < otherFields.length; j++) {
							var currentField = otherFields[j].slice(otherFields[j].indexOf(':')+1);
							var currentFieldName = otherFields[j].split(':',1);
							if (currentFieldName[0].trim() !== '') {
								fields[currentFieldName[0]] = currentField;
							}
						}
						fields['text'] = textField;
						if (filterOutput === false || (unpackList.indexOf(fields.title) !== -1)) {
							if (this.actionOverwrite || !this.wiki.getTiddler(fields.title)) {
								this.wiki.addTiddler(fields);
							}
						}
					}
				}
			}
		}
	}
	return true; // Action was invoked
};

exports["action-tiddlerbundle"] = ActionTiddlerBundle;

})();