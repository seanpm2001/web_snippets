function getUrlParam(name, defVal) {
  var retVal;
  try {
    const params = new URLSearchParams(window.location.search);
    retVal = params.get(name);
    if(retVal === null)
      retVal = defVal;
  } catch (e) {
    retVal = defVal;
  }
  return retVal;
}

function makeMap(url, zoom=10, center=[-122.67, 45.51]) {
  var customAttrib = '&copy;OpenTransitTools &copy;OpenStreetMap';

  if (!url) url = 'https://tiles-st.trimet.org/styles/rtp/style.json';
  var map = new maplibregl.Map({
    container: 'map',
    style: url,
    pitch: 0,
    center: center,
    zoom: zoom,
    antialias: true,
    hash: true,
    attributionControl: false
  });

  var scale = new maplibregl.ScaleControl({
    maxWidth: 80,
    unit: 'imperial'
  });

  var attrib = new maplibregl.AttributionControl({
    compact: true,
    customAttribution: '© <a target="_" href="https://tiles.trimet.org">TriMet</a> '
  });

  var full = new maplibregl.FullscreenControl();

  var nav = new maplibregl.NavigationControl({
    visualizePitch: true
  });

  var geo = new maplibregl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true
  });

  var iconMarkerEl = document.createElement("div");
  iconMarkerEl.innerHTML = "<div class='marker-arrow'></div>" + "<div class='marker-pulse'></div>";

  var pelias = new PeliasGeocoder({
    url: 'https://ws.trimet.org/peliaswrap/v1',
    flyTo: 'hybrid',
    useFocusPoint: true,
    marker: {
      icon: iconMarkerEl,
      multiple: false
    },
    customAttribution: customAttrib
  });

  var tooltip = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  var popup = new maplibregl.Popup({closeOnClick: false});
  map.on('contextmenu', function(e) {
    tooltip.remove();

    var coord = e.lngLat;
    var sv = '<iframe width="420" height="280" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" ' +
    'src="https://maps.google.com/maps?output=svembed&amp;&amp;layer=c&amp;cbp=13,,,,&amp;' +
    'cbll=' + coord.lat + ',' + coord.lng + '&amp;ll=' + coord.lat + ',' + coord.lng + '&amp;z=17"></iframe>' +
    "location: " + coord.lat + ',' + coord.lng;

    popup.setLngLat(coord).setMaxWidth("450px").setHTML(sv).addTo(map);
  });

  map.addControl(nav);
  map.addControl(scale);
  map.addControl(pelias);
  map.addControl(attrib);
  map.addControl(full, 'bottom-right');
  map.addControl(geo,  'bottom-right');

  return map;
}
