"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const h3 = __importStar(require("h3-js"));
const fs = __importStar(require("fs"));
const turf = __importStar(require("@turf/turf"));
// Load your GeoJSON file
const pointsGeoJSON = JSON.parse(fs.readFileSync("miners.geojson", "utf8"));
// Function to create hex grid
function createHexGrid(pointsGeoJSON, resolution) {
    const hexSet = new Set();
    // Iterate over each point and add its hexagon to the set
    pointsGeoJSON.features.forEach((feature) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        const hexId = h3.latLngToCell(latitude, longitude, resolution);
        hexSet.add(hexId);
    });
    console.log(hexSet);
    // Create hexagon geometries
    const hexFeatures = Array.from(hexSet).map((hexId) => {
        const hexBoundary = h3.cellToBoundary(hexId, true);
        console.log(hexBoundary);
        const hexPolygon = turf.polygon([hexBoundary]);
        return turf.feature(hexPolygon.geometry);
    });
    // Create a FeatureCollection with hexagon geometries
    const hexGeoJSON = turf.featureCollection(hexFeatures);
    return hexGeoJSON;
}
// Adjust the resolution as needed
const resolution = 7;
const hexGeoJSON = createHexGrid(pointsGeoJSON, resolution);
console.log(hexGeoJSON);
// Save hex grid to a GeoJSON file
fs.writeFileSync("hex_grid.geojson", JSON.stringify(hexGeoJSON, null, 2));
