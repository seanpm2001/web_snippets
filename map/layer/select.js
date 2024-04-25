var hoveredFeatures = null;
var isRoutes = false;

// Create a popup, but don't add it to the map yet.
const popup = new maplibregl.Popup({
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


/** mouse over selects map's stop features */
function stopSelection(map, layers = layerList) {
  map.on("mousemove", (e) => {
    const bbox = screenPointToBBox(e.point);
    const features = map.queryRenderedFeatures(bbox, { layers: layers });
    if (features.length > 0) {
      map.getCanvas().style.cursor = 'pointer';
      mouseMoveEvent(map, features);
      showInfo(getStopContent());
    } else {
      map.getCanvas().style.cursor = '';
      mouseLeaveEvent(map);
      clearInfo();
    } 
  });
}
