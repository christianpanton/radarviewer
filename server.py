#!/usr/bin/env python
#-*- coding:utf-8 -*-

import os
import os.path

import static
import gevent

from geventwebsocket.handler import WebSocketHandler
from gevent import pywsgi
from gevent.baseserver import _tcp_listener
from gevent.monkey import patch_all; patch_all()
from multiprocessing import Process, cpu_count

import apps.radartile
import apps.wms

PORT = 8000

def app(env, resp):
    
    appmap = {
        "/data": apps.radartile.app,
        "/map": apps.wms.app,
    }

    for app in appmap:
        if env["PATH_INFO"] == app:
            return appmap[app](env, resp)

    return static.Cling('.')(env, resp)


def start_server(listener):
    pywsgi.WSGIServer(listener, app, handler_class=WebSocketHandler).serve_forever()

if __name__ == "__main__":
    listener = _tcp_listener(('0.0.0.0', PORT))

    for i in range(cpu_count()):
        Process(target=start_server, args=(listener,)).start()

    start_server(listener)
