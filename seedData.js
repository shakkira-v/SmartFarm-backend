import mongoose from "mongoose";
import dotenv from "dotenv";
import Alert from "./models/Alert.js";
import Zone from "./models/Zone.js";
import connectDB from "./config/db.js";

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log("Cleaning Database...");
    await Alert.deleteMany({});
    await Zone.deleteMany({});
    console.log("Database cleared.");

    console.log("Creating Zones...");
    const zoneDocs = await Zone.insertMany([
      {
        name: "North Field",
        description: "Main crop field",
        location: { lat: 10, lng: 10 },
        riskLevel: "low"
      },
      {
        name: "South Barn",
        description: "Storage barn area",
        location: { lat: 11, lng: 11 },
        riskLevel: "high"
      }
    ]);
    
    console.log(`Created ${zoneDocs.length} zones.`);

    console.log("Seeding Alerts...");
    const sampleAlerts = [
      {
        message: "Motion detected in North Field",
        severity: "low",
        animalType: "deer",
        status: "pending",
        zone: zoneDocs[0]._id
      },
      {
        message: "Wild Boar sighted near barn",
        severity: "high",
        animalType: "boar",
        status: "pending",
        zone: zoneDocs[1]._id
      },
      {
        message: "Unknown movement in perimeter",
        severity: "medium",
        animalType: "fox",
        status: "acknowledged",
        zone: zoneDocs[0]._id
      },
      {
        message: "Another boar sighting",
        severity: "high",
        animalType: "boar",
        status: "pending",
        zone: zoneDocs[1]._id
      },
      {
        message: "Dog barking triggered sensor",
        severity: "low",
        animalType: "dog",
        status: "acknowledged",
        zone: zoneDocs[0]._id
      }
    ];

    await Alert.insertMany(sampleAlerts);
    console.log("Alerts seeded successfully!");

    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
