#!/usr/bin/env python
#-*- coding:utf-8 -*-

import mapscript

def app(env, resp):

    # Capture all output to a buffer, so we can send it via WSGI
    mapscript.msIO_installStdoutToBuffer()
    mapscript.msIO_installStdinFromBuffer()

    req = mapscript.OWSRequest()    

    if env["REQUEST_METHOD"] == "POST": 
        req.type = mapscript.MS_POST_REQUEST
        req.postrequest = env["wsgi.input"].read()
    else:
        req.loadParamsFromURL(env["QUERY_STRING"])
    
    url = "%s://%s%s" %  (env["wsgi.url_scheme"], env["HTTP_HOST"], env["PATH_INFO"])
    map = mapscript.mapObj('map/master.map')
    map.setMetaData("wms_onlineresource", url)
    map.setMetaData("wfs_onlineresource", url)

    # Try to dispatch the request
    try:
        map.OWSDispatch(req)
    except Exception, e:
        print "Error:", e

    content_type = mapscript.msIO_stripStdoutBufferContentType()
    content = mapscript.msIO_getStdoutBufferBytes()

    resp('200 OK', [('Content-type', content_type)])
    return [content]



"""    flight_class = mapscript.classObj()
    flight_style = mapscript.styleObj()

    for layername in ("test", ):
        layer = mapscript.layerObj()
        layer.set("name", layername)
        layer.set("type", mapscript.MS_LAYER_LINE)
        layer.metadata.set('wfs_title', layername)
        layer.metadata.set('wfs_srs', 'EPSG:4326')
        layer.metadata.set('gml_include_items', 'all')
        layer.metadata.set('gml_featureid', 'ID')
        layer.metadata.set('wfs_enable_request', '*')

        layer_class = map.getLayer(layer).insertClass(new_class)
        layer_style = map.getLayer(layer).getClass(layer_class).insertStyle(new_style)

        map.insertLayer(layer)

        shape = mapscript.shapeObj(mapscript.MS_SHAPE_LINE)
        line = mapscript.lineObj()

        for (x,y) in ((-47,79), (-51, 80)):
            point = mapscript.pointObj()
            point.x = x
            point.y = y
            line.add(p)

        shp.add(line)
        shp.set("text", layername)
        layer.addFeature(shp)"""
    