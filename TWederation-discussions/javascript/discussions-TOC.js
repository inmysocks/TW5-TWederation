/*\
title: $:/plugins/Federation/TWederation/discussions-TOC.js
type: application/javascript
module-type: widget

A widget that displays a list of discussion posts

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var widgets;
var container;

var TOC = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TOC.prototype = new Widget();

/*
Render this widget into the DOM
*/
TOC.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var domNode = this.document.createElement("div");
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
TOC.prototype.execute = function() {
	//Get widget attributes.
	var thisFilter = this.getAttribute("filter",'[role[twDiscussionPost]!has[parent]]');
    var thisTemplate = this.getAttribute("template", "$:/plugins/Federation/TWederation/Templates/DiscussionItemViewTemplate");
    var thisSort = this.getAttribute("sort");
    var thisAuthor = this.getAttribute("author");
    var thisLimit = this.getAttribute("limit", 99999);
    this.ReadListing = this.getAttribute("state", "$:/state/TWederation/Discussions/ReadPosts");
    this.ReadStatus = this.getAttribute("status", "$:/state/TWederation/Discussions/ReadStatusTiddler");

    this.readTimeTiddler = this.wiki.getTiddlerData(this.ReadListing) || {};
    this.readStatusTiddler = this.wiki.getTiddlerData(this.ReadStatus) || {};
	this.tiddlerStructure = [];

    if (thisLimit === "" || thisLimit === undefined) {
        thisLimit = 99999;
    }

    //Get the list of root posts
    if (thisAuthor) {
        thisFilter += '+[author[' + thisAuthor + ']]';
    }
    this.rootTiddlerList = this.wiki.filterTiddlers(thisFilter,this);


    //Build the data structure that holds the information on the tiddlers.
    //This should have this form
    /*
    {
        {
            name: some root,
            created: 00000,
            modified: 0000,
            most_recent_child: 0000,
            children: {
                {
                    name:some child,
                    created: 0000,
                    modified:0000,
                    most_recent_child:0000,
                    children:{
                    }
                }
            }
        },
        {
            name: some other root,
            created:
            modified:
            most_recent_child:
            children: {

            }
        },
    }
    */
	this.getTiddlerStructure(this.rootTiddlerList);

    //Handle the sorting, defaults to sorting by root post age.
    //Because chrome is a pain that can't figure out how to preserve order while sorting, we need to split into two groups then sort the groups independently and then join them back together.
    if (thisSort === "newest_comments") {
        //Sort root posts by the youngest child post
        this.tiddlerStructure.sort(function(a,b) {
            var aVal = (a.most_recent_child === 0)?a.modified:a.most_recent_child;
            var bVal = (b.most_recent_child === 0)?b.modified:b.most_recent_child;
            if (aVal < bVal) {
                return 1;
            } else if (aVal > bVal) {
                return -1;
            }
        });
    } else if (thisSort === "unread_comments") {
        //Split into read and unread posts then sort each set of root posts by hte newest child post
        var readTiddlers = [];
        var unreadTiddlers = [];
        for (var i = 0; i < Object.keys(this.tiddlerStructure).length; i++) {
            if (this.tiddlerStructure[i].read === 'true') {
                readTiddlers.push(this.tiddlerStructure[i]);
            } else {
                unreadTiddlers.push(this.tiddlerStructure[i]);
            }
        }
        unreadTiddlers.sort(function(a,b) {
            var aVal = (a.most_recent_child === 0)?a.modified:a.most_recent_child;
            var bVal = (b.most_recent_child === 0)?b.modified:b.most_recent_child;
            if (aVal < bVal) {
                return 1;
            } else if (aVal > bVal) {
                return -1;
            } else {
                return 0;
            }
        });
        readTiddlers.sort(function(a,b) {
            var aVal = (a.most_recent_child === 0)?a.modified:a.most_recent_child;
            var bVal = (b.most_recent_child === 0)?b.modified:b.most_recent_child;
            if (aVal < bVal) {
                return 1;
            } else if (aVal > bVal) {
                return -1;
            } else {
                return 0;
            }
        });
        this.tiddlerStructure = unreadTiddlers.concat(readTiddlers);
    } else if (thisSort === "unread") {
        //Split into read and unread posts then sort each set by the post creation time.
        var readTiddlers = [];
        var unreadTiddlers = [];
        for (var i = 0; i < Object.keys(this.tiddlerStructure).length; i++) {
            if (this.tiddlerStructure[i].read === 'true') {
                readTiddlers.push(this.tiddlerStructure[i]);
            } else {
                unreadTiddlers.push(this.tiddlerStructure[i]);
            }
        }
        readTiddlers.sort(function(a,b) {
            if(a.modified < b.modified) {
                return 1;
            } else if (a.modified > b.modified) {
                return -1;
            } else {
                return 0;
            }
        });
        unreadTiddlers.sort(function(a,b) {
            if(a.modified < b.modified) {
                return 1;
            } else if (a.modified > b.modified) {
                return -1;
            } else {
                return 0;
            }
        });
        this.tiddlerStructure = unreadTiddlers.concat(readTiddlers);
    } else {
        this.tiddlerStructure.sort(function(a,b) {
            if(a.modified < b.modified) {
                return 1;
            } else {
                return -1;
            }
        });
    }

	var templateTree = [];
	var widgetsThing = [];

	for (var i = 0; i < Object.keys(this.tiddlerStructure).length && i < thisLimit; i++) {
		templateTree = [{type: "transclude", attributes: {tiddler: {type:"string", value:thisTemplate}}}];
		widgetsThing.push({type: "listitem", itemTitle: this.tiddlerStructure[i].title, variableName: 'currentTiddler', children: templateTree});
	}
	this.makeChildWidgets(widgetsThing);

};

