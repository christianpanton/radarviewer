// Polar Stereographic North
Proj4js.defs["EPSG:3413"] = "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";

var projection = new OpenLayers.Projection("EPSG:3413");
var displayProjection = new OpenLayers.Projection("EPSG:4326");

var map;
var position;
var options = {
    projection: projection,
    units: 'm',
    maxExtent: new OpenLayers.Bounds(-4194304,-4194304,4194304,4194304),
    restrictedExtent: new OpenLayers.Bounds(-4194304,-4194304,4194304,4194304),
    maxResolution: 6000,
    numZoomLevels: 12, 
    allOverlays: false,
    displayProjection: displayProjection,
    controls: [
        new OpenLayers.Control.Navigation(),
        new OpenLayers.Control.MousePosition({numDigits: 4}),
        new OpenLayers.Control.ScaleLine(),
        new OpenLayers.Control.LayerSwitcher()
    ]
};


function set_location(){
    // FIXME make nicer
    var x = Math.floor(tilemap.xoffset + radar.canvas.width/2);
    var lat = radar.latitude[x];
    var lon = radar.longitude[x];
    position.removeAllFeatures();
    position.addFeatures([new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lon, lat))]);
}


$(function(){
    map = new OpenLayers.Map('map', options);
    var baselayer = new OpenLayers.Layer.WMS("World", "/map", {
        layers: 'world',
        format: "image/png",
        transparent: "true"
    },  { isBaseLayer: true });

    var flights = new OpenLayers.Layer.Vector("Flights", {
            strategies: [new OpenLayers.Strategy.Fixed()],

            protocol: new OpenLayers.Protocol.WFS ({
                url:  "/map",
                srsName: "EPSG:3413",
                featureType: "flights",
                featurePrefix: null,
            }),
            visibility: true,
            styleMap: new OpenLayers.StyleMap({
                    "default": 
                        new OpenLayers.Style({
                            strokeColor: "#08d",
                            strokeWidth: 2,
                            graphicZIndex: -1
                        }),
                    "select": 
                        new OpenLayers.Style({
                            strokeColor: "#d00",
                            strokeWidth: 4,
                            graphicZIndex: 0
                        })
            })
    });

    var mosiac = new OpenLayers.Layer.WMS('Landsat-7 Mosaic',
        "http://icebridge.sr.unh.edu/cgi-bin/icebridge_grn_wms",
        {
            layers: 'mzl7geo',
            format: 'image/png'
        },{ visibility: false, isBaseLayer: false  });

    var velocity = new OpenLayers.Layer.WMS('Joughin SAR Velocity 2007',
        "http://icebridge.sr.unh.edu/cgi-bin/icebridge_grn_wms",
        {
            layers: 'sar_velocity_2007',
            alpha: 'true',
            format: 'image/png'
        },{ visibility: false, isBaseLayer: false });
    

    position = new OpenLayers.Layer.Vector("Position", {
        preFeatureInsert: function(feature) {
            feature.geometry.transform(displayProjection, projection);
        },
    });

    var selectControl = new OpenLayers.Control.SelectFeature([flights],
        {
            clickout: false, toggle: false,
            multiple: false, hover: false
        }
    );

    var mousePosition = new OpenLayers.Control.MousePosition();

    map.addLayer(baselayer);
    map.addLayer(mosiac);
    map.addLayer(velocity);
    map.addLayer(flights);
    map.addLayer(position);

    flights.events.on({
        "featureselected": function(e) {
            var flightline = e.feature.data.Name;
            var pos = map.getLonLatFromPixel(mousePosition.lastXy).transform(projection, displayProjection); // hacky
            if (flightline != radar.flightline) { 
                radar.goto_flightline(flightline); 
            }
            _.delay(radar.goto_latlon, 1000, pos.lat, pos.lon);
        },
    });

    map.addControl(selectControl);
    map.addControl(mousePosition);
    selectControl.activate();

    map.setCenter(new OpenLayers.LonLat(0,-2000000), 1);

});