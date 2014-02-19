var scales = {}

scales.depth = {}
scales.depth.ticks = 8;
scales.depth.width = 20;

scales.track = {}
scales.track.ticks = 10;
scales.track.height = 20;

scales.draw = function(){
    
    radar.context.font = "10px verdana, sans-serif";
    radar.context.beginPath();
    
    if(radar.elevation_offset !== null){
        for(var y = 0; y < scales.depth.ticks; y++){
                    
            var yy = -tilemap.yoffset + radar.elevation_offset[tilemap.xoffset+radar.canvas.width] + Math.round(y*radar.canvas.height/scales.depth.ticks);
            while(yy < 0){
                yy += radar.canvas.height;
            }
            var i = yy + tilemap.yoffset - radar.elevation_offset[tilemap.xoffset+radar.canvas.width];

            radar.context.moveTo(0, yy);
            radar.context.lineTo(scales.depth.width, yy);
            radar.context.moveTo(canvas.width-scales.depth.width, yy);
            radar.context.lineTo(canvas.width, yy);
            
            scales.drawtext(Number.round(radar.depth[i],1) + " m", 5, yy+15);

        }
    }
    
    if(radar.latitude !== null){

        for(var x = 0; x < scales.track.ticks; x++){
            var xx = (-tilemap.xoffset + Math.round(x*radar.canvas.width/scales.track.ticks));
            while(xx < 0){
                xx += radar.canvas.width
            }
            radar.context.moveTo(xx, 0);
            radar.context.lineTo(xx, scales.track.height);
            radar.context.moveTo(xx, radar.canvas.height-scales.track.height);
            radar.context.lineTo(xx, radar.canvas.height);
            
            var text = [
                scales.latitude(xx+tilemap.xoffset) + " / " + scales.longitude(xx+tilemap.xoffset),
                Number.round(radar.distance_along_track[xx+tilemap.xoffset]/1000, 1) + " km"
            ];
            
            for(var i = 0; i < text.length; i++){
                scales.drawtext(text[i], xx+5, 13*(1+i)); 
            }

            
        }
    
    }
    
    radar.context.lineWidth = 5;
    radar.context.strokeStyle = "#eeeeee";
    radar.context.stroke();
    radar.context.lineWidth = 1;
    radar.context.strokeStyle = "#000000";
    radar.context.stroke();

    scales.drawtext(radar.credit, 5, radar.canvas.height - 5);
    
}

scales.drawtext = function(text, x, y){
    radar.context.lineWidth = 3.0;
    radar.context.strokeStyle = "#eeeeee";
    radar.context.strokeText(text, x, y);
    radar.context.fillText(text, x, y);
}

scales.latitude = function(val){
    var x = Number.round(Math.abs(radar.latitude[val]),2);
    return x + (val > 0 ? "N" : "S")
}

scales.longitude = function(val){
    var x = Number.round(Math.abs(radar.longitude[val]),2);
    return x + (val > 0 ? "W" : "E")
}
