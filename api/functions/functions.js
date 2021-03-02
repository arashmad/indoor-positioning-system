// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


const request = require('request');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const decompress = require('decompress');


const PGService = require('../models/pg.db.model.js');
const { dbConfig, uploadConfig, geoserverConfig, TagIDs } = require('../config.js');


const createTableName = (name) => {
  return name.replace(/\s/g, "_");
}

const createDisplayName = (name) => {
  return name.replace(/\_/g, ' ');
}

const findInArrayOfDicts = (array, option) => {
  for (item of array) {
    if (item[option.key] === option.val) {
      return item;
    }
  }
}

const sortArrayofDicts = (property, order) => {
  var sortOrder = order === 'asc' ? 1 : -1;
  return function (a, b) {
    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  }
};

const dxfToGeojson = (dxfPath, callback) => {
  if (!dxfPath)
    callback({ path: null, msg: "The .dxf file not found!" });
  if (!fs.existsSync(dxfPath))
    callback({ path: null, msg: `The path <<${dxfPath}>> doesn't exist.` });

  const absPath = path.join(__dirname, "../");
  const fileName = dxfPath.split('/')[dxfPath.split('/').length - 1].split('.')[0];
  const dxfAbsPath = `${absPath}${uploadConfig.destination}/${fileName}.dxf`;
  const geojsonAbsPath = `${absPath}${uploadConfig.destination}/${fileName}.geojson`;
  const execCommand = `ogr2ogr -f GeoJSON ${geojsonAbsPath} ${dxfAbsPath}`

  exec(execCommand, (err, stdout, stderr) => {
    if (err) {
      callback({ path: null, msg: `dxfToGeojson => Error! => ${err}` });
    } else {
      callback({ path: geojsonAbsPath })
    }
  })

}

const geojsonToArray = (jsonObjectItems, parentKey, callback) => {
  if (!jsonObjectItems.length)
    callback({ err: 1, data: null, msg: 'geojsonToArray => Input json array is empty : []' });

  if (!parentKey)
    callback({ err: 1, data: null, msg: 'geojsonToArray => parentKey has not defined!' });

  var columns = {};
  var columnsName = Object.keys(jsonObjectItems[0][parentKey]);
  for (const name of columnsName) {
    columns[name] = [];
  }

  jsonObjectItems.map(item => {
    const itemkeys = Object.keys(item[parentKey]);
    for (const attKey of itemkeys) {
      columns[attKey].push(item[parentKey][attKey]);
    }
  });
  callback({ err: 0, data: columns });
}

const createSQLStatement = (dataObject, callback) => {
  if (dataObject.tbName && dataObject.columnNames.length && dataObject.columnTypes.length && dataObject.rowInsertion.length) {

    var createTableFields = 'gid serial, '
    dataObject.columnNames.map((name, index) => {
      createTableFields += `"${name}" ${dataObject.columnTypes[index]},`
    });
    createTableFields = createTableFields.slice(0, -1);

    var sqlString =
      `CREATE TABLE "${dbConfig.schema}"."${dataObject.tbName}" (${createTableFields});` +
      `ALTER TABLE "${dbConfig.schema}"."${dataObject.tbName}" ADD PRIMARY KEY (gid);` +
      `SELECT AddGeometryColumn('${dbConfig.schema}', '${dataObject.tbName}','geom','0','POLYGON',2);`

    dataObject.rowInsertion.map(item => {
      sqlString += item
    });
    callback({ err: 1, data: sqlString });
  } else {
    callback({ err: 1, data: null, msg: 'createSQLStatement => ERROR! => Input argument was not satisfied!' });
  }
}

