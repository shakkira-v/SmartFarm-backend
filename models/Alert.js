import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      required: true
    },

    sensor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sensor"
    },

    message: {
      type: String,
      required: true
    },

    animalType: {
      type: String,
      enum: ["elephant", "boar", "deer", "cow", "dog", "fox", "monkey", "bear", "leopard", "rabbit", "unknown", "climate"],
      default: "unknown"
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    status: {
      type: String,
      enum: ["active", "resolved","acknowledged"],
      default: "active"
    },
    detectedAt: {
      type: Date,
      default: Date.now
    },
    riskImpact: {
      type: Number,
      default: 1 // 1–5 (for zone risk calc)
    },
    detectionMethod: {
      type: String,
      enum: ["sensor", "vision", "climate"],
      default: "sensor"
    },
    videoUrl: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);
