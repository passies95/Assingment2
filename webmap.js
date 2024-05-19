/*===================================================
WebMapping of Location of Interest and Their travel Path
Author: Pascal Ogola              
===================================================*/
// Add the map and the tiles

var mapCentre = [1.72,22.52]
var mapZoom = 2

var map = L.map('map').setView(mapCentre, mapZoom);
// Add Basemap Tilelayers
// Two basemaps have been selected, one satellite and the other and topomap
// Add Osm Layer
// Google Streets Layer
googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
 }).addTo(map);
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
 // Add Google Satelite Layer
googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
   maxZoom: 20,
   subdomains:['mt0','mt1','mt2','mt3']
});
// Add Carto Db Layer
var CartoDB_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
});

// Define Layer Control Variables
// Add the basemaps to the Layer Control Variable
var baseLayers = {
    "Carto Light":CartoDB_Positron,
    "Google Map":googleStreets,
    "OpenStreetMap": osm,
    "Satellite":googleSat
};

var overlays = {};
//Add Layer Control to Map
var layerControl = L.control.layers(baseLayers, overlays).addTo(map);

// Define the legend control
var legend = null;

// Fetch and display data from EONET Events
const LayerURL = 'https://eonet.gsfc.nasa.gov/api/v3/events'

// Add a dictionary to hold the various categories of events in the data
// var markerLayer = L.layerGroup();
var categoryLayers = {};

// Define an object to store random colors for each category
var colorClasses = ['#FF0000', '#800080', '#00FF00', '#FFFF00', '#fe019a'];
// Shuffle the colorClasses array to randomize the order of colors
colorClasses.sort(() => Math.random() - 0.5);
var categoryColors = {};

fetch(LayerURL)
    .then(response => {
        if (!response.ok) {
        throw new Error(`Failed to fetch ${layerURL}: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        // console.log(data)
        // Parse the Geometry from the Events array and add it to map
        var eventsArray = data.events;
        eventsArray.forEach(event => {
            // extract properties of each event
            var eventID = event.link;
            var link = event.id;
            var categoryID = event.categories[0].id;
            var categoryTitle = event.categories[0].title;
            var sourcesID = event.sources[0].id;
            var sourcesURL = event.sources[0].url;
            var coordinates = event.geometry.map(geo => geo.coordinates.reverse());
            // console.log(coordinates)
            var magnitude = event.geometry[0].magnitudeValue;
            var magnitudeUnit = event.geometry[0].magnitudeUnit; 
            var date = new Date(event.geometry[0].date);
            var title = event.title;
            var description = event.description ? event.description : 'No description available';

            // Group the events based on their category and add it to the category dictionary if it does not exist
            // convert each category to a layergroup
            if (!categoryLayers[categoryID]) {
                categoryLayers[categoryID] = L.layerGroup().addTo(map);
                //Add the Layer to Layer Control
                layerControl.addOverlay(categoryLayers[categoryID], categoryTitle);
            }

            // Define Visualization Parameters
            // Generate a random color for each event category
            if (!categoryColors[categoryID]) {
                // Randomly select a color from the colorClasses array
                //Pop a previously selected color to ensure that selected color is unique
                var randomColor = colorClasses.pop();
                // Assign the color to the category
                categoryColors[categoryID] = randomColor;
            }
            // var randomColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];
            var geojsonMarkerOptions = {
                radius: 8,
                fillColor: categoryColors[categoryID],
                color: categoryColors[categoryID],
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };

            var marker = L.circleMarker(coordinates[0], geojsonMarkerOptions);
            marker.bindPopup(`<b>Event Title:</b> ${title}<br>
                                <b>Description:</b> ${description}<br>
                                <b>Date:</b> ${date}<br>
                                <b>Category:</b> ${categoryTitle}<br>
                                <b>Magnitude:</b> ${magnitude} ${magnitudeUnit}<br>
                                <b>Event ID:</b> <a href="${eventID}" target="_blank">${link}</a><br>
                                <b>Sources:</b> <a href="${sourcesURL}" target="_blank">${sourcesID}</a>`)
            // markerLayer.addLayer(marker);
             // Add marker to the layer group
            categoryLayers[categoryID].addLayer(marker);
        });
    })
    .catch(error => console.error('Error fetching the data from EONET Events:', error));

// Define a function to dynamically create a legend
async function constructLegend(eventsDictionary) {
    // Define an array to store legend items
    var legendItems = [];

    // Check if the dictionary length is greater than 0, if not, await for it to be updated
    while (Object.keys(eventsDictionary).length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100 milliseconds before checking again
    }

    // Iterate over categoryColors object entries to construct legend items
    Object.entries(eventsDictionary).forEach(([categoryID, color]) => {
        // Add legend item for this category
        legendItems.push({
            label: categoryID,
            type: "circle",
            color: color,
            fillColor: color,
            weight: 1
        });
    });

    // Create legend with dynamically generated legend items
    legend = L.control.Legend({
        position: "bottomright",
        title: 'Natural Events',
        collapsed: false,
        symbolWidth: 18,
        opacity: 1,
        column: 1,
        legends: legendItems
    }).addTo(map);
}

// Call the construct Legend Function and pass in the category color dictionary
constructLegend(categoryColors);
