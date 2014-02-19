Array.max = function(array){
    return Math.max.apply( Math, array );
};

Array.min = function(array){
    return Math.min.apply( Math, array );
};


Array.prototype.sum = function() {
  return (! this.length) ? 0 : this.slice(1).sum() +
      ((typeof this[0] == 'number') ? this[0] : 0);
};

Number.round = function(num, dec) {
    return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
}

util = {};

util.arrayToString = function(data){
    var uintData = new Uint8Array(data);
    var stringData = ""
    for(var i=0; i<uintData.length; i++){
        stringData += String.fromCharCode(uintData[i]);
    }
    return stringData;
}

util.get_nearest_index = function(val, arr){

    var ci = 0;
    var cd = Math.abs(val-arr[0]);

    for(var i = 1;i < arr.length; i++){          
        if(cd > Math.abs(val-arr[i])){
            ci = i;
            cd = Math.abs(val-arr[i]);
        }
    }
    return ci;
}

util.get_double_nearest_index = function(val1, arr1, val2, arr2){

    var ci = 0;
    var cd = Math.sqrt(Math.pow(val1-arr1[0], 2) + Math.pow(val2-arr2[0], 2));

    for(var i = 1;i < arr1.length; i++){          
        if(cd > Math.sqrt(Math.pow(val1-arr1[i], 2) + Math.pow(val2-arr2[i], 2))){
            ci = i;
            cd = Math.sqrt(Math.pow(val1-arr1[i], 2) + Math.pow(val2-arr2[i], 2));
        }
    }
    return ci;
}

util.array_sum = function(a, b){
    c = a.slice(0);
    for(var i = 0; i < a.length; i++){
        c[i] += b[i];
    }
    return c;
}

util.array_add = function(a, b){
    c = a.slice(0);
    for(var i = 0; i < a.length; i++){
        c[i] += b;
    }
    return c;
}

util.array_subtract = function(a, b){
    c = a.slice(0);
    for(var i = 0; i < a.length; i++){
        c[i] -= b;
    }
    return c;
}

util.query_value = function(name)
{
  // from http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return null;
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}