#!/usr/bin/env python
#-*- coding:utf-8 -*-

import struct
import json

class Packet:
    
    def __init__(self, packettype):
        self.type = packettype
        self.header = {"type": packettype}
        self.metadata = []
        self.data = ""
        
    def addHeader(self, name, value):
        self.header[name] = value
        
    def addData(self, name, data, encoder="f"):
        tempdata = struct.pack(encoder*len(data), *data)    
        self.metadata.append((name, len(tempdata), len(data), encoder))
        self.data += tempdata
        
    def serialize(self):
        self.header["metadata"] = self.metadata
        header = json.dumps(self.header)
        headerlen = len(header)
        datalen = len(self.data)    
        lens = struct.pack("II", headerlen, datalen)
        return lens + header + self.data
        
        
