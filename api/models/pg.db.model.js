// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


const { Pool } = require('pg');
const { dbConfig } = require('../config');

class PGService {
	constructor() {
		this.host = dbConfig.host;
		this.port = dbConfig.port;
		this.user = dbConfig.user;
		this.password = dbConfig.password;
		this.database = dbConfig.database;
	}

	createPool(callback) {
		try {
			const pool = new Pool({
				host: this.host,
				port: this.port,
				user: this.user,
				password: this.password,
				database: this.database
			});
			return callback({ err: 0, pool: pool })
		} catch (error) {
			return callback({ err: 1, pool: null, msg: error })
		}
	};

	checkConnection(callback) {
		this.createPool(poolObject => {
			if (poolObject.err) {
				return callback({ err: 1, msg: poolObject.msg });
			} else {
				poolObject.pool.query('SELECT NOW()', (error, result) => {
					if (error) {
						return callback({ err: 1, msg: 'Faile to run Test query.' });
					} else {
						return callback({ err: 0, msg: result });
					}
					pool.end()
				})
			}
		});
	}

	createPolygon(stringPolygon, callback) {
		this.createPool(poolObject => {
			if (poolObject.err) {
				return callback({ err: 1, msg: `Create Polygon => ${poolObject.msg}`, polygon: null });
			} else {
				if (!stringPolygon) {
					return callback({ err: 1, msg: 'Create Polygon => Polygon command creator is not valid!', polygon: null });
				} else {
					const command = `SELECT ST_MakePolygon(ST_GeomFromText(${stringPolygon}))`;
					poolObject.pool.query(command, (queryError, queryResult) => {
						if (queryError) {
							return callback({ err: 1, msg: `Create Polygon => Failed to run ST_MakePolygon query. => ${queryError}`, polygon: null });
						} else {
							if (queryResult.rows.length != 1 || !queryResult.rows[0]['st_makepolygon']) {
								return callback({ err: 1, msg: 'Create Polygon => Query result does not contain Geomerty.', polygon: null });
							} else {
								const geomertyPolygon = queryResult.rows[0]['st_makepolygon'];
								return callback({ err: 0, msg: 'Create Polygon => Done Successfully.', polygon: geomertyPolygon })
							}
						}
					})
				}
			}
		})
	}
}

module.exports = PGService