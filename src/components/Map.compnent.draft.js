// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


// problem in CORS
// Solution:
// go to <geoserver home>\webapps\geoserver\WEB-INF\lib
// open weeb.xml
// uncomment these two parts:
// 1) <filter><filter-name>cross-origin</filter-name>...
// 2) <filter-mapping><filter-name>cross-origin</filter-name>...



import React, { Component } from 'react';
import axios from 'axios';
import L from 'leaflet';

import { server } from '../asset/js/config';
import 'leaflet/dist/leaflet.css';
import positioningProto from "../asset/protos/positioning.proto"
import messageProto from "../asset/protos/message.proto"

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Alert from '@material-ui/lab/Alert';
import Tooltip from '@material-ui/core/Tooltip';
import Link from '@material-ui/core/Link';

import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';

import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import AddIcon from '@material-ui/icons/Add';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import CloseIcon from '@material-ui/icons/Close';
import SyncIcon from '@material-ui/icons/Sync';
import MyLocationIcon from '@material-ui/icons/MyLocation';
import HelpIcon from '@material-ui/icons/Help';

class Map extends Component {

   constructor(props) {
      super(props);
      this.state = {
         defaultLayerName: '',
         helpVisibility: false,
         selectedRoom: {
            feature: '',
            properties: []
         },
         layers: [],
         baseLayers: {
            mapboxLayer1: L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
               id: 'mapbox/light-v9',
               attribution: 'MapBox &copy; <a href="https://hanatech.ca/">Hanatech</a>'
            }),
            mapboxLayer2: L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
               attribution: 'MapBox &copy; <a href="https://hanatech.ca/">Hanatech</a>',
               id: 'mapbox/streets-v11'
            }),
            osmLayer: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
               attribution: 'OSM &copy; <a href="https://hanatech.ca/">Hanatech</a>',
            })
         },
         buildingLayers: {},
         assets: [],
         assetLayer: {},
         featueStyles: {
            defaultPolygon: { fillColor: '#009688', fillOpacity: 0.3, color: '#000', opacity: 1, weight: 1 },
            selectedPolygon: { fillColor: '#3f51b5', fillOpacity: 1, color: '#3f51b5', opacity: 1, weight: 2 },
            hoverPolygon: { fillColor: '#3f51b5', fillOpacity: 1, color: '#3f51b5', opacity: 1, weight: 2 },
            nonePoint: { radius: 0, fillColor: "#fff", fillOpacity: 0, color: "#fff", opacity: 0, weight: 0 },
            defaultPoint: { radius: 6, fillColor: "#ff9800", fillOpacity: 1, color: "#444", weight: 1 },
            selectedPoint: { radius: 8, fillColor: "#f44336", fillOpacity: 1, color: "#000", weight: 3 },
            hoverPoint: { radius: 8, fillColor: "#f44336", fillOpacity: 1, color: "#000", weight: 3 }
         },
         mapCenter: [0, 0],
         mapZoom: 3,
         mapObject: null,
         dialogbox: {
            dialogVisibility: false,
            dialogType: '',         //newLayer, editLayer, deleteLayer
            oldMapLayerName: '',
            newMapLayerName: '',
            dialogDeleteName: '',
            mapFilePath: '',
            mapFile: ''
         },
         appToast: {
            toastShow: false,
            toastType: 'success', //error , //success //info
            toastMessage: '',
         },
      }
   };

   componentWillMount() {
      console.info('<<<< Map Component Will Mount >>>>.');
      this.getBuildingNames()
         .then(() => {
            this.state.layers.map(layerName => {
               this.getBuildingFeatures(layerName)
                  .then(() => {
                     if (Object.keys(this.state.buildingLayers).length == this.state.layers.length) {
                        const { defaultLayerName } = this.state
                        const geoJSONPlanData = this.state.buildingLayers[defaultLayerName];
                        const geoJSONPlanStyle = this.state.featueStyles.defaultPolygon;
                        var geoJSONPlanLayer = this._createGeojsonLayer(geoJSONPlanData, geoJSONPlanStyle, defaultLayerName);

                        geoJSONPlanLayer.on('click', this._onMapClick);
                        geoJSONPlanLayer.on('mouseover', this._onMapHoverIn);
                        geoJSONPlanLayer.on('mouseout', this._onMapHoverOut);

                        this.createMap([geoJSONPlanLayer])
                           .then(map => {
                              map.fitBounds(geoJSONPlanLayer.getBounds());
                              this._updateMap(map);
                           })
                     };
                  })
                  .catch(error => {
                     this.createMap()
                     this._onToastOpen('error', error)
                  });
            });
         })
         .catch(error => {
            this.createMap()
            this._onToastOpen('error', error)
         });
   }

   componentDidMount() {
      this.getAssets();
      // this.getAssets2();
   }

   createMap = (layers) => new Promise((resolve, reject) => {
      const { mapObject } = this.state;
      if (mapObject) {
         mapObject.off();
         mapObject.remove();
         this.setState({
            mapObject: null
         })
      }
      const { osmLayer, mapboxLayer1, mapboxLayer2 } = this.state.baseLayers;
      if (Array.isArray(layers))
         layers = layers.concat([mapboxLayer2])
      else
         layers = [].concat([mapboxLayer2])

      const map = L.map('mapContainer', {
         center: this.state.mapCenter,
         zoom: this.state.mapZoom,
         zoomControl: false,
         layers: layers
      });
      this.setState({
         mapObject: map
      }, () => {
         resolve(map)
      });
   })

   getBuildingNames = () => new Promise((resolve, reject) => {
      const getLayersRequest = `${server.rootDirectory.root}${server.rootDirectory.subDirectory.root}${server.rootDirectory.subDirectory.subDirectory.layers}/`;
      this.setState({ defaultLayerName: '' })
      this.setState({ layers: [] })
      axios.get(getLayersRequest)
         .then(result => {
            if (result.data.err) {
               reject(result.data.msg)
            } else {
               if (!result.data.data.length) {
                  reject('Nothing to show. Add new one!')
               } else {
                  this.setState({
                     layers: result.data.data.map((layerName, id) => {
                        if (id == 0)
                           this.setState({ defaultLayerName: layerName })
                        return layerName
                     })
                  }, () => resolve())
               }
            }
         })
         .catch(error => {
            reject(error.message)
         })
   })

   getBuildingFeatures = (layerName) => new Promise((resolve, reject) => {
      const getFeatureRequest = `${server.rootDirectory.root}${server.rootDirectory.subDirectory.root}${server.rootDirectory.subDirectory.subDirectory.layers}/wfs/${layerName}`;
      axios.get(getFeatureRequest)
         .then(result => {
            if (result.data.err) {
               reject(result.data.msg)
            } else {
               const featureCollection = result.data.data;
               this.setState(prevState => ({
                  buildingLayers: {
                     ...prevState.buildingLayers,
                     [layerName]: featureCollection
                  }
               }), () => {
                  resolve(featureCollection)
               });
            }
         })
         .catch(error => { reject(error.message) })
   })

   login = () => new Promise((resolve, reject) => {
      const socketConfig = {
         url: "desklinx.extwirepas.com",
         port: "8813",
         user: "admin",
         pass: "BD061LhbDivc4qQimy0sQ8hb5St1nBfL"
      }
      const loginURL = `wss://${socketConfig.url}:${socketConfig.port}`;
      try {
         const loginSocket = new WebSocket(loginURL);
         loginSocket.onopen = (event) => {
            console.log(`Login Socket => ${event.type}`)
            const loginData = {
               data: {
                  username: socketConfig.user,
                  password: socketConfig.pass,
               },
               type: 1,
               version: 4
            }
            loginSocket.send(JSON.stringify(loginData));
         }

         loginSocket.onmessage = function (event) {
            const message = event.data;
            const response = JSON.parse(message);
            const responseCode = response['result']
            const responseData = response['data']
            if (responseCode == 1) {
               resolve(responseData)
            } else {
               reject(`Login failed because of => Code : ${responseCode}`)
            }
         };
      } catch (error) {
         reject(`Login failed because of => Message : ${error}`)
      }
   })

   getAssets = () => new Promise((resolve, reject) => {
      this.login()
         .then(response => {
            const { role, session_id } = response
            const getAssetData = {
               session_id,
               version: 4
            }
            const socketConfig = {
               url: "desklinx.extwirepas.com",
               port: "8811"
            }
            const assetsURL = `wss://${socketConfig.url}:${socketConfig.port}`;
            try {
               const assetsSocket = new WebSocket(assetsURL);
               // assetsSocket.binaryType = "binaryType"
               assetsSocket.onopen = (event) => {
                  console.log(`assets Socket => ${event.type}`)
                  assetsSocket.send(JSON.stringify(getAssetData));
               }

               assetsSocket.onmessage = function (event) {
                  const blobMessage = event.data;
                  if (blobMessage instanceof Blob) {

                     var protobuf = require("protobufjs");
                     // var toBuffer = require('blob-to-buffer');


                     // blobMessage.arrayBuffer()
                     //    .then(bufferMessage => {
                     //       var uint8Message = new Uint8Array(bufferMessage);
                     //       protobuf.load(positioningProto)
                     //          .then(root => {
                     //             const testMessage = root.lookupType("wirepas.Query");
                     //             const decodedMessage = testMessage.decode(uint8Message);
                     //             console.log(decodedMessage)
                     //          })
                     //          .catch(error => {
                     //             console.log(error);
                     //          })
                     //    });

                     protobuf.load(positioningProto)
                        .then(root => {
                           const testMessage = root.lookupType("wirepas.Point");
                           const decodedMessage = testMessage.decode(new Uint8Array(blobMessage));
                           console.log(decodedMessage)
                        })
                        .catch(error => {
                           console.log(error);
                        })


                     // blobMessage.arrayBuffer().then(bufferMessage => {
                     //    var enc = new TextDecoder('base64');
                     //    var uint8Message = new Uint8Array(bufferMessage);
                     //    const message = enc.decode(uint8Message);

                     //    console.log(message);
                     // });

                     // toBuffer(message, function (err, buffer) {
                     //    if (err)
                     //       throw err

                     //    protobuf.load(positioningProto)
                     //       .then(root => {
                     //          const testMessage = root.lookupType("wirepas.Point");
                     //          const decodedMessage = testMessage.decode(buffer);
                     //          console.log(decodedMessage)
                     //       })
                     //       .catch(error => {
                     //          console.log(error);
                     //       })
                     // })

                     // protobuf.load(positioningProto)
                     //    .then(root => {
                     //       const testMessage = root.lookupType("wirepas.Point");
                     //       const decodedMessage = testMessage.decode(new Uint8Array(blobMessage));
                     //       console.log(decodedMessage)
                     //    })
                     //    .catch(error => {
                     //       console.log(error);
                     //    })

                     // message.text()
                     //    .then(messageText => {

                     // toBuffer(message, function (err, buffer) {
                     //    if (err)
                     //       throw err

                     //    const base64Decoded = protobuf.util.base64.decode(messageText, buffer)

                     // })
                     // const testMessage = root.lookupType("wirepas.Point");
                     // const decodedMessage = testMessage.decode(buffer);
                     // console.log(decodedMessage)
                     // });


                     // const reader = new FileReader();

                     // reader.onload = () => {
                     //    console.log("Result: " + reader.result);
                     // };

                     // reader.readAsText(message);

                  }
               }

               assetsSocket.onclose = () => {
                  setTimeout(() => {
                     console.log('Re-openning...')
                     this.getAssets()
                  }, 2000);
               }
            } catch (error) {
               reject(`Getting assets failed because of => Code : ${'!!!'}`)
            }
         })
         .catch(error => {
            this._onToastOpen('error', error)
         })
   })

   _refreshMap() {
      const { mapObject, defaultLayerName } = this.state;
      // if (this.state.layers.len)
      const defFeatures = this.state.buildingLayers[defaultLayerName];
      const defStyle = this.state.featueStyles.defaultPolygon;
      const defLayer = this._createGeojsonLayer(defFeatures, defStyle, defaultLayerName);
      mapObject.fitBounds(defLayer.getBounds());
   }

   _updateMap(_map) {
      if (!_map) {
         _map = this.state.mapObject;
      }

      const getFeatureRequest = `${server.rootDirectory.root}${server.rootDirectory.subDirectory.root}${server.rootDirectory.subDirectory.subDirectory.layers}/wfs/asset`;
      axios.get(getFeatureRequest)
         .then(result => {
            if (!result.data.data.features.length) {
               console.log('Hallo.')
               this._onToastOpen('error', result.data.msg);
            } else {
               var currentLevel = ''
               _map.eachLayer(layer => {
                  const feature = layer.feature;
                  if (feature) {
                     if (feature.label != 'asset') {
                        if (Object.keys(feature.properties).indexOf('level') >= 0) {
                           currentLevel = feature.properties.level;
                        }
                     }
                  }
               });
               const geoJSONAssetData = result.data.data;
               const geoJSONAssetStyle = this.state.featueStyles.defaultPoint;
               const geoJSONAssetLayer = L.geoJson(geoJSONAssetData, {
                  style: geoJSONAssetStyle,
                  pointToLayer: function (feature, latlng) {
                     if (feature.properties.level == currentLevel) {
                        return L.circleMarker(latlng, geoJSONAssetData);
                     }
                  },
                  onEachFeature: function (feature, layer) {
                     feature.label = 'asset'
                  }
               });

               if (geoJSONAssetData.features.length) {
                  _map.eachLayer(layer => {
                     const feature = layer.feature;
                     if (feature) {
                        if (feature.label == 'asset') {
                           layer.remove();
                        }
                     }
                  });
               }

               geoJSONAssetLayer.on('click', this._onMapClick);
               geoJSONAssetLayer.on('mouseover', this._onMapHoverIn);
               geoJSONAssetLayer.on('mouseout', this._onMapHoverOut);
               geoJSONAssetLayer.addTo(_map)

               this._onToastOpen('success', 'Locations of assets were updated.')
            }
         })
         .catch(error => {
            this._onToastOpen('error', error.message);
         })
   }

   _createGeojsonLayer = (data, style, name) => {
      const geomType = data.features[0].geometry.type.toLowerCase();
      if (geomType.indexOf('polygon') >= 0) {
         return L.geoJson(data, {
            style: style,
            onEachFeature: function (feature, layer) {
               feature.label = name
            }
         })
      } else if (geomType.indexOf('point') >= 0) {
         return L.geoJson(data, {
            style: style,
            pointToLayer: function (feature, latlng) {
               return L.circleMarker(latlng, data);
            },
            onEachFeature: function (feature, layer) {
               feature.label = name
            }
         });
      }
   }

   _onCloseDescription = () => {
      this.setState(prevState => ({
         selectedRoom: {
            ...prevState.selectedRoom,
            properties: []
         }
      }))

      const { mapObject } = this.state;
      const { defaultPolygon, defaultPoint } = this.state.featueStyles

      mapObject.eachLayer(function (layer) {
         const feature = layer.feature;
         if (feature) {
            if (feature.geometry.type.toLowerCase().indexOf('polygon') >= 0) {
               layer.setStyle(defaultPolygon);
            } else if (feature.geometry.type.toLowerCase().indexOf('point') >= 0) {
               layer.setStyle(defaultPoint);

            }
         }
      })
   }

   _onMapClick = (e) => {
      e.originalEvent.preventDefault();

      this._onCloseDescription()

      const _this = this;
      const { mapObject } = _this.state;
      const targetProperties = e.layer.feature.properties;
      const targetID = targetProperties.objectid;

      const targetLayerType = e.layer.feature.geometry.type.toLowerCase();
      const targetLayerLabel = e.layer.feature.label;

      var defaulStyle, selectedStyle;
      if (targetLayerType.indexOf('polygon') >= 0) {
         defaulStyle = this.state.featueStyles.defaultPolygon
         selectedStyle = this.state.featueStyles.selectedPolygon
      } else if (targetLayerType.indexOf('point') >= 0) {
         defaulStyle = this.state.featueStyles.defaultPoint
         selectedStyle = this.state.featueStyles.selectedPoint
      }

      mapObject.eachLayer(function (layer) {
         const feature = layer.feature;
         if (feature) {
            const featureID = feature.properties.objectid;
            if (featureID == targetID && feature.label == targetLayerLabel) {
               layer.setStyle(selectedStyle);

               var properties = [];
               Object.keys(targetProperties).map(property => {
                  properties.push([property, targetProperties[property]])
               });

               _this.setState(prevState => ({
                  selectedRoom: {
                     ...prevState.selectedRoom,
                     properties: properties
                  }
               }));
            } else {
               if (feature.label == targetLayerLabel) {
                  layer.setStyle(defaulStyle);
               }
            }
         }
      })
   }

   _onMapHoverIn = (e) => {
      if (this.state.selectedRoom.properties.length)
         return false;

      const { mapObject } = this.state;

      const targetLayerType = e.layer.feature.geometry.type.toLowerCase();
      // const targetLayerLabel = e.layer.feature.label;

      var hoverStyle;
      if (targetLayerType.indexOf('polygon') >= 0) {
         hoverStyle = this.state.featueStyles.hoverPolygon
      } else if (targetLayerType.indexOf('point') >= 0) {
         hoverStyle = this.state.featueStyles.hoverPoint
      }

      mapObject.eachLayer(function (layer) {
         if (layer === e.layer) {
            layer.setStyle(hoverStyle);
            layer.bindTooltip('', {
               sticky: true,
               direction: 'top',
               offset: L.point([0, -10]),
               className: 'map-tooltip-style'
            })
            layer.setTooltipContent(`Name: ${e.layer.feature.properties.name} <br> ID: ${e.layer.feature.properties.objectid}`)
            layer.openTooltip();
            return true;
         }
      })
   }

   _onMapHoverOut = (e) => {
      if (this.state.selectedRoom.properties.length)
         return false;

      const { mapObject } = this.state;

      const targetLayerType = e.layer.feature.geometry.type.toLowerCase();
      // const targetLayerLabel = e.layer.feature.label;

      var defaultStyle;
      if (targetLayerType.indexOf('polygon') >= 0) {
         defaultStyle = this.state.featueStyles.defaultPolygon
      } else if (targetLayerType.indexOf('point') >= 0) {
         defaultStyle = this.state.featueStyles.defaultPoint
      }

      mapObject.eachLayer(function (layer) {
         if (layer === e.layer) {
            layer.setStyle(defaultStyle);
            layer.unbindTooltip();
            layer.closeTooltip();
            return true;
         }
      });
   }

   _toggleLayer = (e) => {
      const layerName = e.target.value;
      const geoJSONData = this.state.buildingLayers[layerName];
      const geoJSONStyle = this.state.featueStyles.defaultPolygon;
      var activeLayer = this._createGeojsonLayer(geoJSONData, geoJSONStyle, layerName);

      var { mapObject } = this.state;
      mapObject.eachLayer(function (layer) {
         if (layer.feature) {
            mapObject.removeLayer(layer);
         };
      });

      this._updateMap(mapObject);

      activeLayer.addTo(mapObject);
      mapObject.fitBounds(activeLayer.getBounds());
      activeLayer.on('click', this._onMapClick);
      activeLayer.on('mouseover', this._onMapHoverIn);
      activeLayer.on('mouseout', this._onMapHoverOut);
      this.setState({
         defaultLayerName: layerName
      });
      this.setState(prevState => ({
         selectedRoom: {
            ...prevState.selectedRoom,
            properties: []
         }
      }))
   }

   _onDialogOpen = (e, dialogType, dialogDeleteName) => {
      e.preventDefault();
      this.setState(prevState => ({
         dialogbox: {
            ...prevState.dialogbox,
            dialogVisibility: true,
            dialogType: dialogType,
            dialogDeleteName: dialogDeleteName ? dialogDeleteName : ""
         }
      }))
   }

   _onDialogClose = () => {
      this.setState(prevState => ({
         dialogbox: {
            ...prevState.dialogbox,
            dialogVisibility: false,
            dialogType: '',
            oldMapLayerName: '',
            newMapLayerName: '',
            mapFilePath: '',
            mapFile: ''
         }
      }))
   }

   _onToastOpen = (type, message) => {
      this.setState({
         appToast: {
            toastShow: true,
            toastType: type,
            toastMessage: message,
         }
      }, () => {
         setTimeout(() => {
            this._onToastClose();
         }, 8000);
      })
   }

   _onToastClose = () => {
      this.setState(prevState => ({
         appToast: {
            toastShow: false,
            toastType: 'success',
            toastMessage: '',
         }
      }))
   }

   _onHelpOpen = () => {
      this.setState({
         helpVisibility: true
      })
   }

   _onHelpClose = () => {
      this.setState({
         helpVisibility: false
      })
   }

   _onHandleInputFile = (e) => {
      const fileName = e.target.value;
      const fileContent = e.target.files[0];
      this.setState(prevState => ({
         dialogbox: {
            ...prevState.dialogbox,
            mapFilePath: fileName,
            mapFile: fileContent
         }
      }))
   }

   _onHandleInputText = (e) => {
      const name = e.target.value;
      const { dialogType } = this.state.dialogbox;
      switch (dialogType) {
         case 'newLayer':
            this.setState(prevState => ({
               dialogbox: {
                  ...prevState.dialogbox,
                  newMapLayerName: name,
               }
            }))
            break;
         case 'editLayer':
            this.setState(prevState => ({
               dialogbox: {
                  ...prevState.dialogbox,
                  oldMapLayerName: name
               }
            }))
            break;
      }
   }

   _onSubmitForm = (e) => {
      e.preventDefault();
      const dialogType = this.state.dialogbox.dialogType;
      switch (dialogType) {
         case 'newLayer':

            var _name = this.state.dialogbox.newMapLayerName;
            var _file = this.state.dialogbox.mapFile;
            const data = new FormData();
            data.append("name", _name);
            data.append("file", _file);

            if (_name && _file) {
               this._onDialogClose();
               const uploadURL = `${server.rootDirectory.root}${server.rootDirectory.subDirectory.root}${server.rootDirectory.subDirectory.subDirectory.add}/`;
               axios({ method: "POST", url: uploadURL, data: data })
                  .then((result) => {
                     if (result.status == 200) {
                        this._onToastOpen('success', 'New layer was added to map successfully.');
                     } else {
                        this._onToastOpen('error', 'Error in adding new layer.');
                     }
                     this.getBuildingNames()
                        .then(() => {
                           this.getBuildingFeatures(_name)
                              .then(() => {
                                 const { defaultLayerName } = this.state
                                 const geoJSONPlanData = this.state.buildingLayers[defaultLayerName];
                                 const geoJSONPlanStyle = this.state.featueStyles.defaultPolygon;
                                 var geoJSONPlanLayer = this._createGeojsonLayer(geoJSONPlanData, geoJSONPlanStyle, defaultLayerName);

                                 geoJSONPlanLayer.on('click', this._onMapClick);
                                 geoJSONPlanLayer.on('mouseover', this._onMapHoverIn);
                                 geoJSONPlanLayer.on('mouseout', this._onMapHoverOut);

                                 this.createMap([geoJSONPlanLayer])
                                    .then(map => {
                                       map.fitBounds(geoJSONPlanLayer.getBounds());
                                       this._updateMap(map);
                                    })
                              })
                              .catch(error => {
                                 this.createMap()
                                 this._onToastOpen('error', error)
                              })
                        })
                        .catch(error => {
                           this.createMap()
                           this._onToastOpen('error', error)
                        });
                  })
                  .catch(error => this._onToastOpen('error', error.message))
            }

            break;

         case 'deleteLayer':
            this._onDialogClose();
            const layerName = this.state.dialogbox.dialogDeleteName;
            const deleteURL = `${server.rootDirectory.root}${server.rootDirectory.subDirectory.root}/${layerName}`;
            axios({ method: "DELETE", url: deleteURL })
               .then((result) => {
                  if (result.status == 200) {
                     this._onToastOpen('success', 'Layer was deleted successfully.');
                     this.setState(prevState => ({
                        buildingLayers: {
                           ...prevState.buildingLayers,
                           [layerName]: undefined
                        },
                     }), () => {
                        this.getBuildingNames()
                           .then(() => {
                              this.getBuildingFeatures(this.state.defaultLayerName)
                                 .then(() => {
                                    const { defaultLayerName } = this.state
                                    const geoJSONPlanData = this.state.buildingLayers[defaultLayerName];
                                    const geoJSONPlanStyle = this.state.featueStyles.defaultPolygon;
                                    var geoJSONPlanLayer = this._createGeojsonLayer(geoJSONPlanData, geoJSONPlanStyle, defaultLayerName);

                                    geoJSONPlanLayer.on('click', this._onMapClick);
                                    geoJSONPlanLayer.on('mouseover', this._onMapHoverIn);
                                    geoJSONPlanLayer.on('mouseout', this._onMapHoverOut);

                                    this.createMap([geoJSONPlanLayer])
                                       .then(map => {
                                          map.fitBounds(geoJSONPlanLayer.getBounds());
                                          this._updateMap(map);
                                       })
                                 })
                                 .catch(error => {
                                    this.createMap()
                                    this._onToastOpen('error', error)
                                 });
                           })
                           .catch(error => {
                              this.createMap()
                              this._onToastOpen('error', error)
                           });
                     })
                  } else {
                     this._onToastOpen('error', 'Error in deleting layer.');
                  }
               })
               .catch(error => {
                  this._onToastOpen('error', 'Error in deleting layer.');
               })
            break;

         case 'editLayer':
            // send request edit existing layer
            break;
      }
   }

   render() {
      const { defaultLayerName, helpVisibility } = this.state;
      const { properties } = this.state.selectedRoom;
      const { dialogVisibility, dialogType, mapFilePath, newMapLayerName, oldMapLayerName } = this.state.dialogbox;
      const { toastShow, toastType, toastMessage } = this.state.appToast;
      const templateFileLink = `${server.rootDirectory.root}${server.rootDirectory.file}`

      // console.log(this.state.assets)

      return (
         <div>
            <Alert
               style={toastShow ? styles.toast.root : { display: 'none' }}
               onClose={() => this._onToastClose()}
               severity={toastType}>
               {toastMessage}
            </Alert>
            <div style={styles.ListLayer.root}>
               <div style={styles.ListLayer.header}>
                  <Typography variant="overline" display="block">List of layers</Typography>
               </div>
               <div style={styles.ListLayer.list}>
                  <FormControl component="fieldset">
                     <RadioGroup aria-label="layer" name="layer" value={defaultLayerName} onChange={(e) => this._toggleLayer(e)}>
                        {
                           this.state.layers.length
                              ?
                              this.state.layers.map((item, id) => (
                                 <div style={styles.ListLayer.item} key={id} >
                                    <FormControlLabel value={item} control={<Radio />} label={item} />
                                    <IconButton aria-label="add" size="small" onClick={(e) => this._onDialogOpen(e, 'deleteLayer', item)}>
                                       <DeleteForeverIcon />
                                    </IconButton>
                                 </div>
                              ))
                              :
                              <Typography variant="overline" display="block" gutterBottom>Nothing to show! Add new one.</Typography>
                        }
                     </RadioGroup>
                  </FormControl>
               </div>
            </div>
            <div style={styles.MapController.root}>
               <Tooltip placement="left" title="Update Map">
                  <IconButton
                     aria-label="update map"
                     size="small"
                     style={styles.MapController.iconButton1}
                     onClick={() => this._updateMap()}>
                     <SyncIcon />
                  </IconButton>
               </Tooltip>
               <div style={{ margin: '8px 0' }}></div>
               <Tooltip placement="left" title="Zoom to Extent Map">
                  <IconButton
                     aria-label="refresh map"
                     size="small"
                     style={styles.MapController.iconButton1}
                     onClick={() => this._refreshMap()}>
                     <MyLocationIcon />
                  </IconButton>
               </Tooltip>
               <div style={{ margin: '8px 0' }}></div>
               <Tooltip placement="left" title="Add New Map">
                  <IconButton
                     aria-label="update map"
                     size="small"
                     style={styles.MapController.iconButton2}
                     onClick={(e) => this._onDialogOpen(e, 'newLayer')}>
                     <AddIcon />
                  </IconButton>
               </Tooltip>
               <div style={{ margin: '8px 0' }}></div>
               <Tooltip placement="left" title="Help">
                  <IconButton
                     aria-label="help"
                     size="small"
                     style={styles.MapController.iconButton3}
                     onClick={this._onHelpOpen}>
                     <HelpIcon />
                  </IconButton>
               </Tooltip>
            </div>
            <div style={properties.length ? styles.Description.rootShow : styles.Description.rootHide}>
               <div style={styles.Description.header}>
                  <Typography variant="button">Descriptions</Typography>
                  <IconButton aria-label="add" size="small"
                     onClick={(e) => this._onCloseDescription(e)}>
                     <CloseIcon />
                  </IconButton>
               </div>
               <div style={styles.Description.list}>
                  {
                     properties.map((item, id) => (
                        <Typography variant="overline" display="block" key={id} style={styles.Description.item}>{`${item[0]} : ${item[1]}`}</Typography>
                     ))
                  }
               </div>
            </div>
            <div id='mapContainer' style={{ width: this.props.mapW, height: this.props.mapH }}></div>
            <Dialog
               open={dialogVisibility}
               onClose={this._onDialogClose}
               aria-labelledby="alert-dialog-title"
               aria-describedby="alert-dialog-description">
               <DialogTitle id="alert-dialog-title">
                  {
                     dialogType == 'newLayer' ? "Add New Layer"
                        :
                        dialogType == 'editLayer' ? "Edit Current Layer"
                           :
                           "Delete Layer"
                  }
               </DialogTitle>
               <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                     {
                        dialogType == 'newLayer' ? "Please input a name for new layer:"
                           :
                           dialogType == 'editLayer' ? "Please chooses new name for this layer:"
                              :
                              dialogType == 'deleteLayer' ? "Do you want to delete this layer?"
                                 :
                                 ""
                     }
                  </DialogContentText>
                  {
                     dialogType == 'newLayer' ?
                        <div>
                           <TextField
                              placeholder="map layer name..."
                              type="text"
                              margin="normal"
                              required
                              fullWidth
                              value={(dialogType == 'newLayer') ? newMapLayerName : oldMapLayerName}
                              onChange={(e) => this._onHandleInputText(e)} />
                           <input
                              accept=".zip"
                              id="contained-button-file"
                              capture="camcorder"
                              type="file"
                              style={{ display: 'none' }}
                              value={mapFilePath}
                              onChange={(e) => this._onHandleInputFile(e)} />
                           <label htmlFor="contained-button-file">
                              <Button
                                 variant="contained"
                                 color="primary"
                                 component="span"
                                 startIcon={<AttachFileIcon />}>
                                 Attach .zip File
                              </Button>
                           </label>
                        </div>
                        :
                        <span></span>
                  }
               </DialogContent>
               <DialogActions>
                  <Button onClick={this._onDialogClose} color="primary" autoFocus>
                     Cancel
                  </Button>
                  <Button onClick={(e) => this._onSubmitForm(e)} color="primary" autoFocus>
                     {
                        dialogType == 'newLayer' ? "add layer"
                           :
                           dialogType == 'editLayer' ? "edit layer"
                              :
                              dialogType == 'deleteLayer' ? "Delete Layer"
                                 :
                                 ""
                     }
                  </Button>
               </DialogActions>
            </Dialog>
            <Dialog
               open={helpVisibility}
               onClose={this._onHelpClose}
               aria-labelledby="alert-dialog-title"
               aria-describedby="alert-dialog-description">
               <DialogTitle id="alert-dialog-title">
                  About Map Layer
               </DialogTitle>
               <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                     There is no limit to add map file to base map.<br />
                     But this application only supports <span style={{ fontWeight: 'bold', fontStyle: "italic" }}> ESRI </span> file as map file.<br />
                     In order to add new layer, you need to use a <span style={{ fontWeight: 'bold', fontStyle: "italic" }}>ZIP</span> file containing
                     <span style={{ fontWeight: 'bold', fontStyle: "italic" }}>.shp</span>,
                     <span style={{ fontWeight: 'bold', fontStyle: "italic" }}>.shx</span>,
                     <span style={{ fontWeight: 'bold', fontStyle: "italic" }}>.dbf</span> and
                     <span style={{ fontWeight: 'bold', fontStyle: "italic" }}>.prj</span><br /><br />
                     You can download a template map file <a href={templateFileLink} >Here</a>
                  </DialogContentText>
               </DialogContent>
               <DialogActions>
                  <Button color="primary" autoFocus onClick={this._onHelpClose} >
                     Close
                  </Button>
               </DialogActions>
            </Dialog>
         </div >
      )
   }
}

