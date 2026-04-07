import Zone from "../models/Zone.js";
import Alert from "../models/Alert.js";
import Sensor from "../models/Sensor.js";
import User from "../models/User.js";

// DASHBOARD SUMMARY
export const getDashboardStats = async (req, res) => {
  try {
    const totalZones = await Zone.countDocuments();
    const totalSensors = await Sensor.countDocuments();
    const activeSensors = await Sensor.countDocuments({ status: { $in: ["normal", "active"] } });
    const warningSensors = await Sensor.countDocuments({ status: "warning" });
    const criticalSensors = await Sensor.countDocuments({ status: "critical" });
    // Inactive is anything not normal/active
    const inactiveSensors = totalSensors - activeSensors;

    const criticalAlerts = await Alert.countDocuments({
      severity: "high",
      status: { $ne: "resolved" }
    });

    const totalAlerts = await Alert.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const intrusionsToday = await Alert.countDocuments({
      createdAt: { $gte: today }
    });

    console.log(`[STATS] Sensors: T:${totalSensors} A:${activeSensors} W:${warningSensors} C:${criticalSensors}`);

    const zonesAtRisk = await Zone.countDocuments({
      riskLevel: "high"
    });

    const usersCount = await User.countDocuments({ status: "active" });
    const pendingApprovals = await User.countDocuments({ status: "pending_approval" });

    // --- Climate Aggregation ---
    const climateStats = await Zone.aggregate([
      {
        $group: {
          _id: null,
          avgTemp: { $avg: "$temperature" },
          avgHumidity: { $avg: "$humidity" }
        }
      }
    ]);

    const avgTemp = climateStats.length > 0 ? Math.round(climateStats[0].avgTemp) : 28;
    const avgHumidity = climateStats.length > 0 ? Math.round(climateStats[0].avgHumidity) : 65;


    res.json({
      totalZones,
      totalSensors,
      activeSensors,
      warningSensors,
      criticalSensors,
      inactiveSensors,
      criticalAlerts,
      totalAlerts,
      intrusionsToday,
      zonesAtRisk,
      usersCount,
      pendingApprovals,
      avgTemp,
      avgHumidity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RECENT ALERTS TABLE
export const getRecentAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate("zone")
      .populate("sensor")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ZONE CARDS DATA
export const getZoneCards = async (req, res) => {
  try {
    const zones = await Zone.find().lean();
    
    // Attach sensor statistics to each zone
    const zoneDataWithSensors = await Promise.all(zones.map(async (zone) => {
      const sensors = await Sensor.find({ zone: zone._id });
      return {
        ...zone,
        sensorStats: {
          total: sensors.length,
          healthy: sensors.filter(s => s.status === 'normal' || s.status === 'active').length,
          warning: sensors.filter(s => s.status === 'warning').length,
          critical: sensors.filter(s => s.status === 'critical').length
        }
      };
    }));

    res.json(zoneDataWithSensors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ALERT GRAPH DATA (Last 7 Days)
export const getAlertGraphData = async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
    startDate.setHours(0, 0, 0, 0);

    const data = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          alerts: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days with 0
    const result = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const match = data.find(item => item._id === dateStr);
      
      result.push({
        day: `${days[d.getDay()]} (${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')})`,
        alerts: match ? match.alerts : 0,
        fullDate: dateStr
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ANIMAL GRAPH DATA
export const getAnimalGraphData = async (req, res) => {
  try {
    const data = await Alert.aggregate([
      {
        $group: {
          _id: "$animalType",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//get Single Alert
export const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getDashboardData = async (req, res) => {
  const role = req.user.role;

  if (role === "admin") {
    return res.json({
      type: "admin",
      stats: {
        users: await User.countDocuments(),
        zones: await Zone.countDocuments(),
        sensors: await Sensor.countDocuments(),
        alerts: await Alert.countDocuments()
      }
    });
  }

  if (role === "manager") {
    return res.json({
      type: "manager",
      stats: {
        zones: await Zone.countDocuments(),
        sensors: await Sensor.countDocuments(),
        alerts: await Alert.countDocuments()
      }
    });
  }

  // user
  return res.json({
    type: "user",
    message: "Read-only dashboard"
  });
};


export const getAnimalStats = async (req, res) => {
  try {
    const range = req.query.range || "weekly";

    // ⏱ Date filter
    const startDate = new Date();
    if (range === "weekly") {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    const data = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$animalType",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          animal: "$_id",
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getZoneAlertStats = async (req, res) => {
  try {
    const range = req.query.range || "weekly";

    const startDate = new Date();
    if (range === "weekly") {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    const data = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$zone",
          alerts: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "zones",
          localField: "_id",
          foreignField: "_id",
          as: "zone"
        }
      },
      { $unwind: "$zone" },
      {
        $project: {
          _id: 0,
          zone: "$zone.name",
          alerts: 1
        }
      },
      {
        $sort: { alerts: -1 }
      }
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getZoneMapData = async (req, res) => {
  try {
    const zones = await Zone.find().lean();
    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
