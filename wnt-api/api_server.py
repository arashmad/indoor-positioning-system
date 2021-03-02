#**********************************
# Interpreter   => Python 3.7.x
# Framwork      => Flask Framework
#**********************************
# Hanatech IOT Halifax, Canada
#**********************************

from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS, cross_origin

import api

app = Flask(__name__, static_url_path='')
cors = CORS(app, resources={r"/*": {"origins":"*"}})
CORS(app)

app.register_blueprint(api.tag_api.bp, url_prefix="/tag")
