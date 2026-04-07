import express from "express";
import {
  createAlert,
  getAlerts,
  getRecentAlerts,
  getAlertById,
  resolveAlert,
  deleteAlert,
  getRecentEvents
} from "../controllers/alertController.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

/*
  ALERT ROUTES
  Base URL: /api/alerts
*/

// CREATE ALERT
router.post("/", protect, allowRoles(ROLES.MANAGER, ROLES.USER), createAlert);

// GET ALL ALERTS
router.get("/", protect, getAlerts);

// 🔥 RECENT ALERTS (Dashboard)
router.get("/recent", protect, getRecentAlerts);

// GET SINGLE ALERT
router.get("/:id", protect, getAlertById);

// RESOLVE ALERT
router.put("/:id/resolve", protect, allowRoles(ROLES.MANAGER, ROLES.USER), resolveAlert);

// DELETE ALERT (Manager/User Only)
router.delete("/:id", protect, allowRoles(ROLES.MANAGER, ROLES.USER), deleteAlert);



export default router;

