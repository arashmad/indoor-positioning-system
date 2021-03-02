// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const route = express.Router();

const PGService = require('../models/pg.db.model.js');
const { isValidGeojson, jsonToSQL } = require('../functions/functions')
const { geoserverConfig } = require('../config');


const pgEntity = new PGService();
var upload = multer({ dest: "../public/uploads/" });
// ============================================= GET request => Handling incoming GET requests

route.post("/upload", upload.single("file"), async (request, response) => {

	console.log('\n\n----------------------------------------------');
	console.log('Node/Express => POST Request => Upload New Map');
	console.log('----------------------------------------------\n');

	const storage = multer.diskStorage({
		destination: (req, file, callback) => {
			callback(null, 'uploads/')
		},
		filename: (req, file, callback) => {
			callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
		}
	});

	const imageFilter = function (req, file, callback) {
		// Accept images only
		if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
			req.fileValidationError = 'Only image files are allowed!';
			return callback(new Error('Only image files are allowed!'), false);
		};
		callback(null, true);
	}

	let upload = multer({
		storage: storage
	}).single('map');

	upload(request, response, function (uploadError) {
		if (uploadError instanceof multer.MulterError) {
			response.status(300).send({ err: true, msg: `API => Error in file.route => ${uploadError}` });
		} else if (!request.file) {
			response.status(300).send({ err: true, msg: 'API => Error in file.route => Please send a file.' });
		} else if (uploadError) {
			response.status(300).send({ err: true, msg: `API => Error in file.route => ${uploadError}` });
		}

		// NEXT : Create Table (table_name, geojson_file) =>
		const tableName = 'test1';
		const geojsonFile = request.file;
		const geojsonDir = geojsonFile.path;

		fs.readFile(geojsonDir, function read(readGeojsonFileError, geojsonContent) {
			isValidGeojson(geojsonContent, result => {
				if (result.err) {
					response.status(201).send({ err: true, msg: result.msg });
				} else {
					const jsonObject = result.data;
					jsonToSQL(tableName, jsonObject, result => {
						if (result.data) {
							const SQLString = result.data;
							pgEntity.createPool(poolObject => {
								if (poolObject.err) {
									response.status(201).send({ err: true, msg: `API => Error in file.route => Creating table <<${tableName}>> failed! => Creating Pool!` });
								} else {
									poolObject.pool.query(SQLString, (queryError, queryResult) => {
										if (queryError) {
											response.status(201).send({ err: true, msg: `API => Error in file.route => Creating table <<${tableName}>> failed! => ${queryError}!` });
										} else {
											response.status(200).send({ err: false, msg: `API => Table ${tableName} created successfully.`, data: queryResult });
										}
									})

									// const options = {
									// 	url: `${geoserverConfig.endpoint}/workspaces/${geoserverConfig.workspace}/datastores/${l}/${geoserverConfig.store}`,
									// 	method: 'POST',
									// 	headers: { 'Content-type': 'text/xml' },
									// 	body: apiOption,
									// 	auth: {
									// 		user: `'${geoserverConfig.username}'`,
									// 		pass: `'${geoserverConfig.password}'`
									// 	},
									// 	headers: {
									// 		'accept': 'application/json',
									// 		'content-type': 'application/json'
									// 	}
									// }

									// request(options, (error, response, body) => {
									// 	console.log(`"${apiAction}" | response status code | `, response.statusCode)
									// 	console.log(`"${apiAction}" | response status message | `, response.statusMessage)

									// 	// console.log('error', error)
									// 	// console.log('response', response)
									// 	// console.log('error', error)
									// });

								}
							})
						} else {
							response.status(201).send({ err: true, msg: `API => Error in file.route => Final SQL statement is empty!` });
						}
					});


				}
			});



			// if (readGeojsonFileError) {
			// 	response.status(300).send({ err: true, msg: `API => Error in file.route => FS ca in reading <<.geojson>> file. >> ${readGeojsonFileError}` });
			// } else {
			// 	try {
			// 		const geojsonObject = JSON.parse(geojsonString)
			// 		const features = geojsonObject.features ? geojsonObject.features : []
			// 		if (features.length) {
			// 			features.map((feature, featureID) => {

			// 				// 
			// 				const featureKeys = Object.keys(feature);
			// 				if (!featureKeys.includes('geometry') || !featureKeys.includes('properties')) {
			// 					response.status(300).send({ err: true, msg: `API => Error in file.route => <<.geojson>> is not valid as it's items don't contain <<geometry>> and/or <<properties>>.` });
			// 				}

			// 				const geometry = feature.geometry;
			// 				var geometryKeys = Object.keys(geometry);
			// 				if (!geometryKeys.includes('type') || !geometryKeys.includes('coordinates')) {
			// 					response.status(300).send({ err: true, msg: `API => Error in file.route => <<.geojson>> is not valid as geometries don't contain <<type>> and/or <<coordinates>>.` });
			// 				}

			// 				const geomType = geometry.type.trim();
			// 				const geomCoordinates = geometry.coordinates;
			// 				if (!geomCoordinates.length) {
			// 					response.status(300).send({ err: true, msg: `API => Error in file.route => Coordinates in <<.geojson>> are empty!` });
			// 				}
			// 				if (geomType.toUpperCase() != 'LINESTRING') {
			// 					response.status(300).send({ err: true, msg: `API => Error in file.route => Geomerty type must be <<LINESTRING>> but it is ${geomType}.` });
			// 				}
			// 				if (geomCoordinates[0][0] != geomCoordinates[geomCoordinates.length - 1][0] || geomCoordinates[0][1] != geomCoordinates[geomCoordinates.length - 1][1]) {
			// 					response.status(300).send({ err: true, msg: `API => Error in file.route => Coordinates in <<.geojson>> file must be closed polygon.` });
			// 				}

			// 				let geometryString = '';
			// 				geomCoordinates.map(geomTuple => {
			// 					geometryString += `${geomTuple[0].toFixed(2)} ${geomTuple[1].toFixed(2)},`;
			// 				})
			// 				geometryString = geometryString.slice(0, -1);
			// 				geometryString = `'${geomType.toUpperCase()}(${geometryString})'`;

			// 				const pgEntity = new PGService();
			// 				pgEntity.createPolygon(geometryString, result => {
			// 					if (result.err) {
			// 						response.status(300).send({ err: true, msg: `API => Error in file.route => ${result.msg}` });
			// 					} else {
			// 						const geomertyPolygon = result.polygon;
			// 						const featureAttributes = feature.properties;
			// 						const attributeKeys = Object.keys(featureAttributes);
			// 						if (!attributeKeys.includes('name')) {
			// 							response.status(300).send({ err: true, msg: `API => Error in file.route => <<.geojson>> is not valid as it's features' properties don't contain <<name>> used in database.` });
			// 						}

			// 						let sqlCommand = '';
			// 						let attributeStringName = '';
			// 						let attributeStringValue = '';
			// 						const sqlCreateTable = `CREATE TABLE "${dbConfig.schema}"."${tableName}" (gid serial, #STATEMENT#);`
			// 						attributeKeys.map(attributeName => {
			// 							if (featureID == 0) {
			// 								// CREATE TABLE "public"."level_1" (
			// 								// 	gid serial,
			// 								// 	"objectid" int4,
			// 								// 	"id" int2,
			// 								// 	"name" varchar(50)
			// 								// );
			// 							}
			// 							attributeStringName += `"${attributeName}",`
			// 							attributeStringValue += `"${featureAttributes[attributeName]}",`
			// 						});
			// 						sqlCreateTable = sqlCreateTable.replace("#STATEMENT#", "???");
			// 						attributeStringName = attributeStringName.slice(0, -1);
			// 						attributeStringValue = attributeStringValue.slice(0, -1);
			// 						sqlCommand = `INSERT INTO "public"."level_1" (${attributeStringName},geom) VALUES (${attributeStringValue},'${geomertyPolygon}');`
			// 						console.log(sqlCommand)

			// 						// if (featureID == features.length - 1) {
			// 						// 	response.status(200).send({ err: true, msg: `API SUCCESS => INSERT statements were created successfully.` });
			// 						// }
			// 					}

			// 				})
			// 			})
			// 		} else {
			// 			response.status(200).send({ err: true, msg: `API => Error in file.route => Your <<.geojson>> file is empty! >> ${parseJsonError}` });
			// 		}
			// 	} catch (parseJsonError) {
			// 		response.status(300).send({ err: true, msg: `API => Error in file.route => Cannot parse <<.geojson>> file. >> ${parseJsonError}` });
			// 	}
			// }
		});

		// try {
		// 	const data = fs.readFileSync(mapDir, 'utf8')
		// 	console.log(data)
		// } catch (err) {
		// 	return response.status(300).send({ err: true, msg: `API => Error in file.route => Error in reading .geojson File.\n ${err}` });
		// }

		// const _command = `ogr2ogr -f "PostgreSQL" PG:"host=${dbConfig.host} port=${dbConfig.port} dbname=${dbConfig.database} user=${dbConfig.user} password=${dbConfig.password}" "${mapDir}"`
		// console.log(_command)
		// exec(_command, (err, stdout, stderr) => {
		// 	if (err) {
		// 		console.log(`exec error \n ${err}`);
		// 		console.log(`std err : \n ${stderr}`)
		// 		return response.status(300).send({ err: true, msg: `API => Error in file.route => ${err}` });
		// 	} else {
		// 		console.log(`std out : \n ${stdout}`)
		// 		return response.status(200).json({ err: false, msg: `API SUCCESS => File was uploaded successfully.` })
		// 	}
		// })
	});

});




module.exports = route;