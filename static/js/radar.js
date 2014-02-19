radar = {};

radar.canvas = null;
radar.context = null;

radar.tilesize = 128;
radar.flightline = "20120330_03";

radar.tilestore = Array();

radar.contrast_min = -180;
radar.contrast_max = -20;
radar.gamma = 1;
radar.gamma_lut = [];
radar.colormap = "gist_gray";

radar.elevation_offset = null;
radar.elevation_global_max = 0;
radar.elevation_global_min = 0;
radar.echogram_height = 0;
radar.echogram_length = 0;
radar.latitude = null;
radar.longitude = null;
radar.distance_along_track = null;
radar.depth = null;
radar.credit = "";
radar.zoommax = 0;
radar.zoomto = null;

radar.set_location = null;

histogram.contrast = [radar.contrast_min, radar.contrast_max];

$(function(){
    
    tilemap.zoom = 2;
    
    var fl = util.query_value("flightline");
    if(fl) radar.flightline = fl;

    var z = util.query_value("zoom");
    if(z) tilemap.zoom = parseInt(z);

    var lat = util.query_value("latitude");
    var lon = util.query_value("longitude");
    if(lat && lon) radar.set_location = [parseFloat(lat), parseFloat(lon)];

    if(!(Modernizr.canvas &&  Modernizr.canvastext && Modernizr.websockets && Modernizr.webworkers)){
        $("#browserwarn").show();
    } 

    if($.browser.mozilla){
        socket.use_worker = false; // bug in Mozilla webworkers, cannot use websockets inside
        $("#performancewarn").show();
    } 
    
    var canvasname = "canvas";
    var websocket_url = "ws://" + window.location.host + "/data";

    radar.mk_gamma_lut();

    tilemap.canvas = $("#" + canvasname);
    tilemap.container = $("#"+ canvasname + "_wrap");
    
    radar.canvas = document.getElementById(canvasname);
    radar.context = radar.canvas.getContext("2d");

    measure.transformDistance = function(x, y){
        return [radar.distance_along_track[x]/1000, radar.depth[y]/1000];
    }

    tilemap.load();

    socket.onready = function(){
        socket.send("metadata", [radar.flightline, tilemap.zoom]);
    };

    socket.setup(websocket_url);     
   
    $(window).resize(tilemap.resize);
    setTimeout(tilemap.resize,500);
    setTimeout(tilemap.resize,1500);
   
});


// MAIN RADAR

radar.forcedraw = function(){   

    if(tilemap.mode == "move"){
        radar.context.clearRect(0, 0, radar.canvas.width, radar.canvas.height);
        for(var i = 0; i<radar.tilestore.length; i++){
            radar.drawtile(i);
        }
        scales.draw();
    }
    measure.draw();

    radar.checktilestore();
};

radar.drawtile = function(i){
    
    var tiledata = radar.tilestore[i][1];
    var tilemeta = radar.tilestore[i][0];
    
    if(tilemeta.width != tilemeta.height) return;
    if(tilemeta.requested) return;
    
    tilesize = tilemeta.tilesize;
    var xx = tilemeta.x - tilemap.xoffset;
    var yy = tilemeta.y - tilemap.yoffset;
    
    var local_elevation_offset = radar.elevation_offset.subarray(tilemeta.x, tilemeta.x+tilesize);
    var max_elevation_offset = 0;
    var min_elevation_offset = 0;
    
    
    // Elevation correction
    for(var j=0; j<tilesize; j++){
        if(local_elevation_offset[j] < min_elevation_offset){
            min_elevation_offset = local_elevation_offset[j];
        }else if(local_elevation_offset[j] > max_elevation_offset){
            max_elevation_offset = local_elevation_offset[j];
        }
    }
    
    if ((xx+tilesize) > 0 && (yy+tilesize+max_elevation_offset) > 0 
        && xx < radar.canvas.width && yy + min_elevation_offset < radar.canvas.height){
            
        var imageData = radar.context.getImageData(xx, yy+min_elevation_offset, tilesize, tilesize+max_elevation_offset-min_elevation_offset);

        var buf = new ArrayBuffer(imageData.data.length);
        var buf8 = new Uint8ClampedArray(buf);
        var data = new Uint32Array(buf);
        
        // set to existing image
        buf8.set(imageData.data);

        for (var x = 0; x < tilesize; ++x) {
            var eoffset = local_elevation_offset[x] - min_elevation_offset;
            for (var y = 0; y < tilesize; ++y) {
                var value = tiledata[y * tilesize + x];
                value = radar.contrast(value);                
                data[(y+eoffset) * (tilesize) + x] = radar.colorize(value);
            }
        }
        imageData.data.set(buf8);
        radar.context.putImageData(imageData, xx, yy+min_elevation_offset);
        
        return true;
    }
    return false;
}

