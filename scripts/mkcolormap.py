#!/usr/bin/env python
#-*- coding:utf-8 -*-

import pylab as p
import json

cmaps = [p.cm.gist_gray, p.cm.hsv, p.cm.jet, p.cm.gist_heat, p.cm.bone, p.cm.autumn, p.cm.copper, p.cm.prism, p.cm.pink]

out = {}
names = []
for fn in cmaps:
    colors = map(lambda x: fn(x, bytes=True), range(0,256))
    #colors = [(x[3]   << 24) |  (x[2] << 16) | (x[1] <<  8) |  x[0] for x in colors]
    out[fn.name] = colors
    names.append(fn.name)
    
out["names"] = names

print "var colormaps = " + json.dumps(out, default=int) + ";"
