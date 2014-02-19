// MARKUP
var markup = {};

markup.begin = function(){
    tilemap.canvas.css({cursor: "move"});
}

markup.end = function(){}


// MOVE
var move = {};

move.begin = function(){
    tilemap.canvas.css({cursor: "move"});
}

move.end = function(){}

// MEASURE
var measure = {};

measure.active = false;
measure.getcanvas = false;
measure.data = [];
measure.bgcanvas = null;
measure.cursor = [0,0];

measure.begin = function(){
    tilemap.canvas.css({cursor: "crosshair"});
    measure.active = true;
    measure.getcanvas = true;
    radar.forcedraw();
    measure.getcanvas = false;
    measure.bgcanvas = radar.context.getImageData(0, 0, radar.canvas.width, radar.canvas.height);
    $("#infobox").show();
}

measure.end = function(){
    measure.bgcanvas = null;
    measure.active = false;
    $("#infobox").hide();
}


measure.draw = function(){
    
    if(measure.getcanvas) return false;
    if(measure.active) radar.context.putImageData(measure.bgcanvas, 0, 0);
    
    radar.context.beginPath();
    radar.context.lineWidth = 2;
    radar.context.lineCap = "round";
    radar.context.lineJoin = "round";
    radar.context.strokeStyle = "#000";
    
    var xlen = 5;
    
    var x = 0;
    var y = 0;
    
    for(var i = 0; i < measure.data.length; i++){
        
        x = measure.data[i][0]-tilemap.xoffset;
        y = measure.data[i][1]-tilemap.yoffset;
        
        if(i == 0){
           
            radar.context.moveTo(x, y-xlen);
            radar.context.lineTo(x, y+xlen);
            radar.context.moveTo(x+xlen, y);
            radar.context.lineTo(x-xlen, y);
            radar.context.moveTo(x, y);

        }else{
            
            radar.context.lineTo(x, y);
            radar.context.moveTo(x, y-xlen);
            radar.context.lineTo(x, y+xlen);
            radar.context.moveTo(x+xlen, y);
            radar.context.lineTo(x-xlen, y);
            radar.context.moveTo(x, y);
            
        }
    }
    
    if(measure.cursor){
        if(measure.data.length > 0){
            radar.context.stroke();
            radar.context.beginPath();
            radar.context.moveTo(measure.data[measure.data.length-1][0]-tilemap.xoffset, measure.data[measure.data.length-1][1]-tilemap.yoffset);
        }
        radar.context.strokeStyle = "#ddd";
        radar.context.lineTo(measure.cursor[0], measure.cursor[1]);
        radar.context.lineWidth = 1;
    }

    radar.context.stroke();
    
    if(measure.data.length > 1){
        radar.context.beginPath();
        
        if(measure.data.length == 2) radar.context.lineWidth = 2;
        radar.context.moveTo(measure.data[0][0]-tilemap.xoffset, measure.data[0][1]-tilemap.yoffset);
        radar.context.strokeStyle = "#08c";
        radar.context.lineTo(measure.data[measure.data.length-1][0]-tilemap.xoffset, measure.data[measure.data.length-1][1]-tilemap.yoffset);
        radar.context.stroke();
    }

}

measure.move = function(x,y){
    measure.cursor = [x,y];
}

measure.moveout = function(){
    measure.cursor = null;
}

measure.click = function(x, y){
    measure.data.push([x+tilemap.xoffset,y+tilemap.yoffset]);
    measure.updateInfobox();
}

measure.clear = function(){
    measure.data = [];
    measure.updateInfobox();
}

measure.transformDistance = function(x, y){ // override!
    return [x, y];
}

measure.updateInfobox = function(){
    var angle = measure.calc.angle();
    var area = measure.calc.area();
    var distance = measure.calc.distance();
    
    if(angle){
        $("#infobox_angle").text(Number.round(angle,2));
    }else{
        $("#infobox_angle").text("-");
    }
    
    if(distance){
        $("#infobox_distance").text(Number.round(distance,2));
    }else{
        $("#infobox_distance").text("-");
    }
    
    if(area){
        $("#infobox_area").text(Number.round(area,2));
    }else{
        $("#infobox_area").text("-");
    }
}


measure.calc = {};

measure.calc.angle = function(){

    if(measure.data.length > 1){
        var a = measure.data[0]
        var b = measure.data[measure.data.length-1];
        
        // transform to real world coordinates
        var ta = measure.transformDistance(a[0], a[1]);
        var tb = measure.transformDistance(b[0], b[1]);
        
        // calulate angle
        var angle = Math.atan2(ta[1]-tb[1], tb[0]-ta[0])*180/Math.PI;
        
        if(angle < -90){
            angle = angle + 180;
        }else if(angle > 90){
            angle = angle - 180;
        }
        
        
        
        return angle;
    }
}

measure.calc.distance = function(){
    var prev_point = null;
    var distance = 0;
    for(var i = 0; i < measure.data.length; i++){
        var point = measure.transformDistance(measure.data[i][0], measure.data[i][1]);
        
        if(prev_point){
            var dx = point[0]-prev_point[0];
            var dy = point[1]-prev_point[1];
            distance += Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        }
        
        prev_point = point;
    }
    
    return distance;
}

measure.calc.area = function(){
    
    if(measure.data.length > 2){
        var area = 0;         // Accumulates area in the loop
        var j = measure.data.length-1;  // The last vertex is the 'previous' one to the first

        for (i=0; i<measure.data.length; i++){ 
          
          var a = measure.transformDistance(measure.data[i][0], measure.data[i][1]);
          var b = measure.transformDistance(measure.data[j][0], measure.data[j][1]);
          
          area += (b[0]+a[0]) * (b[1]-a[1]); 
          j = i;  //j is previous vertex to i
        }
                 

        return Math.abs(area/2);
    }

}

$(function(){

    // FIXME - delayed load
    
    for(var i = 0; i < colormaps.names.length; i++){
        $("#colormap_select").append('<option>' + colormaps.names[i] + '</option>');
    }
    
    $("#colormap_select").bind('change', function(){
        radar.colormap = $("#colormap_select") [0].value;
        radar.forcedraw();
    }); 
    
});


var tools = {"measure": measure, "move": move, "markup": markup};