TOC.prototype.addChildren = function(tiddlerTitle) {
    var mostRecent = 0;
    var children = [];
    var data = {};
    var currentTiddler;
    var childrenFilter = '[role[twDiscussionPost]parent[' + tiddlerTitle + ']]';
    var childrenList = this.wiki.filterTiddlers(childrenFilter);
    for (var i = 0; i < childrenList.length; i++) {
        currentTiddler = this.wiki.getTiddler(childrenList[i]);
        if (currentTiddler) {
            if (currentTiddler.fields.created > mostRecent || currentTiddler.fields.modified > mostRecent) {
                mostRecent = (currentTiddler.fields.created > currentTiddler.fields.modified)?currentTiddler.fields.created:currentTiddler.fields.modified;
            }
            children[i] = {'title':currentTiddler.fields.title, 'created':currentTiddler.fields.created, 'modified':currentTiddler.fields.modified};
            data = this.addChildren(currentTiddler.fields.title);
            children[i].children = data.children;
            children[i].most_recent_child = data.most_recent_child;
            mostRecent = (mostRecent > data.most_recent_child)?mostRecent:data.most_recent_child;
        }
    }
    return {'children':children, 'most_recent_child':mostRecent};
}

TOC.prototype.getTiddlerStructure = function(rootTiddlerList) {
	var readDate;
    var currentTiddler;
    var mostRecent = 0;
    var data;
    var read;
    for (var i = 0; i < rootTiddlerList.length; i++) {
        if (this.readTimeTiddler[rootTiddlerList[i]]) {
            readDate = $tw.utils.parseDate(this.readTimeTiddler[rootTiddlerList[i]]);
            read = 'true';
        } else {
            read = 'false';
            readDate = 0;
        }
        currentTiddler = this.wiki.getTiddler(rootTiddlerList[i]);
        if (currentTiddler.fields.created > mostRecent || currentTiddler.fields.modified > mostRecent) {
            mostRecent = (currentTiddler.fields.created > currentTiddler.fields.modified)?currentTiddler.fields.created:currentTiddler.fields.modified;
        }
        this.tiddlerStructure[i] = {'title':currentTiddler.fields.title, 'created':currentTiddler.fields.created, 'modified':currentTiddler.fields.modified};
        data = this.addChildren(currentTiddler.fields.title);
        if (readDate == 0 || data.most_recent_child > readDate) {
            read = 'false';
        }
        this.tiddlerStructure[i].read = read;
        this.tiddlerStructure[i].most_recent_child = data.most_recent_child;
        this.tiddlerStructure[i].children = data.children;
        this.readStatusTiddler[rootTiddlerList[i]] = read;
    }
}

/*
Refresh the widget by ensuring our attributes are up to date
*/
TOC.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	//If attributes have changed refresh everything
	if(changedAttributes["filter"] || changedAttributes["sort"] || changedAttributes["author"] || changedAttributes["limit"] || changedTiddlers[this.ReadListing]) {
		this.refreshSelf();
		if (changedTiddlers[this.ReadListing]) {
            this.wiki.setText(this.ReadStatus, 'text', null, JSON.stringify(this.readStatusTiddler));
            this.wiki.setText(this.ReadStatus, 'type', null, 'application/json');
        }
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["TOC"] = TOC;

})();
