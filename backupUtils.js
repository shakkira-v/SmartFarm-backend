import fs from "fs-extra";
import path from "path";
import Alert from "./models/Alert.js";
import Zone from "./models/Zone.js";
import Sensor from "./models/Sensor.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Performs a system backup and reset.
 * Backs up data to the /backups folder and then clears relevant collections.
 */
export const performBackupAndReset = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, "backups");
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  console.log(`[SYSTEM] 🛡️ Starting backup to ${backupFile}...`);

  try {
    // 1. Ensure backup directory exists
    await fs.ensureDir(backupDir);

    // 2. Fetch data to backup
    const alerts = await Alert.find({}).lean();
    const zones = await Zone.find({}).lean();
    const sensors = await Sensor.find({}).lean();

    const backupData = {
      timestamp: new Date(),
      alerts,
      zones,
      sensors,
    };

    // 3. Write to file
    await fs.writeJson(backupFile, backupData, { spaces: 2 });
    console.log("[SYSTEM] 💾 Backup saved successfully.");

    // 4. Perform Reset
    console.log("[SYSTEM] 🧹 Resetting system data...");
    
    // Clear alerts completely
    await Alert.deleteMany({});
    
    // Reset Zone counters but keep the zones
    await Zone.updateMany({}, { 
      $set: { 
        intrusionsToday: 0, 
        alertsCount: 0, 
        riskLevel: "low" 
      } 
    });

    // Reset Sensor statuses
    await Sensor.updateMany({}, { 
      $set: { 
        status: "normal" 
      } 
    });

    console.log("[SYSTEM] ✅ 14-day maintenance (Backup & Reset) completed.");
    return { success: true, file: backupFile };
  } catch (error) {
    console.error("[SYSTEM] ❌ Maintenance failed:", error.message);
    return { success: false, error: error.message };
  }
};
