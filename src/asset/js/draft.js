// const _url = `http://localhost:3001/apipg`;
// const _request = new Request(_url, {
//   method: 'GET',
//   headers: new Headers({ 'Content-Type': 'application/json' }),
// })

// fetch(_request)
//   .then(res => res.json())
//   .then(response => { console.log(response) })
//   .catch(error => console.log(error));

// const baseLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
//   attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
//   id: 'mapbox.streets'
// });


// const dataLayer = L.tileLayer.wms("http://localhost:8080/geoserver/hamburg/wms", {
//   layers: 'hamburg:vg250f',
//   format: 'image/png',
//   transparent: true,
//   version: '1.1.0',
//   attribution: "hamburg web map application"
// });

// const map = L.map('map', {
//   center: [53.4318381, 9.9669992],
//   zoom: 10,

//   layers: [
//     baseLayer,
//     dataLayer

//   ]
// })

// map.eachLayer(lyr => {
//   console.log(lyr['_tiles'])
// });

// this.map = map

// console.log(WMSTileLayer)

/*
<Map style={style.map} center={initCenter} zoom={initZoom}>
    <TileLayer
        url='https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        id='mapbox.streets'
    />
    <WMSTileLayer
        url="http://localhost:8080/geoserver/hamburg/ows"
        attribution="hamburg web map application"
        layers='hamburg:vg250f'
        format='image/png'
        transparent={true}
    />
    <GeoJSON
        key={Math.random()}
        data={features}
        style={() => ({
            color: '#4a83ec',
            weight: 0.5,
            fillColor: "#1a1d62",
            fillOpacity: 0.5,
        })}
    />
</Map >
*/
