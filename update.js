"use strict";
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
const child_process_1 = require("child_process");
const path_1 = require("path");
const mongoclient_1 = __importDefault(require("./db/mongoclient"));
const fs_1 = __importDefault(require("fs"));
// Define the paths for the scripts and files
const hexGridScript = (0, path_1.join)(__dirname, "generateGrid.js");
const geojsonFile = (0, path_1.join)(__dirname, "hex_grid.geojson");
const mbtilesFile = (0, path_1.join)(__dirname, "hex_grid.mbtiles");
// Function to execute a shell command and return it as a Promise
const execShellCommand = (cmd) => {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
                reject(stderr);
            }
            resolve(stdout ? stdout : stderr);
        });
    });
};
// Run the hex grid script
const getMinerPoints = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield mongoclient_1.default;
    const db = client.db("main");
    const collection = db.collection("devices");
    //find miners with a position field
    const miners = yield collection.find({ position: { $exists: true } }).toArray();
    console.log(miners);
    //create a geojson file with the miners
    const geojson = {
        type: "FeatureCollection",
        features: miners.map((miner) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [miner.position.lng, miner.position.lat],
            },
            properties: {
                name: miner.nickname ? miner.nickname : miner.name,
            },
        })),
    };
    fs_1.default.writeFileSync("miners.geojson", JSON.stringify(geojson, null, 2));
    console.log("Miners GeoJSON generated successfully.");
});
const runHexGridScript = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Running TypeScript script to generate hex grid...");
    try {
        const result = yield execShellCommand(`node ${hexGridScript}`);
        console.log(result);
        console.log("Hex grid GeoJSON generated successfully.");
    }
    catch (error) {
        console.error("Error generating hex grid GeoJSON:", error);
    }
});
// Convert the generated GeoJSON to MBTiles using Tippecanoe
const convertToMbtiles = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Converting GeoJSON to MBTiles...");
    try {
        const result = yield execShellCommand(`tippecanoe -o ${mbtilesFile} --force --drop-densest-as-needed --extend-zooms-if-still-dropping --no-tile-size-limit ${geojsonFile}`);
        console.log(result);
        const miners = yield execShellCommand(`tippecanoe -o miners.mbtiles --force --drop-densest-as-needed --extend-zooms-if-still-dropping --no-tile-size-limit miners.geojson`);
        console.log(miners);
        console.log("MBTiles file created successfully.");
    }
    catch (error) {
        console.error("Error creating MBTiles file:", error);
    }
});
// Run the entire update process
const runUpdateProcess = () => __awaiter(void 0, void 0, void 0, function* () {
    yield getMinerPoints();
    yield runHexGridScript();
    yield convertToMbtiles();
});
runUpdateProcess();
