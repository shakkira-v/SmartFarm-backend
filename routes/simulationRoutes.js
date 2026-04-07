import express from "express";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";
import { 
  triggerRandomIntrusion, 
  startSimulation, 
  stopSimulation,
  getSimulationStatus,
  triggerVisionIntrusion
} from "../controllers/simulationController.js";

const router = express.Router();

router.get("/status", protect, getSimulationStatus);
router.post("/trigger", protect, triggerRandomIntrusion);
router.post("/vision", protect, triggerVisionIntrusion);
router.post("/start", protect, allowRoles(ROLES.ADMIN, ROLES.MANAGER), startSimulation);
router.post("/stop", protect, allowRoles(ROLES.ADMIN, ROLES.MANAGER), stopSimulation);

export default router;
