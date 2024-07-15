import * as h3 from "h3-js";
import * as fs from "fs";
import * as turf from "@turf/turf";
import clientPromise from "./db/mongoclient";

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
        const hexPolygon = turf.polygon([hexBoundary]);
        return turf.feature(hexPolygon.geometry, { id: hexId });
    });

    // Create a FeatureCollection with hexagon geometries
    const hexGeoJSON = turf.featureCollection(hexFeatures);
    return hexGeoJSON;
}

// Function to update miners with hex ID
const updateMinersWithHexId = async (resolution: number) => {
    console.log("Updating miners with hex IDs...");
    const client = await clientPromise;
    const db = client.db("main");
    const collection = db.collection("devices");

    // Find miners with a position field
    console.log("Finding miners with a position field...");
    const miners = await collection.find({ position: { $exists: true } }).toArray();

    // Update each miner with the hex ID
    for (const miner of miners) {
        console.log("hey");
        const { lng, lat } = miner.position;
        const hexId = h3.latLngToCell(lat, lng, resolution);

        await collection.updateOne(
            { _id: miner._id },
            { $set: { hexId } }
        );
    }

};

// Adjust the resolution as needed
const resolution = 8;
console.log("Creating hex grid with resolution", resolution);
const hexGeoJSON = createHexGrid(pointsGeoJSON, resolution);
console.log(hexGeoJSON);

// Save hex grid to a GeoJSON file
fs.writeFileSync("hex_grid.geojson", JSON.stringify(hexGeoJSON, null, 2));
console.log("Hex grid GeoJSON generated successfully.");

// Update miners with hex IDs
updateMinersWithHexId(resolution).then(() => {
    console.log("Miners updated with hex IDs successfully.");
    process.exit(0);
});