const jsonToSQL = (tableName, geojsonObject, callback) => {

  const queryObejct = { tbName: tableName, columnNames: null, columnTypes: null, rowInsertion: [] };
  const features = geojsonObject.features;
  geojsonToArray(features, 'properties', result => {
    if (result.data) {
      const jsonColumns = result.data;
      const columnNames = Object.keys(jsonColumns);
      const columnValues = Object.values(jsonColumns);

      var columnTypes = [];
      columnValues.map(value => {
        const maxLength = value.sort(function (a, b) { return b.length - a.length; })[0];
        columnTypes.push(`varchar(${maxLength.length})`);
      });

      queryObejct['columnNames'] = columnNames;
      queryObejct['columnTypes'] = columnTypes;

      const pgEntity = new PGService();
      var rowInsertion = [];
      features.map((feature, index) => {

        const geometry = feature.geometry;
        const geomType = geometry.type.trim();
        const geomCoordinates = geometry.coordinates;

        let geometryString = '';
        geomCoordinates.map(geomTuple => {
          geometryString += `${geomTuple[0].toFixed(2)} ${geomTuple[1].toFixed(2)},`;
        })
        geometryString = geometryString.slice(0, -1);
        geometryString = `'${geomType.toUpperCase()}(${geometryString})'`;

        // linestring => "'LINESTRING(2.98 12.65,22.27 33.86,23.75 32.51,4.42 11.27,2.98 12.65)'"

        pgEntity.createPolygon(geometryString, result => {
          if (result.err) {
            callback({ err: 1, msg: 'jsonToSQL => ERROR! => Creating Pool!' });
          } else {
            const geomertyPolygon = result.polygon;
            const featureAttributes = feature.properties;
            const attributeKeys = Object.keys(featureAttributes);

            let attributeStringName = '';
            let attributeStringValue = '';
            attributeKeys.map(attributeName => {
              attributeStringName += `"${attributeName}",`
              attributeStringValue += `'${featureAttributes[attributeName]}',`
            });
            attributeStringName = attributeStringName.slice(0, -1);
            attributeStringValue = attributeStringValue.slice(0, -1);


            rowInsertion.push(`INSERT INTO "${dbConfig.schema}"."${tableName}" (${attributeStringName},geom) VALUES (${attributeStringValue},'${geomertyPolygon}');`)
            if (index == features.length - 1) {
              queryObejct['rowInsertion'] = rowInsertion
              createSQLStatement(queryObejct, result => {
                if (result.data) {
                  callback({ err: 0, data: result.data });
                } else {
                  callback({ err: 1, data: null, msg: 'jsonToSQL => ERROR! => Creating SQL Statement!' });
                }
              });
            }
          }

        })
      });

    } else {
      callback({ err: 1, msg: result.msg });
    }
  });
}

const isValidGeojson = (geojsonBuffer, callback) => {

  // geojson string is empty (?)
  if (!geojsonBuffer)
    callback({ err: 1, msg: 'Geojson Validation => Invalid => The geojson string is empty!' });

  // input parameter is nothing but string (?)
  // if (typeof geojsonString != "string")
  //   callback({ err: 1, msg: 'Geojson Validation => Invalid => Function only accept string as geojson!' });

  // try to parse geojson string to object
  try {
    const geojsonObject = JSON.parse(geojsonBuffer);
    const features = geojsonObject.features ? geojsonObject.features : [];

    // geojson object has no feature (?)
    if (features.length == 0)
      callback({ err: 1, msg: `Geojson Validation => Invalid => Geojson has no feature!` });


    features.map(feature => {

      // VALIDATION => geojson object doesn't have neccessaty attributes => ['properties'] and ['geometry'] (?)
      const featureKeys = Object.keys(feature);
      if (!featureKeys.includes('geometry') || !featureKeys.includes('properties'))
        callback({ err: 1, msg: `Geojson Validation => Invalid => Geojson's items don't have ['geometry'] and/or ['properties'].` });

      // VALIDATION => geojson object's geometry is empty => ['type'] and ['coordinate'] (?)
      const geometry = feature.geometry;
      var geometryKeys = Object.keys(geometry);
      if (!geometryKeys.includes('type') || !geometryKeys.includes('coordinates'))
        callback({ err: 1, msg: `Geojson Validation => Invalid => Geojson's geometry part doesn't have don't have ['type'] and/or ['coordinate'].` });

      // VALIDATION => geojson object's geometry has no coordinates (?)
      const geomType = geometry.type.trim();
      const geomCoordinates = geometry.coordinates;
      if (!geomCoordinates.length)
        callback({ err: 1, msg: `Geojson Validation => Invalid => Geojson's coordinate part is empty!` });

      // VALIDATION => geojson object's geometry type must be "LINESTRING"
      if (geomType.toUpperCase() != 'LINESTRING' && geomType.toUpperCase() != 'POLYGON')
        callback({ err: 1, msg: `Geojson Validation => Invalid => Geomerty type must be <<LINESTRING>> but it is ${geomType}.` });

      // VALIDATION => geojson object's geometry type must be a closed object => first coordinate must be repeated at last
      if (geomCoordinates[0][0] != geomCoordinates[geomCoordinates.length - 1][0] || geomCoordinates[0][1] != geomCoordinates[geomCoordinates.length - 1][1])
        callback({ err: 1, msg: `Geojson Validation => Invalid => Geomerty must be a closed object.` });

      // const featureAttributes = feature.properties;
      // const attributeKeys = Object.keys(featureAttributes);
      // if (!attributeKeys.includes('name')) {
      //   response.status(300).send({ err: true, msg: `API ERROR => <<.geojson>> is not valid as it's features' properties don't contain <<name>> used in database.` });
      // }
    })
    callback({ err: 0, data: geojsonObject });

  } catch (parseJsonError) {
    // failed to parse geojson string to parse => Invalid String
    callback({ err: 1, msg: `Geojson Validation => Invalid => Cannot be parsed => ${parseJsonError}!` })
  }


}

