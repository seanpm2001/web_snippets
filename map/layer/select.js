var hoveredFeatures = null;
var isRoutes = false;


const markerHeight = 20, markerRadius = 10, linearOffset = 10;
const popupOffsets = {
 'top': [0, 0],
 'top-left': [0,0],
 'top-right': [0,0],
 'bottom': [0, -markerHeight],
 'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
 'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
 'left': [markerRadius, (markerHeight - markerRadius) * -1],
 'right': [-markerRadius, (markerHeight - markerRadius) * -1]
 };

// Create a popup, but don't add it to the map yet.
const popup = new maplibregl.Popup({
  offset: popupOffsets,
  closeButton: false,
  closeOnClick: false
});


function getRouteContent() {
  //console.log(hoveredFeatures);
  var template = "\
    num routes:{{hoveredFeatures.length}} <br/> <br/> \
    {{@each(hoveredFeatures) => f}} \
      {{f.properties.route_short_name | check}} {{f.properties.route_long_name}}<br/> \
    {{/each}} \
  ";

  Sqrl.filters.define("check", function(str) {
    return str ? str : "";
  });
  return Sqrl.render(template);
}

function getStopContent() {
  //console.log(hoveredFeatures);
  var template = "\
    {{@each(hoveredFeatures) => f}} \
      agency: {{f.properties.feed_id | check}} <br/> \
      stop id: {{f.properties.stop_id}}<br/> \
      route(s): {{f.properties.route_short_names | check}}<br/> \
    {{/each}} \
  ";

  Sqrl.filters.define("check", function(str) {
    return str ? str : "";
  });
  return Sqrl.render(template);
}


function setHoverState(map, value = false, layer = "routes") {
  if (!isRoutes) return;
  hoveredFeatures.forEach((hf) => {
    try {
	    if (hf.layer.id) {
        map.setFeatureState(
          { source: layer, sourceLayer: hf.layer.id, id: hf.id },
          { hover: value }
        ); 
      } else {
        console.log("missing either feature and/or layer id");
        //console.log(hf);
      }
    } catch (e) {
      console.log("layer problem: " + e);
      //console.log(hf);
    }
  });
}


function getUniqueSortedList(arr) {
    // https://stackoverflow.com/questions/2218999/how-to-remove-all-duplicates-from-an-array-of-objects
    var retVal = [...new Map(arr.map(item => [item.properties.route_long_name, item])).values()];
    retVal.sort((a, b) => (a.properties.route_sort_order > b.properties.route_sort_order) ? 1 : -1);
    return retVal;
}


function mouseMoveEvent(map, features) {
  if (features.length > 0) {
    //console.log(features[0]);
    if (hoveredFeatures) {
      setHoverState(map);
    }
    features.forEach((f) => { console.log(f); f.id = f.properties.id;});
    hoveredFeatures = getUniqueSortedList(features);
    setHoverState(map, true);
  }
}


function mouseLeaveEvent(map) {
  if (hoveredFeatures) setHoverState(map);
  hoveredFeatures = null;
}


function screenPointToBBox(point, inc = 5) {
  return [
    [point.x - inc, point.y - inc],
    [point.x + inc, point.y + inc],
  ];
}


/** mouse over selects map's route features */
function selection(map, layers = layerList) {
  isRoutes = true;
  map.on("mousemove", (e) => {
    const bbox = screenPointToBBox(e.point);
    // https://maplibre.org/maplibre-gl-js/docs/API/classes/maplibregl.Map/#queryrenderedfeatures
    const features = map.queryRenderedFeatures(bbox, { layers: layers });
    if (features.length > 0) {
      mouseMoveEvent(map, features);
      showInfo(getRouteContent());
    } else {
      mouseLeaveEvent(map);
      clearInfo();
    } 
  });
}


function stopToolTip(map, feature, content, e) {
  const coordinates = feature.geometry.coordinates.slice();

  // Ensure that if the map is zoomed out such that multiple
  // copies of the feature are visible, the popup appears
  // over the copy being pointed to.
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  // Populate the popup and set its coordinates based on the feature found.
  popup.setLngLat(coordinates).setHTML(content).addTo(map);  
}

/** mouse over selects map's stop features */
function stopSelection(map, layers = layerList) {
  map.on("mousemove", (e) => {
    const bbox = screenPointToBBox(e.point);
    const features = map.queryRenderedFeatures(bbox, { layers: layers });
    if (features.length > 0) {
      map.getCanvas().style.cursor = 'pointer';
      mouseMoveEvent(map, features);
      stopToolTip(map, features[0], getStopContent(), e);
    } else {
      map.getCanvas().style.cursor = '';
      popup.remove();
      mouseLeaveEvent(map);      
    } 
  });
}
