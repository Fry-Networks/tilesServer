import * as h3 from "h3-js";
import * as fs from "fs";
import * as turf from "@turf/turf";

// Load your GeoJSON file
const pointsGeoJSON = JSON.parse(fs.readFileSync("miners.geojson", "utf8"));

// Function to create hex grid
function createHexGrid(pointsGeoJSON: any, resolution: number) {
    const hexSet = new Set<string>();

    // Iterate over each point and add its hexagon to the set
    pointsGeoJSON.features.forEach((feature: any) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        const hexId = h3.latLngToCell(latitude, longitude, resolution);
        hexSet.add(hexId);
    });
    console.log(hexSet)

    // Create hexagon geometries
    const hexFeatures = Array.from(hexSet).map((hexId) => {
        const hexBoundary = h3.cellToBoundary(hexId, true);
        console.log(hexBoundary)
        const hexPolygon = turf.polygon([hexBoundary]);
        return turf.feature(hexPolygon.geometry, { id: hexId });
    });

    // Create a FeatureCollection with hexagon geometries
    const hexGeoJSON = turf.featureCollection(hexFeatures);
    return hexGeoJSON;
}

// Adjust the resolution as needed
const resolution = 8;
const hexGeoJSON = createHexGrid(pointsGeoJSON, resolution);
console.log(hexGeoJSON)
// Save hex grid to a GeoJSON file
fs.writeFileSync("hex_grid.geojson", JSON.stringify(hexGeoJSON, null, 2));
