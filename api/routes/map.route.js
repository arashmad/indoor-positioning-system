// // -----------------------------
// // developed by HanaTech Team
// // Hanatech IOT Solutions
// // (PERN) PostgreSQL / Express / React / Node
// //------------------------------


// const express = require('express');
// const { jsonToSQL } = require('../functions/functions');
// const route = express.Router();


// // const PGService = require('../models/pg.db.model.js')



// // ============================================= PostgreSQL pool object
// // var pool;
// // const pgEntity = new PGService();
// // pgEntity.checkConnection(res => {
// // 	if (!res.err) {
// // 		console.log('Connection => SUCCESSFULL\n')
// // 		pool = pgEntity.createPool()
// // 	} else {
// // 		console.log('Connection => FAILED!\n')
// // 	}
// // })


// // ============================================= GET request => Handling incoming GET requests
// route.get('/', (request, result) => {

// 	console.log('\n----------|...........................|----------');
// 	console.log('----------| get request just received |----------');
// 	console.log('----------|...........................|----------\n');

// 	if (!pool) {
// 		console.log('Error => \nPostgreSQL Pool object is NULL!')
// 	} else {
// 		jsonToSQL(request, sqlResponse => {
// 			if (sqlResponse.err) {
// 				console.log('SQL => \nERROR in making SQL string', '\n')
// 				console.log('SQL => \n', sqlResponse.msg, '\n')
// 			} else {
// 				const SQLString = sqlResponse.sql
// 				pool.query(SQLString, (queryError, queryResult) => {
// 					if (queryError) {
// 						console.log('Error => \nCould not execute SQL query!')
// 					} else {
// 						const queryResultFields = queryResult.fields
// 						const queryResultRows = queryResult.rows
// 						toGeojson(queryResultRows, (geojsonResult) => {
// 							if (geojsonResult.err) {
// 								console.log('Error => \nCould not parse SQL results to Geojson!')
// 							} else {
// 								var queryResultFeatures = []
// 								geojsonResult.respond.features.map(feature => {
// 									queryResultFeatures.push({
// 										'geometry': feature.geometry,
// 										'attributes': feature.properties
// 									})
// 								})
// 								result.json({
// 									fields: queryResultFields,
// 									features: queryResultFeatures
// 								})
// 							}
// 						})
// 					}
// 				})
// 			}
// 		})
// 	}
// })



// module.exports = route;