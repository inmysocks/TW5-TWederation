/*\
title: $:/core/modules/browser-messaging.js
type: application/javascript
module-type: startup

Browser message handling

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "browser-messaging";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

/*
Load a specified url as an iframe and call the callback when it is loaded. If the url is already loaded then the existing iframe instance is used
*/
function loadIFrame(url,callback) {
	// Check if iframe already exists
	var iframeInfo = $tw.browserMessaging.iframeInfoMap[url];
	if(iframeInfo) {
		// We've already got the iframe
		callback(null,iframeInfo);
	} else {
		// Create the iframe and save it in the list
		var iframe = document.createElement("iframe"),
			iframeInfo = {
				url: url,
				status: "loading",
				domNode: iframe
			};
		$tw.browserMessaging.iframeInfoMap[url] = iframeInfo;
		saveIFrameInfoTiddler(iframeInfo);
		// Add the iframe to the DOM and hide it
		iframe.style.display = "none";
		document.body.appendChild(iframe);
		// Set up onload
		iframe.onload = function() {
			iframeInfo.status = "loaded";
			saveIFrameInfoTiddler(iframeInfo);
			callback(null,iframeInfo);
		};
		iframe.onerror = function() {
			callback("Cannot load iframe");
		};
		try {
			iframe.src = url;
		} catch(ex) {
			callback(ex);
		}
	}
}

function closeIFrame(url) {
	var iframe = document.body.getElementsByTagName('iframe');
	for (var j = 0; j < iframe.length; j++) {
		if (iframe[j].src === url) {
			document.body.removeChild(iframe[j]);
			$tw.browserMessaging.iframeInfoMap[url] = null;
		}
	}
}

function saveIFrameInfoTiddler(iframeInfo) {
	$tw.wiki.addTiddler(new $tw.Tiddler($tw.wiki.getCreationFields(),{
		title: "$:/temp/ServerConnection/" + iframeInfo.url,
		text: iframeInfo.status,
		tags: ["$:/tags/ServerConnection"],
		url: iframeInfo.url
	},$tw.wiki.getModificationFields()));
}

