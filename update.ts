import { exec } from "child_process";
import { join } from "path";
import clientPromise from "./db/mongoclient";
import fs from "fs";
// Define the paths for the scripts and files
const hexGridScript = join(__dirname, "generateGrid.js");
const geojsonFile = join(__dirname, "hex_grid.geojson");
const mbtilesFile = join(__dirname, "hex_grid.mbtiles");

// Function to execute a shell command and return it as a Promise
const execShellCommand = (cmd: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
                reject(stderr);
            }
            resolve(stdout ? stdout : stderr);
        });
    });
};

// Run the hex grid script
const getMinerPoints = async () => {
    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("devices");
    //find miners with a position field
    const miners = await collection.find({ position: { $exists: true } }).toArray();
    console.log(miners)
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
    fs.writeFileSync("miners.geojson", JSON.stringify(geojson, null, 2));
    console.log("Miners GeoJSON generated successfully.");

};

const runHexGridScript = async () => {
    console.log("Running TypeScript script to generate hex grid...");
    try {
        const result = await execShellCommand(`node ${hexGridScript}`);
        console.log(result);
        console.log("Hex grid GeoJSON generated successfully.");
    } catch (error) {
        console.error("Error generating hex grid GeoJSON:", error);
    }
};

// Convert the generated GeoJSON to MBTiles using Tippecanoe
const convertToMbtiles = async () => {
    console.log("Converting GeoJSON to MBTiles...");
    try {
        const result = await execShellCommand(`tippecanoe -o ${mbtilesFile} --force --drop-densest-as-needed --extend-zooms-if-still-dropping --no-tile-size-limit ${geojsonFile}`);
        console.log(result);
        const miners = await execShellCommand(`tippecanoe -o miners.mbtiles --force --drop-densest-as-needed --extend-zooms-if-still-dropping --no-tile-size-limit miners.geojson`);
        console.log(miners);
        console.log("MBTiles file created successfully.");
    } catch (error) {
        console.error("Error creating MBTiles file:", error);
    }
};

// Run the entire update process
const runUpdateProcess = async () => {
    await getMinerPoints();
    await runHexGridScript();
    await convertToMbtiles();
};

runUpdateProcess();
