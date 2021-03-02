
#**********************************
# Interpreter   => Python 3.7.x
# Framwork      => Flask Framework
#**********************************
# API works on TAGs (Wirepas API)
# Hanatech IOT Halifax, Canada
#**********************************

from flask import Blueprint, request, Response
from flask_jwt_extended import jwt_required, get_jwt_identity

import tag

bp = Blueprint(tag, __name__)

@bp.route('/get/location', methods=['GET'])
def get_location():
    print('\n====================== Request Type => GET')
    print('====================== Request path => /tag/get/location')
    return tag.get_location()