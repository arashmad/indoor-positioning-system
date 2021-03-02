#**********************************
# Interpreter   => Python 3.7.x
# Framwork      => Flask Framework
#**********************************
# Hanatech IOT Halifax, Canada
#**********************************

from flask import Flask, render_template
from gevent import monkey
monkey.patch_all()

from gevent.pywsgi import WSGIServer

from api_server import app

server = WSGIServer(('0.0.0.0', 8082), app)

with open("./wirepas_realtime_status.txt", 'w') as data:
    data.write('UNLOCKED')

try:
    print('\n')
    print('---------------------------------')
    print('Python + Flask is running on 8082')
    print('TAG data is now coming ...')
    print('---------------------------------')
    server.serve_forever()
    
except Exception as e:
    print('\n\n')
    print('---------------------------------')
    print('Running server failed because of')
    print(e)
    raise('Exit Code 0')