const getMapLayer = (_url, _type) => new Promise((resolve, reject) => {
  request({ url: _url, method: 'GET', }, (error, res, body) => {
    if (error) {
      if (error.code == 'ECONNREFUSED') {
        resolve({ responseCode: 200, msg: `Map server does not response: ${error.code}` })
      } else {
        reject({ responseCode: 500, msg: `Uknown Error => <<${error}>> error!` })
      }
    } else {
      const responseCode = res.statusCode;
      switch (_type) {
        case 'wms':
          resolve({ responseCode, data: body })
        case 'wfs':
          resolve({ responseCode, data: body })
        default:
          resolve({ responseCode, data: null })
      }
    }
  })
})

const deleteMapLayer = (_name) => new Promise((resolve, reject) => {

  var options = {
    url: `${geoserverConfig.endpoint}/workspaces/${geoserverConfig.workspace}/layers/${_name}`,
    method: 'DELETE',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json'
    },
    auth: {
      user: geoserverConfig.username,
      pass: geoserverConfig.password
    }
  }

  request(options, (err, res, body) => {
    const responseCode = res.statusCode;
    const statusMessage = res.statusMessage;
    if (err) {
      reject({ code: responseCode, msg: statusMessage })
    } else {
      if (responseCode == 200) {
        var options = {
          url: `${geoserverConfig.endpoint}/workspaces/${geoserverConfig.workspace}/featuretypes/${_name}`,
          method: 'DELETE',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          auth: {
            user: geoserverConfig.username,
            pass: geoserverConfig.password
          }
        }
        request(options, (err, res, body) => {
          const responseCode = res.statusCode;
          const statusMessage = res.statusMessage;
          if (err) {
            reject({ code: responseCode, msg: statusMessage })
          } else {
            if (responseCode == 200) {
              resolve({ code: responseCode, msg: `Layer <<${_name}>> was deleted successfully.` })
            } else {
              resolve({ code: responseCode, msg: statusMessage })
            }
          }
        })
        resolve({ code: responseCode, msg: `Layer <<${_name}>> was deleted successfully.` })
      } else {
        resolve({ code: responseCode, msg: statusMessage })
      }
    }
  })
})

const calculateExtent = (tableName, callback) => new Promise((resolve, reject) => {
  const execCommand = `SELECT ST_Extent(geom) as bextent FROM ${dbConfig.schema}.${tableName}`;
  const pgEntity = new PGService();
  pgEntity.createPool(poolObject => {
    if (poolObject.err) {
      reject(`calculateExtent => Couldn't create PG Pool object => ${poolObject.err}`);
    } else {
      poolObject.pool.query(execCommand, (queryError, queryResult) => {
        if (queryError) {
          reject(`calculateExtent => Run query error => ${queryError}`);
        } else {
          const BBX = queryResult.rows[0]['bextent'].match(/[+-]?\d+(\.\d+)?/g)
          const minX = BBX[0];
          const maxX = BBX[2];
          const minY = BBX[1];
          const maxY = BBX[3];
          resolve([minX, maxX, minY, maxY])
        }
      })
    }
  })
})

