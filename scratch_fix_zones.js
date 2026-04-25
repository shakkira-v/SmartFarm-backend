import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import Zone from "./models/Zone.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const zones = await Zone.find();
    for (const z of zones) {
       console.log(`Zone ${z.name}: position =`, z.position);
       if (!z.position || !z.position.top || !z.position.left) {
           console.log(`Fixing zone ${z.name}...`);
           z.position = { top: z.position?.top || "20%", left: z.position?.left || "20%" };
           await z.save();
           console.log(`Fixed zone ${z.name}`);
       }
    }
  } catch(e) { console.error(e); }
  mongoose.disconnect();
}
run();
