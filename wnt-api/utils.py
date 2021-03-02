
#**********************************
# Interpreter   => Python 3.7.x
# Framwork      => Flask Framework
#**********************************
# Hanatech IOT Halifax, Canada
#**********************************

import os
import time

def open_socket():
    try:
        os.system('python ./backend_apis_master/wrappers/python/examples/wnt/realtimedata.py')
        return {'err':'False'}
    except Exception as e:
        return {'err':True, 'msg':e}


def read_locations():
    f = open("./wirepas_tags_msg.txt", "r")
    return f.read().split('\n')

    # wait = True
    # while wait:
    #     wirepas_status = check_wirepas_status()
    #     if wirepas_status != 'LOCKED':
    #         wait = False
    #         f = open("./wirepas_tags_msg.txt", "r")
    #         return f.read().split('\n')


def check_wirepas_status():
    f = open("./wirepas_realtime_status.txt", "r")
    return f.read()