const publishLayerOnGeoserver = (layerName, layerExtent) => new Promise((resolve, reject) => {
  if (!layerName)
    reject('publishLayerOnGeoserver => ERROR! => layerName should be specified!')

  if (layerExtent.length != 4)
    reject('publishLayerOnGeoserver => ERROR! => layerExtent cannot be specified!')

  optionBody =
    `<featureType><name>${layerName}</name>` +
    `<nativeBoundingBox>` +
    `<minx>${layerExtent[0] ? layerExtent[0] : -180}</minx>` +
    `<maxx>${layerExtent[1] ? layerExtent[1] : 180}</maxx>` +
    `<miny>${layerExtent[2] ? layerExtent[2] : -90}</miny>` +
    `<maxy>${layerExtent[3] ? layerExtent[3] : 90}</maxy>` +
    `<crs>EPSG:4326</crs>` +
    `</nativeBoundingBox>` +
    `<latLonBoundingBox>` +
    `<minx>${layerExtent[0] ? layerExtent[0] : -180}</minx>` +
    `<maxx>${layerExtent[1] ? layerExtent[1] : 180}</maxx>` +
    `<miny>${layerExtent[2] ? layerExtent[2] : -90}</miny>` +
    `<maxy>${layerExtent[3] ? layerExtent[3] : 90}</maxy>` +
    `<crs>EPSG:4326</crs>` +
    `</latLonBoundingBox>` +
    `</featureType>`;

  const options = {
    url: `${geoserverConfig.endpoint}/workspaces/${geoserverConfig.workspace}/datastores/${geoserverConfig.store}/featuretypes`,
    method: 'POST',
    headers: { 'Content-type': 'text/xml' },
    body: optionBody,
    auth: {
      user: geoserverConfig.username,
      pass: geoserverConfig.password
    }
  }

  request(options, (err, res, body) => {
    const responseCode = res.statusCode;
    const statusMessage = res.statusMessage;
    if (responseCode == 201) {
      resolve(`Layer <<${layerName}>> was published successfully.`)
    } else {
      reject(statusMessage)
    }
  })
})

const uploadShapeFile = (tableName, zipFile) => new Promise((resolve, reject) => {
  if (!tableName)
    reject('uploadShapeFile => ERROR! => tableName should be specified!');

  if (!zipFile)
    reject('uploadShapeFile => ERROR! => zip File Not Found!');

  const absPath = path.join(__dirname, "../");
  const fileName = zipFile.filename.split('.').slice(0, -1).join('.');
  const zipFilePath = `${absPath}${uploadConfig.destination}/${fileName}.zip`;
  const unzzipedFilePath = `${absPath}${uploadConfig.destination}/${fileName}`;

  try {
    decompress(zipFilePath, unzzipedFilePath).then(files => {
      var requiredFiles = []
      var shapefilePath = ''
      files.map(file => {
        const fileExtension = path.extname(file.path);
        requiredFiles.push(path.extname(file.path));
        if (fileExtension == '.shp') {
          shapefilePath = `${absPath}${uploadConfig.destination}/${fileName}/${file.path}`;
        }
      });
      if (requiredFiles.indexOf('.shp') < 0 || requiredFiles.indexOf('.shx') < 0 || requiredFiles.indexOf('.dbf') < 0 || requiredFiles.indexOf('.prj') < 0)
        reject('uploadShapeFile => ERROR! => zip File should contain <<.shp>>, <<.shx>>, <<.prj>> and <<.dbf>>files.');

      const execCommand = `shp2pgsql -I -s 4326 "${shapefilePath}" ${dbConfig.schema}.${tableName} | psql -U "${dbConfig.user}" -d "${dbConfig.database}"`;
      exec(execCommand, (err, stdout, stderr) => {
        if (err)
          reject(`uploadShapeFile => ERROR! => Because of ${err}`);

        calculateExtent(tableName)
          .then(extent => {
            publishLayerOnGeoserver(tableName, extent)
              .then(() => {
                resolve(`uploadShapeFile => Success => Layer published successfully.`);
              })
              .catch(() => {
                reject(`uploadShapeFile => ERROR!`);
              })
          })
          .catch(error => reject(`uploadShapeFile => ERROR! => Because of ${error}`))
      })
    })
  } catch (error) {
    reject(`uploadShapeFile => ERROR! => Because of ${error}!`);
  }
})

