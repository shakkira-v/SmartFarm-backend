import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getDashboardStats,
  getRecentAlerts,
  getZoneCards,
  getAlertGraphData,
  getAnimalGraphData,
  getAlertById,
  getDashboardData,
  getAnimalStats,
  getZoneAlertStats,
  getZoneMapData
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", protect, getDashboardStats);
router.get("/alerts/recent", protect, getRecentAlerts);

router.get("/zones/cards", protect, getZoneCards);
router.get("/alerts/graph", protect, getAlertGraphData);
router.get("/animals/graph", protect, getAnimalGraphData);
router.get("/alerts/:id", protect, getAlertById);
router.get("/", protect, getDashboardData);
router.get("/animal-stats", protect, getAnimalStats);
router.get("/zone-stats", protect, getZoneAlertStats);
router.get("/zones/map", protect, getZoneMapData);

export default router;
