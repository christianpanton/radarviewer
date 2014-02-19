var histogram = {};

histogram.data = [];
histogram.collecting = false;
histogram.contrast = null; // [min, max]

histogram.reset = function(){
    
    histogram.data = [];  
    for (var i=0;i<256;i++) {
        histogram.data[i] = 0;
    }
    
};

histogram.add = function(value){
    if(!histogram.collecting) return;
    if(isNaN(value)) return;
    // add to histogram
    var a = 255/(histogram.contrast[1]-histogram.contrast[0]);
    var b = -a * histogram.contrast[0];
    value = a*value + b;
    if(value <= 255 && value >= 0) histogram.data[Math.round(value)]++;
};

histogram.autocontrast = function(){
    
    histogram.reset();
    histogram.collecting = true;
    radar.forcedraw();
    histogram.collecting = false;
    
    var percentile = 0.975;
    var count = histogram.data.sum();
    
    var lowlimit = 0;
    var highlimit = 255;
    
    var cumsum = 0;
    for (var i=0;i<256;i++) {
        cumsum += histogram.data[i];
        if(cumsum/count > (1-percentile)){
            lowlimit = i-2;
            break;
        }
    }
    
    var cumsum = count;
    for (var i=255;i>0;i--) {
        cumsum -= histogram.data[i];
        if(cumsum/count < percentile){
            highlimit = i+2;
            break;
        }
    }
    
    var a = 255/(histogram.contrast[1]-histogram.contrast[0]);
    var b = -a * histogram.contrast[0];

    radar.contrast_min = (lowlimit - b)/a;
    radar.contrast_max = (highlimit - b)/a;
    
    radar.forcedraw();
    
    $("#contrast_slider").slider("values", 0, radar.contrast_min);
    $("#contrast_slider").slider("values", 1, radar.contrast_max);
    userinterface.sliderlabels();
    
};