const nowDateTime = () => {
  let [month, date, year] = new Date().toLocaleDateString("en-US").split("/");
  let [hour, minute, second] = new Date().toLocaleTimeString("en-US").split(/:| /);
  return `${year}-${month}-${date}:${hour}-${minute}-${second}`;
}

const execPostGISCommand = (command) => new Promise((resolve, reject) => {
  if (!command)
    reject({ err: 1, msg: "Execute PostGIS Command Failed. => command is not defined." });
  const pgEntity = new PGService();
  pgEntity.createPool(poolObject => {
    if (poolObject.err) {
      reject({ err: 1, msg: poolObject.err });
    } else {
      poolObject.pool.query(command, (queryError, queryResult) => {
        if (queryError) {
          reject({ err: 1, msg: queryError });
        } else {
          resolve({ err: 0, data: queryResult });
        }
      });
    }
  });
});

const generateRandomPoint = () => new Promise((resolve, reject) => {
  const BBX = [-73.9239, 40.6073, -73.9210, 40.6095];
  const polygonText = `Polygon ((${BBX[0]} ${BBX[1]}, ${BBX[2]} ${BBX[1]}, ${BBX[2]} ${BBX[3]}, ${BBX[0]} ${BBX[3]}, ${BBX[0]} ${BBX[1]}))`;
  const generatePolygonSQL = `SELECT (ST_Dump(ST_GeneratePoints(ST_GeomFromText('${polygonText}',4326),90))).geom AS geom;`

  const pgEntity = new PGService();
  pgEntity.createPool(poolObject => {
    if (poolObject.err) {
      reject({ err: 1, msg: `generateRandomPoint => ERROR! => ${poolObject.err}` })
    } else {
      poolObject.pool.query(`SELECT * FROM "${dbConfig.schema}".asset`, (queryError, queryResult) => {
        if (!queryError) {

          var objectid = 1;
          const geomList = queryResult.rows;
          if (geomList.length) {
            objectid = geomList[geomList.length - 1]['objectid'];
          }

          poolObject.pool.query(generatePolygonSQL, (queryError, queryResult) => {
            if (queryError) {
              reject({ err: 1, msg: `generateRandomPoint => ERROR! => ${queryError}` });
            } else {

              var insertionSQL = ''
              queryResult.rows.map((item, id) => {
                // 4-level bulding
                var level = Math.floor(Math.random() * 5);
                insertionSQL += `INSERT INTO "${dbConfig.schema}"."asset" ("objectid","asset_id","level","created_date",geom) VALUES ('${id + objectid}','${TagIDs[id]}',${level},now(),'${item.geom}');\n`
              });

              poolObject.pool.query(insertionSQL, (queryError, queryResult) => {
                if (queryError) {
                  reject({ err: 1, msg: `generateRandomPoint => ERROR! => Running Final Query => ${queryError}` });
                } else {
                  resolve({ err: 0, msg: `generateRandomPoint => SUCCESS => Random Points Were Created Successfully. (${nowDateTime()})` });
                }
              })
            }
          })
        }
      })
    }
  })
})

module.exports = {
  findInArrayOfDicts,
  sortArrayofDicts,
  dxfToGeojson,
  jsonToSQL,
  isValidGeojson,
  getMapLayer,
  deleteMapLayer,
  uploadShapeFile,
  nowDateTime,
  generateRandomPoint,
  createTableName,
  createDisplayName
}