import Alert from "../models/Alert.js";
import Zone from "../models/Zone.js";
import Sensor from "../models/Sensor.js";
import { emitEvent } from "../socket.js";

let simulationInterval = null;

export const triggerRandomIntrusion = async (req, res) => {
  try {
    const zones = await Zone.find();
    if (zones.length === 0) {
      return res.status(400).json({ message: "No zones found to trigger intrusion" });
    }

    // 1. Pick a random zone
    const randomZone = zones[Math.floor(Math.random() * zones.length)];

    // 2. Pick a random animal
    const animals = ["elephant", "boar", "deer", "cow", "dog", "fox"];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];

    // 3. Pick a random severity
    const severities = ["low", "medium", "high"];
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];

    // 4. Update zone risk level and climate stats
    randomZone.riskLevel = randomSeverity;
    randomZone.alertsCount += 1;
    randomZone.intrusionsToday += 1;
    
    // Add climate randomization
    randomZone.temperature = Math.floor(Math.random() * (38 - 24) + 24);
    randomZone.humidity = Math.floor(Math.random() * (90 - 40) + 40);
    
    await randomZone.save();

    // --- SENSOR SYNC ---
    let targetSensor;
    const allSensors = await Sensor.find({ zone: randomZone._id }); // Try to find sensor in SAME zone first
    const backupSensors = await Sensor.find();
    
    // Pick sensor: preferentially from same zone, else global, else none
    targetSensor = (allSensors.length > 0) 
      ? allSensors[Math.floor(Math.random() * allSensors.length)]
      : (backupSensors.length > 0) ? backupSensors[Math.floor(Math.random() * backupSensors.length)] : null;

    if (targetSensor) {
      if (randomSeverity === "high") {
        targetSensor.status = "critical";
      } else if (randomSeverity === "medium") {
        targetSensor.status = "warning";
      } else {
        targetSensor.status = "normal";
      }
      await targetSensor.save();
    }

    // 5. Create the alert
    const newAlert = new Alert({
      zone: randomZone._id,
      sensor: targetSensor?._id,
      message: `Intrusion detected: ${randomAnimal} spotted in ${randomZone.name}`,
      animalType: randomAnimal,
      severity: randomSeverity,
      status: "active"
    });
    await newAlert.save();

    // 🚀 Emit real-time socket event
    emitEvent("new_intrusion", { 
      message: newAlert.message, 
      severity: newAlert.severity,
      zone: randomZone.name 
    });

    // Check for climate alerts immediately after update
    await checkClimateAlerts(randomZone);

    res.json({ message: `Simulated ${randomAnimal} in ${randomZone.name}`, alert: newAlert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const triggerVisionIntrusion = async (req, res) => {
  try {
    const { zoneId, animalType, videoUrl, severity = "high" } = req.body;
    
    const zone = await Zone.findById(zoneId);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    zone.riskLevel = severity;
    zone.alertsCount += 1;
    zone.intrusionsToday += 1;
    await zone.save();

    const newAlert = new Alert({
      zone: zone._id,
      message: `VISION: ${animalType} detected via Live Stream in ${zone.name}`,
      animalType,
      severity,
      detectionMethod: "vision",
      videoUrl: videoUrl || "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      status: "active"
    });
    await newAlert.save();

    emitEvent("new_intrusion", { 
      message: newAlert.message, 
      severity: newAlert.severity,
      zone: zone.name,
      detectionMethod: "vision"
    });

    res.json({ message: "Vision intrusion triggered", alert: newAlert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- ⛈️ CLIMATE ALERT ENGINE ---
const checkClimateAlerts = async (zone) => {
  let climateAlert = null;

  if (zone.temperature > 40) {
    climateAlert = {
      message: `CRITICAL HEAT: ${zone.name} is at ${zone.temperature}°C!`,
      severity: "high"
    };
  } else if (zone.humidity < 30) {
    climateAlert = {
      message: `EXTREME DRYNESS: Humidity in ${zone.name} dropped to ${zone.humidity}%`,
      severity: "medium"
    };
  }

  if (climateAlert) {
    const alert = new Alert({
      zone: zone._id,
      message: climateAlert.message,
      animalType: "climate",
      severity: climateAlert.severity
    });
    await alert.save();
    
    emitEvent("new_intrusion", {
      message: alert.message,
      severity: alert.severity,
      zone: zone.name
    });
  }
};

export const startSimulation = (req, res) => {
  const { interval = 5000 } = req.body; // Default 5 seconds for faster testing

  if (simulationInterval) {
    return res.status(400).json({ message: "Simulation already running" });
  }

  simulationInterval = setInterval(async () => {
    try {
      const zones = await Zone.find();
      const allSensors = await Sensor.find();
      if (zones.length === 0) return;

      const randomZone = zones[Math.floor(Math.random() * zones.length)];
      const animals = ["elephant", "boar", "deer", "cow", "dog", "fox"];
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      const randomSeverity = ["low", "medium", "high"][Math.floor(Math.random() * 3)];

      randomZone.riskLevel = randomSeverity;
      randomZone.alertsCount += 1;
      randomZone.intrusionsToday += 1;

      // Update climate for simulation event
      randomZone.temperature = Math.floor(Math.random() * (38 - 24) + 24);
      randomZone.humidity = Math.floor(Math.random() * (90 - 40) + 40);

      await randomZone.save();

      // Periodically fluctuate weather in OTHER zones to keep dashboard alive
      if (Math.random() > 0.5) {
        const otherZones = zones.filter(z => z._id.toString() !== randomZone._id.toString());
        for (const zone of otherZones) {
          // Subtle drift
          const tempDrift = (Math.random() > 0.5 ? 1 : -1);
          const humDrift = (Math.random() > 0.5 ? 2 : -2);
          
          zone.temperature = Math.max(20, Math.min(45, (zone.temperature || 28) + tempDrift));
          zone.humidity = Math.max(30, Math.min(95, (zone.humidity || 65) + humDrift));
          await zone.save();
        }
      }

      // --- SENSOR SYNC ---
      let targetSensor = null;
      if (allSensors.length > 0) {
        // Try to pick a sensor from the target zone first
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

      const newAlert = new Alert({
        zone: randomZone._id,
        sensor: targetSensor?._id,
        message: `AUTO: ${randomAnimal} in ${randomZone.name}`,
        animalType: randomAnimal,
        severity: randomSeverity,
      });
      await newAlert.save();

      // 🚀 Notify all connected screens instantly
      emitEvent("new_intrusion", { 
        message: newAlert.message, 
        severity: newAlert.severity,
        zone: randomZone.name 
      });

      // 🧤 Optional: Climate Alert Check (10% chance)
      if (Math.random() > 0.90) {
        await checkClimateAlerts(randomZone);
      }

      // Slower repair cycle (10% chance)
      if (Math.random() > 0.9) {
        const malfunction = await Sensor.find({ status: { $ne: "normal" } });
        if (malfunction.length > 0) {
          const s = malfunction[Math.floor(Math.random() * malfunction.length)];
          s.status = "normal";
          await s.save();
          console.log(`[SIMULATION] REPAIR: Sensor ${s.name}`);
        }
      }

    } catch (err) {
      console.error("Simulation error:", err.message);
    }
  }, interval);

  res.json({ message: `Simulation started with ${interval}ms interval` });
};

export const stopSimulation = (req, res) => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    return res.json({ message: "Simulation stopped" });
  }
  res.json({ message: "No simulation was running" }); // Changed to 200 to be more graceful
};

export const getSimulationStatus = (req, res) => {
  res.json({ isSimulating: !!simulationInterval });
};
