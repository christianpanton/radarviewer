var socket = {};

socket.ready = false;
socket.metaload = false;

// worker implementation
socket.use_worker = true;

socket.jobcounter = 0;
socket.maxworkers = 5;
socket.readyworkers = 0;
socket.workers = [];
socket.metacounter = 0;

// standalone websocket
socket.websocket = null;

socket.setup = function(url){
    if(socket.use_worker){
        for(var i = 0; i < socket.maxworkers; i++){
            var worker = new Worker('/static/js/socket.worker.js');
            worker.onmessage = socket.recv;
            worker.postMessage({"cmd": "init", "args": {"url": url}});
            socket.workers.push(worker);
        }
    }else{
        socket.websocket = new WebSocket(url);
        socket.websocket.binaryType = 'arraybuffer';
        socket.websocket.onopen = function(){
            socket.ready = true;
            socket.onready();
        }
        socket.websocket.onclose = function(){
            socket.ready = false;
        }
        socket.websocket.onmessage = function(e){
            socket.parseResponse(e.data);
        }  
    }
}

socket.send = function(cmd, args){
    if(socket.ready){
        if(socket.use_worker){
            socket.send_to_worker("send", {"cmd": cmd, "args": args});
        }else{
            var o = {"cmd": cmd, "args": args}
            var str = JSON.stringify(o);
            socket.websocket.send(str);
        }
    }
}

socket.send_to_worker = function(cmd, args){
    socket.jobcounter++;
    var i = socket.jobcounter % socket.workers.length;
    socket.workers[i].postMessage({"cmd": cmd, "args": args});
}

socket.onready = function(){};

socket.recv = function(event){
    
    var type = event.data.type;
    var header = event.data.header;
    
    if(event.data.transferable){
        var data = socket.convertType(event.data.datatype, event.data.data);
    }else{
        var data = event.data.data;
    }
    
    switch(type){
    
        case "state":
            if(header.msg == "ready"){
                if(!socket.ready){ 
                    socket.readyworkers++;
                    if(socket.readyworkers >= socket.workers.length){
                        socket.ready = true;
                        socket.onready();
                    }
                }
            }
            break;
            
        case "recv":
        
            // convert to event for more beautiful code
            switch(header.type){
                case "tile":
                    radar.tilestore.push([header.header, data]);  
                    tilemap.draw(); 
                    break;
                    
                case "depth":
                    radar.echogram_length = header.header.length;
                    radar.echogram_height = header.header.height;
                    radar.credit = header.header.credit;
                    radar.zoommax = header.header.zoommax;
                    radar.depth = data;
                    socket.gotmeta();
                    break;
                
                case "latitude":
                    radar.latitude = data;
                    socket.gotmeta();
                    break;
                
                case "longitude":
                    radar.longitude = data;
                    socket.gotmeta();
                    break;
                
                case "elevation_offset":
                    radar.elevation_global_min = header.header.elevation_offset.min;
                    radar.elevation_global_max = header.header.elevation_offset.max;  
                    radar.elevation_offset = data;
                    socket.gotmeta();
                    break;
                
                case "distance_along_track":
                    radar.distance_along_track = data;
                    socket.gotmeta();
                    break;
            }            
            break;     
    }
}

socket.gotmeta = function(){
    socket.metacounter++;
    socket.metaload = false;
    if(socket.metacounter >= 5){
        socket.metacounter = 0;
        socket.metaload = true;
        tilemap.populate();
    }
}

socket.parseResponse = function(data){
    
    var lengths = new Uint32Array(data.slice(0,8));
    var headerlen =  lengths[0];
    var headeroffset = 8;
    var datalen = lengths[1];
    var dataoffset = headerlen + headeroffset;
    var header = JSON.parse(util.arrayToString(data.slice(headeroffset, headerlen+headeroffset)));
    
    // Loop through data segments
    for(var i = 0; i < header.metadata.length; i++){
        var segment = header.metadata[i];
        var segmentdata = socket.convertType(segment[3], data.slice(dataoffset, dataoffset + segment[1]));
        socket.recv({"data": {"type": "recv", "header": {"header": header, "type": segment[0]}, "data": segmentdata}});
        dataoffset += segment[1];
    }
}

socket.convertType = function(type, data){
    switch(type){
        case "f":
            return new Float32Array(data);
        case "i":
            return new Int32Array(data);
    }
}




