/*\
title: $:/plugins/inmysocks/TWederation/WebWorker.js
type: application/javascript
module-type: library

This is the code for the webworkers used by the browser messaging stuff

\*/

//The page will send a message to the worker with the url and some other data about the wiki to be checked. Here the worker will determine if the wiki in question is a single page type or a node type. If it is a single page type the worker will use an xmlhttprequest to get the html content of the page, if it is a node type than we need to figure out what it does.
onmessage = function(e) {
    var paramObject = e.data.paramObject || {},
        url = paramObject.url,
        wikiType = paramObject.wiki_type;
    if (url) {
        url += 'index.html';
    }
    console.log(e.data);
    switch (wikiType) {
        case "SINGLE_PAGE":
            console.log("Single Page");
            console.log(url);
            //Code to handle the singe page type
            var xhr = new XMLHttpRequest();
            xhr.addEventListener("load", loadResponse);
            xhr.addEventListener("progress", updateProgress);
            xhr.onreadystatechange = function() {
                console.log('State change');
                console.log(xhr.readyState);
                console.log(xhr.status);
                if (xhr.readyState == 4/* && xhr.status == 200*/) {
                    var response = {'data': e.data, 'html': xhr.responseText};
                    self.postMessage(response);
                    self.close();
                }
            }
/*
            xhr.onload = function() {
              self.postMessage(xhr.responseText);
              //If we change the worker so that we try to do things in sequence with a few workers instead of spawing a new worker for each request than this is where the worker would need to do something other than close itself when it is done with the current request.
              self.close();
            }
*/
            xhr.open("GET", url);
//            xhr.responseType = "document";
            xhr.send();
            console.log(xhr);
            break;
        case "NODE":
            //code to handle the node type
            break;
    }
}

function updateProgress (oEvent) {
  if (oEvent.lengthComputable) {
    var percentComplete = oEvent.loaded / oEvent.total;
    console.log(percentComplete);
  } else {
    console.log('maybe loading?');
  }
}

function loadResponse() {
    console.log('loaded in worker');
    self.postMessage(xhr.responseText);
    //If we change the worker so that we try to do things in sequence with a few workers instead of spawing a new worker for each request than this is where the worker would need to do something other than close itself when it is done with the current request.
    self.close();
}
