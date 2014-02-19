var websocket = null;

var ready = false;

self.postMessage = self.webkitPostMessage || self.postMessage;

function init(url){
    websocket = new WebSocket(url);
    websocket.binaryType = 'arraybuffer';
    websocket.onopen = function(){
        ready = true;
        respond("state", {"msg": "ready"});
    }
    websocket.onclose = function(){
        ready = false;
        respond("state", {"msg": "dead"});
    }
    websocket.onmessage = function(e){
        parseResponse(e.data);
    }  
};

function parseResponse(data){
    
    var lengths = new Uint32Array(data.slice(0,8));
    var headerlen =  lengths[0];
    var headeroffset = 8;
    var datalen = lengths[1];
    var dataoffset = headerlen + headeroffset;
    var header = parseHeader(data.slice(headeroffset, headerlen+headeroffset));
    
    // Loop through data segments
    for(var i = 0; i < header.metadata.length; i++){
        var segment = header.metadata[i];
        var head = {"header": header, "type": segment[0]};
        respond_transferable("recv", head, data.slice(dataoffset, dataoffset + segment[1]), segment[3]);
        dataoffset += segment[1];
    }
}

function parseHeader(data){
    var str = arrayToString(data);
    var obj = JSON.parse(str);
    return obj;
}

function arrayToString(data){
    var uintData = new Uint8Array(data);
    var stringData = ""
    for(var i=0; i<uintData.length; i++){
        stringData += String.fromCharCode(uintData[i]);
    }
    return stringData;
}

function respond(type, header, data){
    self.postMessage({"type": type, "transferable": false, "header": header, "data": data});
}

function respond_transferable(type, header, data, datatype){
    self.postMessage({"type": type, "transferable": true, "header": header, "data": data, "datatype": datatype}, [data]);
}

self.onmessage = function(e) {
    switch(e.data.cmd){
        case "init":
            init(e.data.args.url);
            break;
        
        case "send":
            if(ready){
                var o = {"cmd": e.data.args.cmd, "args": e.data.args.args}
                var str = JSON.stringify(o);
                websocket.send(str)
            }
            break;
    }
};


