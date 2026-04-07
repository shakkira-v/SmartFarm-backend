import Zone from "../models/Zone.js";

// CREATE ZONE
export const createZone = async (req, res) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json(zone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL ZONES
export const getZones = async (req, res) => {
  try {
    const zones = await Zone.find().populate("manager", "name email");
    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getZoneCards = async (req, res) => {
  try {
    const zones = await Zone.find().populate("manager", "name");

    const formattedZones = zones.map(zone => {
      const capacity = zone.threshold
        ? Math.min((zone.alertsCount / zone.threshold) * 100, 100)
        : 0;

      return {
        _id: zone._id,
        name: zone.name,
        description: zone.description,
        crop: zone.crop,
        threshold: zone.threshold,
        alertsCount: zone.alertsCount,
        intrusionsToday: zone.intrusionsToday,
        riskLevel: zone.riskLevel,
        status: zone.status,
        capacity: capacity.toFixed(0)
      };
    });

    res.json(formattedZones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET SINGLE ZONE
export const getZoneById = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }

    res.json(zone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE ZONE
export const updateZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }

    res.json( { message: "Zone updated successfully",zone});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ZONE
export const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);

    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }

    res.json({ message: "Zone deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
