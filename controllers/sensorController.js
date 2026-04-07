import Sensor from "../models/Sensor.js";

// CREATE SENSOR
export const createSensor = async (req, res) => {
  try {
    const sensor = await Sensor.create(req.body);
    res.status(201).json(sensor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL SENSORS
export const getSensors = async (req, res) => {
  try {
    const sensors = await Sensor.find().populate("zone");
    res.json(sensors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE SENSOR
export const getSensorById = async (req, res) => {
  try {
    const sensor = await Sensor.findById(req.params.id).populate("zone");

    if (!sensor) {
      return res.status(404).json({ message: "Sensor not found" });
    }

    res.json(sensor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE SENSOR
export const updateSensor = async (req, res) => {
  try {
    const sensor = await Sensor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(sensor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE SENSOR
export const deleteSensor = async (req, res) => {
  try {
    await Sensor.findByIdAndDelete(req.params.id);
    res.json({ message: "Sensor deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SYNC ALL SENSORS (Simulate Network-wide Health Check)
export const syncSensors = async (req, res) => {
  try {
    const sensors = await Sensor.find();
    
    // Simulate updating statuses and values
    const updatedSensors = await Promise.all(sensors.map(async (sensor) => {
      // 90% chance to become 'normal' if it was in warning/critical
      if (sensor.status !== 'normal' && Math.random() > 0.5) {
        sensor.status = 'normal';
      }
      
      // Update with a fresh random value
      sensor.value = Math.floor(Math.random() * 100);
      
      return await sensor.save();
    }));

    res.json({ 
      message: "Sensor network synchronized successfully", 
      count: updatedSensors.length,
      sensors: updatedSensors 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
