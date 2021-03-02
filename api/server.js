// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require('path');

const app = express();

const PGService = require('./models/pg.db.model.js');
const { dbConfig } = require('./config.js');
const { nowDateTime, generateRandomPoint } = require('./functions/functions.js');

const geoserverRoute = require('./routes/geoserver.route');

const port = process.env.PORT || 8081;
app.use(cors());

app.use('/map', geoserverRoute);
app.use('/file', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, '/file/template.zip'));
});

app.use((req, res) => {
    res.status(404).send('REST point was not found!');
});

app.listen(port, () => {

    console.log('\n\n', nowDateTime())
    console.log(`NODE => Server is running on port ${port}.`);

    const createAssetTableSQL =
        `CREATE TABLE "${dbConfig.schema}"."asset" (gid serial,"objectid" int4, "asset_id" text, "level" int4, "created_date" timestamp);` +
        `ALTER TABLE "${dbConfig.schema}"."asset" ADD PRIMARY KEY (gid);` +
        `SELECT AddGeometryColumn('${dbConfig.schema}', 'asset', 'geom', '4326', 'POINT', 2);`;

    const pgEntity = new PGService();
    pgEntity.createPool(poolObject => {
        if (poolObject.err) {
            console.log(`NODE => Create <<asset>> Table ERROR! => Couldn't create PG Pool object => ${poolObject.err}`);
        } else {
            poolObject.pool.query(`SELECT * FROM "${dbConfig.schema}".asset`, (queryError, queryResult) => {
                if (queryError) {
                    poolObject.pool.query(createAssetTableSQL, (queryError, queryResult) => {
                        if (queryError) {
                            console.log(`NODE => Create <<asset>> Table ERROR! => Couldn't execute query! => ${queryError}`);
                        } else {
                            console.log(`NODE => Table <<asset>> was created successfully.`);


                            //====================================================================
                            // SELECT ST_EstimatedExtent('api', 'asset', 'geom') as BBX;
                            // publish on geoserver /////////////////////////////////////////////=
                            //====================================================================

                        }
                    })
                }
                else {
                    // setInterval(() => {
                    //     generateRandomPoint()
                    //         .then(result => console.log(result.msg))
                    //         .catch(error => console.log(result.msg))
                    // }, 10000);
                }
            })
        }
    })
});