const styles = {
   ListLayer: {
      root: {
         position: 'absolute',
         // minWidth: '270px',
         top: '16px',
         left: '16px',
         backgroundColor: '#fff',
         zIndex: 1000,
         opacity: .9
      },
      header: {
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center',
         padding: '4px 16px',
         backgroundColor: '#2196f3'
      },
      list: {
         padding: '16px'
      },
      item: {
         display: 'flex',
         justifyContent: 'space-between'
      }
   },
   MapController: {
      root: {
         position: 'absolute',
         top: '16px',
         right: '16px',
         zIndex: 1000
      },
      iconButton1: {
         display: 'block',
         color: '#fff',
         backgroundColor: '#444'
      },
      iconButton2: {
         display: 'block',
         color: '#fff',
         backgroundColor: '#ff9800'
      },
      iconButton3: {
         display: 'block',
         color: '#000',
         backgroundColor: '#2196f3'
      }
   },
   Description: {
      rootHide: {
         display: 'none',
      },
      rootShow: {
         position: 'absolute',
         bottom: '16px',
         right: '16px',
         zIndex: 1000
      },
      header: {
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center',
         padding: '4px 16px',
         backgroundColor: '#2196f3'
      },
      list: {
         padding: '16px',
         backgroundColor: '#f0f0f0'
      },
      item: {
         display: 'block'
      },
   },
   toast: {
      root: {
         position: 'absolute',
         bottom: '16px',
         left: '16px',
         zIndex: 1000
      }
   }
};


export default Map;


