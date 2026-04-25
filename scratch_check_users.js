import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const users = await User.find({}, "name email role status");
    console.log("Users:", users);
  } catch(e) { console.error(e); }
  mongoose.disconnect();
}
run();
