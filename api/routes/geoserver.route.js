// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


const express = require('express');
const route = express.Router();
const multer = require('multer');
const request = require('request');
const path = require('path');

const PGService = require('../models/pg.db.model.js');
const { getMapLayer, deleteMapLayer, uploadShapeFile, nowDateTime, createTableName, createDisplayName } = require('../functions/functions')
const { dbConfig, geoserverConfig, WFSParameters, WMSParameters } = require('../config');

const pgEntity = new PGService();
const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, callback) => {
			callback(null, 'uploads/')
		},
		filename: (req, file, callback) => {
			const uploadName = `${file.fieldname}-${nowDateTime().replace(/:/g, "-").replace(/-/g, "_")}${path.extname(file.originalname)}`
			callback(null, uploadName);
		}
	})
});


route.get("/layers", (req, res) => {

	console.log(`\n${nowDateTime()}`);
	console.log('Node/Express => GET Request => Return Layers from Geoserver');

	const options = {
		url: `${geoserverConfig.endpoint}/workspaces/${geoserverConfig.workspace}/layers`,
		method: 'GET',
		auth: {
			username: `${geoserverConfig.username}`,
			password: `${geoserverConfig.password}`
		},
		headers: {
			'accept': 'application/json',
			'content-type': 'application/json'
		}
	};

	request(options, (error, response, body) => {
		if (error) {
			if (error.code == 'ECONNREFUSED') {
				res.status(200).send({ err: true, msg: `Map server does not response: ${error.code}` })
			} else {
				res.status(500).send({ err: true, msg: `Uknown Error => <<${error}>> error!` })
			}
		} else {
			const responseCode = response.statusCode;
			const responseData = response.body;
			var data = [];

			const mapLayers = JSON.parse(responseData).layers;
			if (!mapLayers) {
				res.status(responseCode).send({ err: false, data: [] });
			} else {
				mapLayers.layer.map(item => {
					const layerName = createDisplayName(item.name)
					if (item.name != 'asset')
						data.push(layerName);
				})
				res.status(responseCode).send({ err: false, data: data });
			}
		}
	});
})

route.get("/layers/:type/:name", (_request, _response) => {

	var requestType = _request.params.type;
	var layerName = createTableName(_request.params.name);

	if (!requestType || !layerName)
		_response.status(200).send({ data: null, msg: `API => Error in geoserver.route => Required parameters must be set!` });

	console.log(`\n${nowDateTime()}`);
	console.log(`Node/Express => GET Request => Map Route => A <<${requestType}>> request for <<${createDisplayName(layerName)}>> layer`);

	var requestURL;
	switch (requestType) {
		case 'wms':
			requestURL =
				`${geoserverConfig.url}/${geoserverConfig.workspace}/wms` +
				`?service=${WMSParameters.service}` +
				`&version=${WMSParameters.version}` +
				`&request=${WMSParameters.request}` +
				`&layers=${geoserverConfig.workspace}:${layerName}` +
				`&outputFormat=${WMSParameters.outputFormat}`;

			getMapLayer(requestURL, requestType)
				.then(result => {
					console.log("\n\n", result, "\n\n")
					// _response.status(responseCode).send({ data: res.body });
					_response.send(result);
				})
				.catch(error => {
					console.log("\n\n", error, "\n\n")
					// _response.status(responseCode).send({ data: res.body });
					_response.send(error);
				})
			break;
		case 'wfs':
			requestURL =
				`${geoserverConfig.url}/${geoserverConfig.workspace}/ows` +
				`?service=${WFSParameters.service}` +
				`&version=${WFSParameters.version}` +
				`&request=${WFSParameters.request}` +
				`&typeName=${geoserverConfig.workspace}:${layerName}` +
				`&outputFormat=${WFSParameters.outputFormat}`

			if (layerName == 'asset')
				requestURL += `&sortBy=created_date+D&maxFeatures=90`;

			getMapLayer(requestURL, requestType)
				.then(result => {
					if (result.data)
						_response.status(result.responseCode).send({ data: JSON.parse(result.data) });
					else
						_response.status(result.responseCode).send({ data: [], msg: result.msg });
				})
				.catch(error => {
					_response.status(404).send({ error: error, data: [] });
				})
			break;
	}
})

