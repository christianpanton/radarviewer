#!/usr/bin/env python
#-*- coding:utf-8 -*-

import os
import os.path
import sys
import numpy

import shapefile

origdir = os.getcwd()

print origdir

w = shapefile.Writer(shapefile.POLYLINE)
w.field('Name', 'C', 50)

for i in range(len(sys.argv)-1):

    if len(sys.argv) > 1:
        basedir = os.path.join(origdir, sys.argv[i+1])

    flightline = os.path.basename(basedir)
    print "Processing flightline", flightline

    try:
        meta = numpy.load(file(os.path.join(basedir, "0.meta"), 'r'))

        parts = []
        for i, (lat, lon) in enumerate(zip(meta["latitude"], meta["longitude"])):
            if i % 100 == 0: parts.append((lon, lat))

        w.line(parts=[parts])
        w.record(flightline)
    except Exception, e:
        print "Failed"

w.save("flightline")