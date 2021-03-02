
#**********************************
# Interpreter   => Python 3.7.x
# Framwork      => Flask Framework
#**********************************
# API works on TAGs (Wirepas API)
# Hanatech IOT Halifax, Canada
#**********************************

import os
import json
from flask import Response
from flask_api import status
from utils import check_wirepas_status, open_socket, read_locations

def get_location():
    try:
        wirepas_status = check_wirepas_status()
        
        if wirepas_status != 'UNLOCKED':
            locations = read_locations()
            return Response(
                json.dumps({'data': locations}),
                status=status.HTTP_200_OK,
                mimetype='application/json')
        
        if wirepas_status == 'UNLOCKED':
            socket_results = open_socket()
            if socket_results:
                locations = read_locations()
                return Response(
                    json.dumps({'data': locations}),
                    status=status.HTTP_200_OK,
                    mimetype='application/json')
            else:
                return Response(
                json.dumps({'msg': 'error running real time data script.'}),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                mimetype='application/json')

    except Exception as e:
        return Response(
            json.dumps({'msg':e}),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            mimetype='application/json')
