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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const h3 = __importStar(require("h3-js"));
const fs = __importStar(require("fs"));
const turf = __importStar(require("@turf/turf"));
const mongoclient_1 = __importDefault(require("./db/mongoclient"));
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
        const hexBoundary = h3.cellToBoundary(hexId, true).map(([lat, lng]) => [lng, lat]);
        const hexPolygon = turf.polygon([hexBoundary]);
        return turf.feature(hexPolygon.geometry, { id: hexId });
    });
    // Create a FeatureCollection with hexagon geometries
    const hexGeoJSON = turf.featureCollection(hexFeatures);
    return hexGeoJSON;
}
// Function to update miners with hex ID
const updateMinersWithHexId = (resolution) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield mongoclient_1.default;
    const db = client.db("main");
    const collection = db.collection("devices");
    // Find miners with a position field
    const miners = yield collection.find({ position: { $exists: true } }).toArray();
    // Update each miner with the hex ID
    for (const miner of miners) {
        const { lng, lat } = miner.position;
        const hexId = h3.latLngToCell(lat, lng, resolution);
        yield collection.updateOne({ _id: miner._id }, { $set: { hexId } });
    }
    console.log("Miners updated with hex IDs successfully.");
});
// Adjust the resolution as needed
const resolution = 8;
const hexGeoJSON = createHexGrid(pointsGeoJSON, resolution);
console.log(hexGeoJSON);
// Save hex grid to a GeoJSON file
fs.writeFileSync("hex_grid.geojson", JSON.stringify(hexGeoJSON, null, 2));
// Update miners with hex IDs
updateMinersWithHexId(resolution).catch(console.error);
