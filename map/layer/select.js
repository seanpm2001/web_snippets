var hoveredFeatures = null;

function getContent() {
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

function setHoverState(map, value = false, layer = "routes") {
  hoveredFeatures.forEach((hf) => {
    try {
      if (hf.layer.id && hf.id)
        map.setFeatureState(
          { source: layer, sourceLayer: hf.layer.id, id: hf.id },
          { hover: value }
        );
      else {
        console.log("missing either feature and/or layer id");
        //console.log(hf);
      }
    } catch (e) {
      console.log("layer problem: " + e);
      console.log(hf);
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

/** mouse over selects map features */
function selection(map, layers = routeLayerList) {
  map.on("mousemove", (e) => {
    const bbox = screenPointToBBox(e.point);
    // https://maplibre.org/maplibre-gl-js/docs/API/classes/maplibregl.Map/#queryrenderedfeatures
    const features = map.queryRenderedFeatures(bbox, { layers: layers });
    if (features.length > 0) {
      mouseMoveEvent(map, features);
      showInfo(getContent());
    } else {
      mouseLeaveEvent(map);
      clearInfo();
    } 
  });
}
