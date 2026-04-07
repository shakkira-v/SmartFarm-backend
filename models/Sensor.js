import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema({
  name: String,
  type: {
    type: String,
    enum: ["temperature", "motion", "humidity"]
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Zone"
  },
  value:{
  type: Number,
  default: 0
},
  status: {
    type: String,
    enum: ["normal", "warning", "critical", "pending"],
    default: "normal"
  },
  threshold: {
    type: Number,
    default: 50
  }
}, { timestamps: true });

export default mongoose.model("Sensor", sensorSchema);
