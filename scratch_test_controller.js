import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { startSimulation, getSimulationStatus, stopSimulation } from "./controllers/simulationController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  try {
    const req = { body: { interval: 1000 } };
    const res = {
      status: (code) => ({
        json: (data) => console.log(`Response ${code}:`, data),
      }),
      json: (data) => console.log(`Response 200:`, data),
    };

    console.log("Calling startSimulation...");
    startSimulation(req, res);
    
    // wait 3 seconds to let interval run 3 times
    await new Promise(resolve => setTimeout(resolve, 3500));
    console.log("Calling stopSimulation...");
    stopSimulation(req, res);

  } catch(e) { console.error(e); }
  mongoose.disconnect();
}
run();
