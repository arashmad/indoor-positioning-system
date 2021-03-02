// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


export const server = {
    rootDirectory: {
        // root: "http://localhost:8081",
        root: "http://178.128.238.91:8081",
        subDirectory: {
            root: '/map',
            subDirectory: {
                layers: '/layers',
                add: '/layer/add',
                delete: '/layer/delete'
            }
        },
        file: '/file'
    },
    wirepas: {
        // root: "http://localhost:8081",
        root: "http://178.128.238.91:8082",
        subDirectory: {
            root: '/tag',
            subDirectory: {
                locations: '/get/location'
            }
        },
    }
}

// REACT ACTION CONSTANTS:
// export const SEND_CLASS_TO_MAP = 'SEND_CLASS_TO_MAP';
// export const SEND_DESCRIPTION_TO = 'SEND_DESCRIPTION_TO';
// export const SEND_TO_MODAL = 'SEND_TO_MODAL';
// export const DIALOG_ON_OFF = 'DIALOG_ON_OFF';
// export const SELECT_WORKSPACE = 'SELECT_WORKSPACE';
// export const SELECT_DATASTORE = 'SELECT_DATASTORE';
// export const SELECT_LAYER = 'SELECT_LAYER';
// export const MANAGE_DS_FORM_DATA = 'MANAGE_DS_FORM_DATA';


// PostgreSQL ACTION CONSTANTS:
export const PG_GET_LAYERS = 'pg-get-layers';
export const PG_GET_CATEGORIES = 'pg-get-categories';
export const PG_GET_TITLES = 'pg-get-titles';
export const PG_GET_VALUES = 'pg-get-values';
export const PG_GET_DESCRIPTION = 'pg-get-description';


// GEOSERVER ACTION CONSTANTS:
export const GEO_DATA_MAP = 'workspace-data-map';
// export const GEO_ACTION_WS_GETALL = 'workspace-getAll';
// export const GEO_ACTION_WS_GETONE = 'workspace-getOne';
// export const GEO_ACTION_WS_CREATE = 'workspace-create';
// export const GEO_ACTION_WS_DELETE = 'workspace-delete';
// export const GEO_ACTION_WS_EDIT = 'workspace-edit';
// export const GEO_ACTION_DS_GETALL = 'datastore-getAll';
// export const GEO_ACTION_DS_GETONE = 'datastore-getOne';
// export const GEO_ACTION_DS_CREATE = 'datastore-create';
// export const GEO_ACTION_DS_DELETE = 'datastore-delete';
// export const GEO_ACTION_DS_EDIT = 'datastore-edit';
