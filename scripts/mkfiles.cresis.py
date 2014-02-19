#!/usr/bin/env python
#-*- coding:utf-8 -*-

import os
import struct
import numpy
import scipy.io
import scipy.signal
import sys
import h5py

savekeys = ("GPS_time", "Bottom", "Surface", "Elevation", "Longitude", "Latitude")
zoomlevels = [0, 1, 2, 3, 4, 5]

def zoomrule(zoom):
    return (pow(2, zoom), 1 + zoom*0.25)

from math import radians, cos, sin, asin, sqrt

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    FROM: http://stackoverflow.com/questions/4913349/haversine-formula-in-python-bearing-and-distance-between-two-gps-points
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    m = 6.367e6 * c
    return m

origdir = os.path.dirname(os.path.abspath(__file__))

for i in range(len(sys.argv)-1):

    if len(sys.argv) > 1:
        basedir = os.path.join(origdir, sys.argv[i+1])

    print "Using base:", basedir


    for zoom in zoomlevels:

        xrule, zrule = zoomrule(zoom)

        print "Processing ZOOM:", zoom
        print "-"*30

        # reset some values
        last_gps = 0
        offset = 0
        length = 0
        height = None
        column_counter = 0
        columnbuff = []
        metabuff = {}
        elevation_offsets = []

        directory = os.listdir(basedir)

        if(len(directory) == 0):
            print "Empty folder"
            continue

        data_file = file(os.path.join(basedir, "%d.data" % zoom), "wb+")
        meta_file = file(os.path.join(basedir, "%d.meta" % zoom), "wb+")

        save = {}

        for key in savekeys:
            save[key.lower()] = numpy.ndarray(shape=(0,0), dtype='float32')

        save["elevation_offset"] = numpy.ndarray(shape=(0,0), dtype='float32')

        for matfile in sorted(directory):
            
            if not matfile.endswith(".mat"):
                # not a mat-file
                continue

            if matfile.startswith("Data_img"):
                continue

            try:    
                mat = scipy.io.loadmat(os.path.join(basedir, matfile))
            except:               
                h5 = h5py.File(os.path.join(basedir, matfile))
                mat = {}
                for key in h5.keys():
                    if key != "#refs#":
                        mat[key] = numpy.array(h5[key]).transpose()

            print "Processing", matfile
                
            # overlap from previous file, needs better treatment
            for index, gpstime in enumerate(mat["GPS_time"][0]):
                if gpstime < last_gps:
                    offset = index
         
            last_gps = gpstime

            # determine height of echogram info from first file
            if height is None:
                height = numpy.floor(mat["Data"].shape[0]/zrule)
                packer = struct.Struct("f"*height)
                save["height"] = height
                save["time"] = mat["Time"][0]*zrule
                save["depth"] = mat["Depth"][0]*zrule/(numpy.sqrt(3.15))
                pixel_height = numpy.mean(numpy.diff(mat["Depth"][0])) # in ice
                elevation_base = mat["Elevation"][0][0]

            buff = ""
            
            for index, column in enumerate(10*numpy.log10(mat["Data"].transpose()[offset:])):
                columnbuff.append(column)

                # generate mean value of savekeys for xrule
                for key in savekeys:

                    if key not in metabuff:
                        metabuff[key] = []

                    # pick out value of point and add it to the averaging buffer
                    val  = mat[key][0,index+offset]
                    metabuff[key].append(val)

                    # save elevation offsets for correcting aggregate traces
                    if(key == "Elevation"): 
                        elevation_offsets.append(int(-(val- elevation_base)/pixel_height))
                    
                    
                    # for each xrule, generate the mean value for savekey
                    if column_counter % xrule  == 0 and column_counter > 0:

                        val = numpy.mean(metabuff[key])
                        save[key.lower()] = numpy.append(save[key.lower()], val)

                        if(key == "Elevation"):
                            mean_elevation_offset = int(-(val- elevation_base)/pixel_height)
                            save["elevation_offset"] = numpy.append(save["elevation_offset"], mean_elevation_offset/zrule)

                        
                # generate aggegate radar trace for xrule
                if column_counter % xrule  == 0 and column_counter > 0:
                    length += 1 
                    column = 0

                    # fix offset by rolling the vector
                    for i, c in enumerate(columnbuff):
                        dz = elevation_offsets[i]-mean_elevation_offset
                        c = numpy.roll(c, -dz)
                        column += c

                    column = column / float(xrule)

                    # resample to new zrule height
                    column = scipy.signal.resample(column, height)

                    buff += packer.pack(*column)

                    columnbuff = []
                    elevation_offsets = []
                    metabuff = {}
                
                column_counter += 1


            data_file.write(buff)

        

        save["length"] = length
        print "Total length:", length

        save["credit"] = "Data: CReSIS " + matfile[5:9]
        save["zoommax"] = zoomlevels[-1]

        distance = [0]
        
        print "Calc distance along track"
        for i in range(1, len(save["latitude"])):
            distance.append(distance[i-1] + haversine(save["latitude"][i-1], save["longitude"][i-1], save["latitude"][i], save["longitude"][i]))
        save["distance"] = distance

        save["elevation_offset_min"] = numpy.min(save["elevation_offset"])
        save["elevation_offset_max"] = numpy.max(save["elevation_offset"])

        numpy.savez(meta_file, **save)

        data_file.close()
        meta_file.close()
