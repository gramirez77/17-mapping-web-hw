// Store our API endpoint inside queryUrl
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

// Perform a GET request to the query URL
d3.json(queryUrl, function(data) {
  // Once we get a response, send the data.features object to the createFeatures function
  createFeatures(data.features);
});

function createFeatures(earthquakeData) {

  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3> Mag. " + feature.properties.mag + " | " + feature.properties.place +
      "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
  }

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  var earthquakesLayer = L.geoJSON(earthquakeData, {
    // Use the pointToLayer function to define how GeoJSON points spawn Leaflet layers.
    // In this case we want to create circle markers where radius and color is determined
    // by the magnitude of the earthquake in the feature properties magnitude
    pointToLayer: (feature, latlng) => {
      if (feature.properties.mag) {
        return L.circle(latlng, {
          stroke:      false,
          fillColor:   feature.properties.mag > 5 ? "rgb(240, 0,   0 )":
                       feature.properties.mag > 4 ? "rgb(234, 130, 44)":
                       feature.properties.mag > 3 ? "rgb(238, 156, 0 )":
                       feature.properties.mag > 2 ? "rgb(238, 203, 0 )":
                       feature.properties.mag > 1 ? "rgb(212, 238, 0 )":
                                                    "rgb(152, 238, 0 )",
          radius:      feature.properties.mag * 10000,
          fillOpacity: 1
        })
      }
    },
    onEachFeature: onEachFeature
  });

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakesLayer);
}

function createMap(earthquakesLayer) {
  // Define map layersa

  var lightMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.light",
    accessToken: API_KEY
  });

  var darkMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.dark",
    accessToken: API_KEY
  });

  var outdoorsMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.outdoors",
    accessToken: API_KEY
  });

  var satelliteMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.satellite",
    accessToken: API_KEY
  });

  var streetsMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken: API_KEY
  });

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Light":     lightMap,
    "Dark":      darkMap,
    "Outdoors":  outdoorsMap,
    "Satellite": satelliteMap,
    "Streets":   streetsMap
  };

  // Create a layer using GeoJSON with tectonic plates data grabbed from an external link 
  var link = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";
  d3.json(link, function(data) {
    // Creating a GeoJSON layer with the retrieved data
    tectonicplatesLayer = L.geoJson(data, {
      style: { fill: false, color: "orange", weight: 1.5 }
    });
      // Create overlay object to hold our overlay layer
    var overlayMaps = {
      "Fault Lines": tectonicplatesLayer,
      "Earthquakes": earthquakesLayer
    };

    // Create our map, giving it the streetmap and earthquakes layers to display on load
    var myMap = L.map("map", {
      center: [
        37.09, -95.71
      ],
      zoom: 5,
      layers: [darkMap, tectonicplatesLayer, earthquakesLayer]
    });

    // Create a layer control
    // Pass in our baseMaps and overlayMaps
    // Add the layer control to the map
    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(myMap);

    // Set up the legend
    var legend = L.control({ position: "bottomright" });
    legend.onAdd = function(map) {
      var div = L.DomUtil.create("div", "info legend");
      var grades = [0, 1, 2, 3, 4, 5];
      var labels = [];
    
      // loop through our intervals and generate a label with a colored square for each interval
      for (var i = 0; i <= 5; i++) {
        var color = grades[i] === 5 ? "rgb(240, 0,   0 )":
                    grades[i] === 4 ? "rgb(234, 130, 44)":
                    grades[i] === 3 ? "rgb(238, 156, 0 )":
                    grades[i] === 2 ? "rgb(238, 203, 0 )":
                    grades[i] === 1 ? "rgb(212, 238, 0 )":
                                      "rgb(152, 238, 0 )";
        div.innerHTML += '<i style="background:' + color + '"></i> ' +
                        i + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }

      return div;
    };

    // Adding legend to the map
    legend.addTo(myMap);

  })

}
