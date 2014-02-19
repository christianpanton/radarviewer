#!/usr/bin/env python
#-*- coding:utf-8 -*-

import struct
import json

import numpy

from datapack import Packet


meta_cache = {}
data_cache = {}

def app(env, resp):
    ws = env['wsgi.websocket']
    while True:
        request = ws.receive()
        if request is not None:
            request = json.loads(request)
            cmd = request["cmd"]
            args = request["args"]
            data = rpcfun[cmd](*args)
            if data:
                ws.send(data, binary=True)                    
        else:
            break

def get_meta(flightline, zoom):
    global meta_cache
    k = "%s/%d" % (flightline, zoom)
    if k not in meta_cache:
        meta_cache[k] = numpy.load(file('data/%s/%d.meta' % (flightline, zoom), 'r'))
    return meta_cache[k]

def get_data(flightline, zoom):
    global data_cache
    meta = get_meta(flightline, zoom)

    k = "%s/%d" % (flightline, zoom)
    if k not in data_cache:
        data_cache[k] = numpy.memmap('data/%s/%d.data' % (flightline, zoom), dtype='float32', mode='r', shape=(meta["height"],meta["length"]), order='f')
    return data_cache[k]


def tile(flightline, x, y, zoom = 0, tilesize=256):
    
    x = int(x)
    y = int(y)
    
    if x < 0 or y < 0:
        return
    
    zoom = int(zoom)
    tilesize = int(tilesize)
    
    slize = get_data(flightline, zoom)[y:y+tilesize, x:x+tilesize]
    
    p = Packet("tile")
    
    p.addHeader("flightline", flightline)
    p.addHeader("zoom", zoom)
    p.addHeader("x", x)
    p.addHeader("y", y)
    p.addHeader("tilesize", tilesize)
    p.addHeader("height", slize.shape[0])
    p.addHeader("width", slize.shape[1])
    
    p.addData("tile", slize.ravel().tolist())
    
    return p.serialize()
    
def metadata(flightline, zoom = 0):
    
    p = Packet("metadata")

    meta = get_meta(flightline, zoom)
    
    p.addHeader("flightline", flightline)
    p.addHeader("zoom", zoom)
    p.addHeader("height", int(meta["height"]))
    p.addHeader("length", int(meta["length"]))
    p.addHeader("credit", unicode(meta["credit"]))
    p.addHeader("zoommax", int(meta["zoommax"]))

    p.addData("depth", meta["depth"])
    p.addData("latitude", meta["latitude"])
    p.addData("longitude", meta["longitude"])
    p.addData("distance_along_track", meta["distance"])
    
    p.addHeader("elevation_offset", {"max": int(meta["elevation_offset_max"]), "min": int(meta["elevation_offset_min"])})
    p.addData("elevation_offset", meta["elevation_offset"], "i")
    
    return p.serialize()
    
    
rpcfun = {"tile": tile, "metadata": metadata}