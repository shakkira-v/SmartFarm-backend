import Alert from "../models/Alert.js";

// CREATE ALERT
export const createAlert = async (req, res) => {
  try {
    const {
      zone,
      sensor,
      message,
      severity,
      animalType
    } = req.body;

    const alert = await Alert.create({
      zone,
      sensor,
      message,
      severity,
      animalType
    });

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL ALERTS
export const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate("zone", "name riskLevel")
      .populate("sensor", "name")
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET RECENT ALERTS (DASHBOARD)
export const getRecentAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ status: "active" })
      .populate("zone", "name")
      .populate("sensor", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE ALERT
export const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate("zone")
      .populate("sensor");

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESOLVE ALERT (instead of generic update)
export const resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: "resolved" },
      { new: true }
    );

    res.json({
      message: "Alert resolved",
      alert
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ALERT
export const deleteAlert = async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: "Alert deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getRecentEvents = async (req, res) => {
  try {
    const events = await Alert.find()
      .populate("zone", "name")
      .populate("sensor", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};