radar.displaytile = function(fl, x, y, z){
    
    if(x<0) return;
    if(y<0) return;
    
    for(var i=0; i<radar.tilestore.length; i++){
        var tilemeta = radar.tilestore[i][0];
        if(tilemeta.flightline == fl 
           && tilemeta.x == x 
           && tilemeta.y == y
           && tilemeta.zoom == z){
            // cache hit or previously requested
            return;
        }
    }
    // cache miss
    radar.tilestore.push([{flightline: fl, x: x, y: y, zoom: z, requested: new Date()}, null]);
    socket.send("tile", [fl, x, y, z, radar.tilesize])
}


// TILEMAP DEFINES

tilemap.populate = _.debounce(function(){

    if(!socket.metaload) return;

    if(radar.zoomto){
        // find closest index to previous zoom level
        var xi = util.get_nearest_index(radar.zoomto[0], radar.distance_along_track);
        var yi = util.get_nearest_index(radar.zoomto[1], radar.depth) + radar.elevation_offset[xi];

        //subtract mouse position from offset;
        tilemap.xoffset = xi - radar.zoomto[2];
        tilemap.yoffset = yi - radar.zoomto[3];

        tilemap.checkbounds();

        radar.zoomto = null;
    }

    if(radar.set_location){
        var lat = radar.set_location[0];
        var lon = radar.set_location[1];
        radar.set_location = null;
        radar.goto_latlon(lat, lon);
        return;
    }
    
    var nxtiles = Math.ceil(radar.canvas.width / radar.tilesize) + 1;
    var nytiles = Math.ceil(radar.canvas.height / radar.tilesize) + 2;
    
    var xxoffset = Math.floor(tilemap.xoffset/radar.tilesize)*radar.tilesize;
    var yyoffset = Math.floor(tilemap.yoffset/radar.tilesize)*radar.tilesize;
            
    for(var x = 0; x < nxtiles; x++){
        
        var min_elevation_offset = 0;
            
        if(radar.elevation_offset !== null){
            for(var j=x*radar.tilesize+xxoffset; j<x*radar.tilesize+xxoffset+radar.tilesize; j++){
                if(radar.elevation_offset[j] < min_elevation_offset){
                    min_elevation_offset = radar.elevation_offset[j];
                }
            }
            min_elevation_offset = (Math.ceil(min_elevation_offset/radar.tilesize)-1)*radar.tilesize;
        }
            
        for(var y = 0; y < nytiles; y++){
            radar.displaytile(radar.flightline, x*radar.tilesize + xxoffset, y*radar.tilesize + yyoffset + min_elevation_offset, tilemap.zoom);
        }
    }
    // FIXME change name
    set_location();
    
}, 1000);

tilemap.draw = _.throttle( radar.forcedraw, 1000/30);

tilemap.checkbounds = function(){
    tilemap.xoffset = Math.min(tilemap.xoffset, radar.echogram_length-radar.canvas.width);
    tilemap.yoffset = Math.min(tilemap.yoffset, radar.echogram_height+radar.elevation_global_max-radar.canvas.height);

    // align top left if width image < width canvas
    tilemap.yoffset = Math.max(tilemap.yoffset, radar.elevation_global_min);
    tilemap.xoffset = Math.max(tilemap.xoffset, 0);

}

