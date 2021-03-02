// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


const express = require('express');
const route = express.Router();

const PGService = require('../models/pg.db.model.js');


const pgEntity = new PGService();
// ============================================= GET request => Handling incoming GET requests

route.get("/layers", (request, response) => {

    console.log('\n\n------------------------------------------------------------');
    console.log('Node/Express => GET Request => Fetch All Layers from Postgresql');
    console.log('---------------------------------------------------------------\n');

});




module.exports = route;