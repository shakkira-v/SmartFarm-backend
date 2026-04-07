import express from "express";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";
import {
  createZone,
  getZones,
  updateZone,
  deleteZone,
  getZoneById,
  getZoneCards,
} from "../controllers/zoneController.js";

const router = express.Router();

router.post("/", protect, allowRoles(ROLES.MANAGER, ROLES.USER), createZone);
router.get("/", protect, getZones);
router.get("/cards", protect, getZoneCards);
router.put("/:id", protect, allowRoles(ROLES.MANAGER, ROLES.USER), updateZone);
router.delete("/:id", protect, allowRoles(ROLES.MANAGER, ROLES.USER), deleteZone);
router.get("/:id", protect, getZoneById);

export default router;

