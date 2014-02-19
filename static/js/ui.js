var userinterface = {}

userinterface.sliderlabels = function(){
    $("#gamma_value").html(Number.round(radar.gamma,1));
    $("#contrast_value").text(Number.round(radar.contrast_min,1) + " dB to " + Number.round(radar.contrast_max,1) + " dB");
}

$(function(){
    
    $('#contrast_slider').slider({
        range: true,
        values: [radar.contrast_min, radar.contrast_max],
        max: radar.contrast_max,
        min: radar.contrast_min,
        step: 0.2,
        animate: true,
        slide: function(event, ui){
            radar.contrast_min = ui.values[0];
            radar.contrast_max = ui.values[1];
            userinterface.sliderlabels();
            tilemap.draw(); 
        }        
    });
    
    
    $('#gamma_slider').slider({
        value: 1,
        max: 3,
        min: 0.3,
        step: 0.1,
        range: "min",
        slide: function(event, ui){
            radar.gamma = ui.value;
            userinterface.sliderlabels();
            radar.mk_gamma_lut(radar.gamma);
            tilemap.draw(); 
        }        
    });
    
    $('#autocontrast').button().click(function(){
        histogram.autocontrast();
    });

    $('#goto').button().click(function(){
        var midlat = radar.latitude[tilemap.xoffset + radar.canvas.width/2];
        var midlon = radar.longitude[tilemap.xoffset + radar.canvas.width/2];
        var where = prompt("Go to: Enter latitude, longitude", Number.round(midlat,2) + ", " + Number.round(midlon,2));
        var out = where.split(",");
        
        if (out.length != 2){
            out = where.split(" ");
        }
        
        if (out.length != 2){
            alert("Seperate by comma or space");
            return;
        }

        midlat = parseFloat(out[0]);
        midlon = parseFloat(out[1]);

        radar.goto_latlon(midlat, midlon);

    });
    
    $('#toolselection').buttonset();
    
    $('#tool_move').button().click(function(){
       tilemap.setmode("move"); 
    });
    
    $('#tool_measure').button().click(function(){
       tilemap.setmode("measure"); 
    });
    
    $('#tool_markup').button().click(function(){
       tilemap.setmode("markup"); 
    });
    
    userinterface.sliderlabels();

});