route.post("/layer/add", upload.single("file"), async (_request, _response) => {

	console.log(`\n${nowDateTime()}`);
	console.log('Node/Express => POST Request => Upload New Map');

	const tableName = createTableName(_request.body.name);
	const mapFile = _request.file;
	if (!tableName || !mapFile) {
		_response.status(300).send({ err: true, msg: 'API => Error in geoserver.route => Please send name and file.' });
	}

	try {
		const shapeFile = _request.file;
		uploadShapeFile(tableName, shapeFile)
			.then(success => {
				_response.status(200).send({ err: false, msg: success });
			})
			.catch(error => {
				_response.status(500).send({ err: true, msg: `API => Error in uploading new layer. ${error}` });
			})

	} catch (error) {
		_response.status(500).send({ err: true, msg: `API => Error in geoserver.route => ${error}` });
	}

	// shp2pgsql -I -s 4326 "plan_f1.shp" api.testtablename | psql -U postgres -d "hanadb"

	// ogr2ogr -f GeoJSON ./plan.geojson ./plan.dxf

	// NEXT : Create Table (table_name, geojson_file) =>
	// 	const geojsonFile = _request.file;
	// 	const geojsonDir = geojsonFile.path;
});

route.delete("/:name", (_request, _response) => {

	console.log(`\n${nowDateTime()}`);
	console.log('Node/Express => DELETE Request => Delete map layer');

	const tableName = createTableName(_request.params.name);
	if (!tableName) {
		_response.status(500).send({ err: true, msg: 'API => Error in geoserver.route => Please send name and file.' });
	} else {
		deleteMapLayer(tableName)
			.then(result => {
				pgEntity.createPool(poolObject => {
					if (poolObject.err) {
						_response.status(500).send({ err: true, msg: `API => Error in geoserver.route => Deleting table <<${createDisplayName(tableName)}>> failed! => Creating Pool!` });
					} else {
						poolObject.pool.query(`DROP TABLE ${dbConfig.schema}.${tableName}`, (queryError, queryResult) => {
							if (queryError) {
								_response.status(500).send({ err: true, msg: `API => Error in file.route => Deleting table <<${createDisplayName(tableName)}>> failed! => ${queryError}!` });
							} else {
								_response.status(200).send({ msg: `API => Table was deleted => ${result.msg}` });
							}
						})
					}
				})
			})
			.catch(error => {
				_response.status(500).send({ msg: `API => Error in file.route => Deleting table <<${tableName}>> failed! => ${error}` });
			})
	}


	// pgEntity.createPool(poolObject => {
	// 	if (poolObject.err) {
	// 		_response.status(201).send({ err: true, msg: `API => Error in geoserver.route => Deleting table <<${tableName}>> failed! => Creating Pool!` });
	// 	} else {
	// 		poolObject.pool.query(`DROP TABLE ${dbConfig.schema}.${tableName}`, (queryError, queryResult) => {
	// 			if (queryError) {
	// 				_response.status(201).send({ err: true, msg: `API => Error in file.route => Deleting table <<${tableName}>> failed! => ${queryError}!` });
	// 			} else {
	// 				deleteMapLayer(tableName)
	// 					.then(result => {
	// 						_response.status(result.code).send({ msg: `API => Deleteing Table => ${result.msg}` });
	// 					})
	// 					.catch(error => {
	// 						_response.status(500).send({ msg: `API => Error in file.route => Deleting table <<${tableName}>> failed! => ${error}` });
	// 					})
	// 			}
	// 		})
	// 	}
	// })
})


module.exports = route;