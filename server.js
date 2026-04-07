import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { initSocket } from "./socket.js";
import connectDB from "./config/db.js";
// import User from "./models/User.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import zoneRoutes from "./routes/zoneRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import simulationRoutes from "./routes/simulationRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import cron from "node-cron";
import { performBackupAndReset } from "./backupUtils.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/simulate", simulationRoutes);
app.use("/api/system", systemRoutes);

// --- ⏰ AUTOMATED MAINTENANCE (Every 14 Days) ---
// Runs at midnight every 14 days to back up and reset the system
cron.schedule("0 0 */14 * *", async () => {
  await performBackupAndReset();
});



app.get("/", (req, res) => {
  res.send("Smart Farm Security Server Running");
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
