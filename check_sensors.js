import mongoose from 'mongoose';
import Sensor from './models/Sensor.js';
import dotenv from 'dotenv';
dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-farm');
    const sensors = await Sensor.find();
    console.log('Total Sensors:', sensors.length);
    const statuses = sensors.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
    console.log('Statuses:', statuses);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
