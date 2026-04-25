import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Zone from "./models/Zone.js";
import Sensor from "./models/Sensor.js";
import Alert from "./models/Alert.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  try {
    const zones = await Zone.find();
    console.log("Zones found:", zones.length);
    if (zones.length === 0) return;

    const randomZone = zones[0];
    const randomSeverity = "high";
    const randomAnimal = "elephant";

    randomZone.riskLevel = randomSeverity;
    randomZone.alertsCount = (randomZone.alertsCount || 0) + 1;
    randomZone.intrusionsToday = (randomZone.intrusionsToday || 0) + 1;

    if (!randomZone.position || !randomZone.position.top) {
        randomZone.position = { top: "20%", left: "20%" };
    }

    randomZone.temperature = Math.floor(Math.random() * (38 - 24) + 24);
    randomZone.humidity = Math.floor(Math.random() * (90 - 40) + 40);

    console.log("Saving zone...");
    await randomZone.save();
    console.log("Zone saved successfully");

    const allSensors = await Sensor.find();
    console.log("Sensors found:", allSensors.length);
    let targetSensor = null;
    if (allSensors.length > 0) {
      const zoneSensors = allSensors.filter(s => s.zone?.toString() === randomZone._id.toString());
      targetSensor = zoneSensors.length > 0 
        ? zoneSensors[Math.floor(Math.random() * zoneSensors.length)]
        : allSensors[Math.floor(Math.random() * allSensors.length)];

      if (randomSeverity === "high") {
        targetSensor.status = "critical";
      } else if (randomSeverity === "medium") {
        targetSensor.status = "warning";
      } else {
        targetSensor.status = "normal";
      }
      await targetSensor.save();
    }
    console.log("Sensor saved successfully");

    const newAlert = new Alert({
      zone: randomZone._id,
      sensor: targetSensor?._id,
      message: `AUTO: ${randomAnimal} in ${randomZone.name}`,
      animalType: randomAnimal,
      severity: randomSeverity,
    });

  } catch (err) {
    console.error("Simulation error:", err.message);
  } finally {
    mongoose.disconnect();
  }
}

run();