tilemap.onresize = function(){
    scales.depth.ticks = Math.round(tilemap.canvas[0].height/200);
    scales.track.ticks = Math.round(tilemap.canvas[0].width/200);
    $("#components").height(tilemap.canvas[0].height);
    map.updateSize();
}

tilemap.onzoom = _.throttle(function(zoomout, x, y){
    if(!socket.metaload) return;    
    var newzoom = tilemap.zoom;

    var xv = radar.distance_along_track[x + tilemap.xoffset];
    var yv = radar.depth[y + tilemap.yoffset - radar.elevation_offset[x + tilemap.xoffset]] ;
    
    if(zoomout){
        newzoom = Math.max(tilemap.zoom-1, 0);
    }else{
        newzoom = Math.min(tilemap.zoom+1, radar.zoommax);
    }

    if(newzoom != tilemap.zoom){
        tilemap.zoom = newzoom;
        radar.tilestore = [];
        radar.zoomto = [xv, yv, x, y];
        socket.send("metadata", [radar.flightline, tilemap.zoom]);
        tilemap.draw();
    }
}, 1000);


// RADAR HELPERS

radar.mk_gamma_lut = function(){
    for(var i = 0; i<256; i++){
        radar.gamma_lut[i] = 255*Math.pow(i/255, radar.gamma);
    }
}

radar.scale = function(value){
    return value/(radar.contrast_max-radar.contrast_min) - radar.contrast_min/(radar.contrast_max-radar.contrast_min);
}

radar.contrast = function(value){
    // linear transformation (db->0..255)
    // var a = 255/(contrast_max-contrast_min;
    // var b = -a * contrast_min;
    // value = a*value + b;
        
    histogram.add(value);
        
    // 0-1 range
    value = radar.scale(value);

    // limit
    value = 255*Math.max(Math.min(value, 1), 0);
    if(radar.gamma != 1){
        value = radar.gamma_lut[Math.ceil(value)];
    }
    
    return value;
}

radar.colorize = function(value){
    if(!isNaN(value)){
        var cmap = colormaps[radar.colormap][Math.floor(value)];
        return (cmap[3]   << 24) |  (cmap[2] << 16) | (cmap[1] <<  8) |  cmap[0]; 
    }
    else{
        return 0;
    }
}

radar.checktilestore = _.debounce(function(){
    
    var to_pop = [];
    var now = new Date();
    var maxdist = 3000;
    var xmin = tilemap.xoffset - maxdist;
    var ymin = tilemap.yoffset - maxdist;
    var xmax = tilemap.xoffset + radar.canvas.width + radar.tilesize + maxdist;
    var ymax = tilemap.yoffset + radar.canvas.height + radar.tilesize + maxdist;
    var removed = 0;

    for(var i=0; i<radar.tilestore.length; i++){
        var tilemeta = radar.tilestore[i][0];
        if(tilemeta.requested && now - tilemeta.requested > 10000){
                to_pop.push(i);
        }else{
            if(tilemeta.zoom != tilemap.zoom || 
               tilemeta.flightline != radar.flightline ||
               tilemeta.x < xmin || tilemeta.x > xmax ||
               tilemeta.y < ymin || tilemeta.y > ymax){
            
                to_pop.push(i);
            } 
            
        }
    } 

    for(var i=0; i<to_pop.length; i++){
        radar.tilestore.splice(to_pop[i]-removed,1);
        removed++;
    }

}, 2000);

radar.goto_latlon = function(lat, lon){
    var i = util.get_double_nearest_index(lat, radar.latitude, lon, radar.longitude);
    tilemap.xoffset = i - radar.canvas.width/2;
    tilemap.checkbounds();
    tilemap.draw();
    tilemap.populate();
}

radar.goto_flightline = function(flightline){
    radar.flightline = flightline;
    radar.tilestore = [];
    socket.send("metadata", [radar.flightline, tilemap.zoom]);
    tilemap.draw();
}
