// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


const dbConfig = {
  database: "hanadb",
  schema: "api",
  host: "localhost",
  port: "5432",
  user: "postgres",
  password: "@dministrat0r"
}

const uploadConfig = {
  destination: 'uploads',
  maxSize: 5242880,     // 5 MB => 5 * 1024 * 1024
  format: ['shp', 'dwg', 'json', 'kml']
}

const geoserverConfig = {
  url: "http://localhost:8080/geoserver",
  endpoint: "http://localhost:8080/geoserver/rest",
  workspace: "hana",
  store: "hana_api",
  username: "admin",
  password: "@dministrat0r",
}

const WFSParameters = {
  service: 'WFS',
  version: '1.0.0',
  request: 'GetFeature',
  srsname: 'EPSG:4326',
  outputFormat: 'application/json'
};

const WMSParameters = {
  service: 'WMS',
  version: '1.1.0',
  request: 'GetMap',
  srsname: 'EPSG:4326',
  outputFormat: 'application/openlayers'
};

const TagIDs = [
  "tag_8313903",
  "tag_1756348",
  "tag_8000282",
  "tag_9445891",
  "tag_8297131",
  "tag_5673757",
  "tag_7858445",
  "tag_8626986",
  "tag_1653662",
  "tag_7867038",
  "tag_3311331",
  "tag_8499091",
  "tag_2694824",
  "tag_7312506",
  "tag_1962867",
  "tag_8830638",
  "tag_4413970",
  "tag_4947369",
  "tag_1450527",
  "tag_8161653",
  "tag_3175827",
  "tag_7025419",
  "tag_4542960",
  "tag_2593984",
  "tag_1806076",
  "tag_1529750",
  "tag_8855358",
  "tag_6603662",
  "tag_4002400",
  "tag_6207544",
  "tag_1859385",
  "tag_5328170",
  "tag_1677438",
  "tag_6641515",
  "tag_7346949",
  "tag_3679109",
  "tag_7271716",
  "tag_1917351",
  "tag_7656118",
  "tag_9087761",
  "tag_5799944",
  "tag_1765940",
  "tag_4024448",
  "tag_8553091",
  "tag_3865875",
  "tag_7314836",
  "tag_8513766",
  "tag_6402363",
  "tag_3080385",
  "tag_4963572",
  "tag_9778415",
  "tag_8817432",
  "tag_5611722",
  "tag_1815528",
  "tag_6451564",
  "tag_7770133",
  "tag_6586146",
  "tag_2462256",
  "tag_8366922",
  "tag_3926264",
  "tag_5100962",
  "tag_2790942",
  "tag_1497709",
  "tag_8713879",
  "tag_2069699",
  "tag_4566817",
  "tag_6298443",
  "tag_3206133",
  "tag_3810265",
  "tag_1815465",
  "tag_5433433",
  "tag_7856076",
  "tag_3204936",
  "tag_7285807",
  "tag_2756033",
  "tag_1278180",
  "tag_2957082",
  "tag_6426286",
  "tag_3536919",
  "tag_9463854",
  "tag_5397746",
  "tag_2529585",
  "tag_6643574",
  "tag_8371125",
  "tag_8940115",
  "tag_3355818",
  "tag_2253719",
  "tag_2458582",
  "tag_7677636",
  "tag_5376429"
]

module.exports = {
  uploadConfig,
  dbConfig,
  geoserverConfig,
  WFSParameters,
  WMSParameters,
  TagIDs
}