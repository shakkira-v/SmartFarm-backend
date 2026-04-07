import mongoose from "mongoose";

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    description: {
      type:String,
      default: "No description"
    },

    crop: {
      type: String,
      default: "No crop specified"
    },
   

    threshold: {
      type: Number,
      default: 5
    },

    location: {
      lat: Number,
      lng: Number
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low"
    },

    // For visual zone map (grid layout)
   position: {
      top: { type: String, required: true },   // "20%"
      left: { type: String, required: true }   // "40%"
    },

    // Dashboard stats
    alertsCount: {
      type: Number,
      default: 0
    },

    intrusionsToday: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    
    // Climate Data
    temperature: {
      type: Number,
      default: 28
    },
    humidity: {
      type: Number,
      default: 65
    }
  },
  { timestamps: true }
);

export default mongoose.model("Zone", zoneSchema);