exports.startup = function() {
	//Initialize our recognized sources list
	$tw.wiki.recognizedSources = $tw.wiki.recognizedSources || {};
	// Initialise the store of iframes we've created
	$tw.browserMessaging = {
		iframeInfoMap: {} // Hashmap by URL of {url:,status:"loading/loaded",domNode:}
	};
	// Listen for widget messages to control loading the plugin library
	$tw.rootWidget.addEventListener("tm-load-plugin-library",function(event) {
		var paramObject = event.paramObject || {},
			url = paramObject.url;
		if(url) {
			loadIFrame(url,function(err,iframeInfo) {
				if(err) {
					alert("Error loading plugin library: " + url);
				} else {
					iframeInfo.domNode.contentWindow.postMessage({
						verb: "GET",
						url: "recipes/library/tiddlers.json",
						cookies: {
							type: "save-info",
							infoTitlePrefix: paramObject.infoTitlePrefix || "$:/temp/RemoteAssetInfo/",
							url: url
						}
					},"*");
				}
			});
		}
	});
	/*
	This handles close iframe requests events.
	*/
	$tw.rootWidget.addEventListener("tm-close-iframe", function(event) {
		var url = paramObject.url;
		if (url) {
			closeIFrame(url);
		}
	});
    /*
	This sends send bundle requests
    */
    $tw.rootWidget.addEventListener("tm-request-bundle", function(event) {
	    var paramObject = event.paramObject || {},
			url = paramObject.url;
		if(url) {
	    	loadIFrame(url,function(err,iframeInfo) {
				if(err) {
					alert("Error loading tiddler bundle: " + url);
				} else {
					console.log(event.paramObject);
    				iframeInfo.domNode.contentWindow.postMessage({
    					verb: "BUNDLE_REQUEST",
    					filter: event.paramObject.filter,
    					bundlename: event.paramObject.bundleName,
    					separator: event.paramObject.separator,
    					destination: url,
    					bundleFunction: event.paramObject.packingFunction,
    					sender: event.paramObject.sender,
    					recipient: event.paramObject.recipient,
    					previousTime: event.paramObject.previousTime
    				}, "*");
    			}
    		});
    	}
    });
	$tw.rootWidget.addEventListener("tm-load-plugin-from-library",function(event) {
		var paramObject = event.paramObject || {},
			url = paramObject.url,
			title = paramObject.title;
		if(url && title) {
			loadIFrame(url,function(err,iframeInfo) {
				if(err) {
					alert("Error loading plugin library: " + url);
				} else {
					iframeInfo.domNode.contentWindow.postMessage({
						verb: "GET",
						url: "recipes/library/tiddlers/" + encodeURIComponent(title) + ".json",
						cookies: {
							type: "save-tiddler",
							url: url
						}
					},"*");
				}
			});
		}
	});
	// Listen for window messages from other windows
	window.addEventListener("message",function listener(event){
		console.log("browser-messaging: ",document.location.toString())
		console.log("browser-messaging: Received message from",event.origin);
		console.log("browser-messaging: Message content",event.data);
		switch(event.data.verb) {
			case "GET-RESPONSE":
				if(event.data.status.charAt(0) === "2") {
					if(event.data.cookies) {
						if(event.data.cookies.type === "save-info") {
							var tiddlers = JSON.parse(event.data.body);
							$tw.utils.each(tiddlers,function(tiddler) {
								$tw.wiki.addTiddler(new $tw.Tiddler($tw.wiki.getCreationFields(),tiddler,{
									title: event.data.cookies.infoTitlePrefix + event.data.cookies.url + "/" + tiddler.title,
									"original-title": tiddler.title,
									text: "",
									type: "text/vnd.tiddlywiki",
									"original-type": tiddler.type,
									"plugin-type": undefined,
									"original-plugin-type": tiddler["plugin-type"],
									"module-type": undefined,
									"original-module-type": tiddler["module-type"],
									tags: ["$:/tags/RemoteAssetInfo"],
									"original-tags": $tw.utils.stringifyList(tiddler.tags || []),
									"server-url": event.data.cookies.url
								},$tw.wiki.getModificationFields()));
							});
						} else if(event.data.cookies.type === "save-tiddler") {
							var tiddler = JSON.parse(event.data.body);
							$tw.wiki.addTiddler(new $tw.Tiddler(tiddler));
						}
					}
				}
				break;
			case "BUNDLE_REQUEST":
				if (event.data.bundleFunction) {
					var bundleFunction = $tw.wiki.bundleFunction[event.data.bundleFunction];
					if (typeof bundleFunction === "function") {
						bundleFunction(event, 'Ok');
					} else {
						//If an invalid is given use the default function
						$tw.wiki.bundleFunction.bundleTiddlers(event, 'invalid bundle function given, using default function as fallback. Bundle function: ' + event.data.bundleFunction);
					}
				} else {
					//If no bundleFunction is given use the default function
					$tw.wiki.bundleFunction.bundleTiddlers(event, 'no bundle function given, used default.');
				}
				break;
			case "DELIVER_BUNDLE":
				//Check if the bundle was sent from a recognized source
				if ($tw.wiki.recognizedSources[event.origin]) {
					//Check the type of bundle that was sent and pick the appropriate handler based on the type
					if (typeof $tw.wiki.bundleHandler[event.data.type] === 'function') {
						$tw.wiki.bundleHandler[event.data.type](event);
					} else {
						//If no recognized type is given make the bundle plain text to be safe.
						event.data.bundle.type = 'text/plain';
						console.log('unrecognized source')
						$tw.wiki.addTiddler(new $tw.Tiddler(event.data.bundle));
					}
				} else {
					//If the source isn't recognized than set the tiddler as plain text and marke it as having an unrecognized source.
					event.data.bundle.type = 'text/plain';
					event.data.bundle.source = 'unrecognized';
					$tw.wiki.addTiddler(new $tw.Tiddler(event.data.bundle));
				}
				$tw.wiki.addTiddler(new $tw.Tiddler($tw.wiki.getCreationFields(),{title: '$:/TiddlerBundleData/' + event.data.bundle.title, list: event.data.bundle.list, text: "Source: {{!!source}}<br>Tiddlers: <$list filter='[list[]]'><$link to=<<currentTiddler>>><$view field='title'/></$link>, </$list>", tags: '$:/tags/TiddlerBundle', source: event.origin}));
				closeIFrame(event.data.origin);
				break;
		}
	},false);
};

})();
