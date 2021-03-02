// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


export const sendRequest = async (option) => {
   try {
      const _response = await axios({
         method: option.method,
         url: option.url,
         data: option.data ? option.data : {},
      });
      return _response;
   } catch (_error) {
      return _error;
   }
}


import {
   GEO_ACTION_WS_GETALL,
   GEO_ACTION_WS_DELETE,
   GEO_ACTION_WS_CREATE,
   GEO_ACTION_WS_EDIT,
   GEO_ACTION_DS_CREATE,
   GEO_ACTION_DS_GETALL,
   GEO_ACTION_DS_GETONE,
   GEO_ACTION_DS_DELETE,
   GEO_ACTION_DS_EDIT,
} from './../constants';

export const makeRequest = obj => {
   // console.log('Client | Request Object\n', obj)
   let { type, path, action, data } = obj
   let _url_ = `http://localhost:9000/geoserverManagement?path=${path}&action=${action}`;

   switch (type) {
      case 'GET': {
         return new Request(_url_, {
            method: type,
            headers: new Headers({ 'Content-Type': 'application/json' }),
         })
      }
      case 'POST': {
         let body = { data }
         if (!body) body = {}
         return new Request(_url_, {
            method: type,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body)
         });
      }
      case 'DELETE': {
         return new Request(_url_, {
            method: type,
            headers: new Headers({ 'Content-Type': 'application/json' }),
         });
      }
      case 'PUT': {
         let body = { data }
         if (!body) body = {}
         return new Request(_url_, {
            method: type,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body)
         });
      }
      default: {
         break;
      }
   }
}


export const sendRequest = obj => new Promise((resolve, reject) => {
   // if (obj.action === GEO_ACTION_DS_CREATE) {
   //    fetch(makeRequest(obj))
   //    .then(res => console.log(res))
   //    return
   // }
   fetch(makeRequest(obj))
      .then(res => res.json())
      .then(response => {
         switch (obj.action) {
            case GEO_ACTION_WS_GETALL: {
               resolve(response);
               break;
            }
            case GEO_ACTION_WS_CREATE: {
               resolve(response)
               break;
            }
            case GEO_ACTION_WS_DELETE: {
               resolve(response)
               break;
            }
            case GEO_ACTION_WS_EDIT: {
               resolve(response)
               break;
            }
            case GEO_ACTION_DS_GETALL: {
               resolve(response);
               break;
            }
            case GEO_ACTION_DS_CREATE: {
               resolve(response);
               break;
            }
            case GEO_ACTION_DS_GETONE: {
               resolve(response);
               break;
            }
            case GEO_ACTION_DS_DELETE: {
               resolve(response);
               break;
            }
            case GEO_ACTION_DS_EDIT: {
               resolve(response);
               break;
            }
            default: {
               break;
            }
         }
      }).catch(error => reject(error));
})