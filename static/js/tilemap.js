var tilemap = {};

tilemap.canvas = null;
tilemap.container = null;


tilemap.xoffset = 0;
tilemap.yoffset = 0;
tilemap.dragx = 0;
tilemap.dragy = 0;
tilemap.leftdown = false;
tilemap.zoom = 0;
tilemap.mode = "move";

tilemap.load = function(){
    
    tilemap.canvas.bind("contextmenu",function(e){
        return false;
    });
    

    tilemap.canvas.mouseleave(function(e){
        if(tilemap.mode == "measure"){
            measure.moveout();
            tilemap.draw();
        }
    });
    
    tilemap.canvas.mousedown(function(e){
        
        if(typeof e.offsetX === "undefined" || typeof e.offsetY === "undefined") {
           var targetOffset = $(e.target).offset();
           e.offsetX = e.pageX - targetOffset.left;
           e.offsetY = e.pageY - targetOffset.top;
        }

        
        if(e.which === 1){
            if(tilemap.mode == "move"){
                tilemap.leftdown = true;
                tilemap.dragx = e.offsetX;
                tilemap.dragy = e.offsetY;
            }else if(tilemap.mode == "measure"){
                measure.click(e.offsetX, e.offsetY);
                tilemap.draw();
            }
        }
        else if(e.which === 3){
            if(tilemap.mode == "measure"){
                measure.clear();
                tilemap.draw();
            }
        }
    });
    
    $(document).mouseup(function(e){
        if(e.which === 1) 
        {
            if(tilemap.leftdown){
                if(tilemap.mode == "move"){
                    tilemap.populate();
                }
            }
            tilemap.leftdown = false;
        }
    }); 

    
    $(document).keydown(function(e){
        
       var handled = true;
       switch(e.which){
           case 37: tilemap.xoffset -= 100; break;
           case 39: tilemap.xoffset += 100; break;
           case 38: tilemap.yoffset -= 100; break;
           case 40: tilemap.yoffset += 100; break;
           default: console.log("Keycode: ", e.which); handled = false;
       }
       
       tilemap.checkbounds();
       tilemap.populate();
       tilemap.draw();
       if(handled) e.preventDefault(true);
    });
    
    
    tilemap.canvas.mousewheel(function(e, delta){

        // Firefox quirks
        if(typeof e.offsetX === "undefined" || typeof e.offsetY === "undefined") {
           var targetOffset = $(e.target).offset();
           e.offsetX = e.pageX - targetOffset.left;
           e.offsetY = e.pageY - targetOffset.top;
        }

        tilemap.onzoom(delta > 0, e.offsetX, e.offsetY);        
        e.preventDefault(true);
    });

    tilemap.canvas.bind('mousemove', _.throttle(function(e){

        // Firefox quirks
        if(typeof e.offsetX === "undefined" || typeof e.offsetY === "undefined") {
           var targetOffset = $(e.target).offset();
           e.offsetX = e.pageX - targetOffset.left;
           e.offsetY = e.pageY - targetOffset.top;
        }
        
        // IE quirks
        if ($.browser.msie && !(document.documentMode >= 9) && !event.button) {
            tilemap.leftdown = false;
        }

        if(e.which === 1 && !tilemap.leftdown) e.which = 0;
        
        if(e.which){
            
            if(tilemap.mode == "move"){
                tilemap.xoffset -= e.offsetX-tilemap.dragx;
                tilemap.yoffset -= e.offsetY-tilemap.dragy;
                tilemap.dragx = e.offsetX;
                tilemap.dragy = e.offsetY;
                tilemap.checkbounds();
                tilemap.draw();
            }
        }
        
        if(tilemap.mode == "measure"){
            measure.move(e.offsetX, e.offsetY);
            tilemap.draw();
        }

    }, 1000/30));
    
}

tilemap.setmode = function(newmode){
    tools[tilemap.mode].end();
    tools[newmode].begin();
    tilemap.mode = newmode;
}

tilemap.resize = _.debounce(function(){
                         
    tilemap.container.height($(window).height() - tilemap.container.position().top - 25);   
    
    var c = $("#canvas");
    
    tilemap.canvas[0].width = tilemap.container.width();
    tilemap.canvas[0].height = tilemap.container.height();   

    tilemap.onresize();
    tilemap.populate();
    tilemap.draw();

}, 100);


tilemap.populate = function(){ console.log("Implement tilemap.populate");}
tilemap.draw = function(){ console.log("Implement tilemap.draw");}
tilemap.onresize = function(){ console.log("Implement tilemap.onresize");}
tilemap.checkbounds = function(){ console.log("Implement tilemap.checkbounds");}
tilemap.onzoom = function(){ console.log("Implement tilemap.onzoom");}

