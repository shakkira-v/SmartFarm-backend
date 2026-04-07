import express from "express";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";
import {
  createSensor,
  getSensors,
  updateSensor,
  deleteSensor,
  getSensorById,
  syncSensors
} from "../controllers/sensorController.js";

const router = express.Router();

router.post("/", protect, allowRoles(ROLES.MANAGER, ROLES.USER), createSensor);
router.post("/sync", protect, allowRoles(ROLES.MANAGER, ROLES.USER), syncSensors);
router.get("/", protect, getSensors);
router.put("/:id", protect, allowRoles(ROLES.MANAGER, ROLES.USER), updateSensor);
router.delete("/:id", protect, allowRoles(ROLES.MANAGER, ROLES.USER), deleteSensor);
router.get("/:id", protect, getSensorById);

export default router;

