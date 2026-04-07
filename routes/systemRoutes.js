import express from "express";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";
import { 
  exportDataCSV, 
  exportDataPDF, 
  resetSystemData,
  contactAdmin
} from "../controllers/systemController.js";

const router = express.Router();

router.get("/export/csv", protect, allowRoles(ROLES.ADMIN, ROLES.MANAGER), exportDataCSV);
router.get("/export/pdf", protect, allowRoles(ROLES.ADMIN, ROLES.MANAGER), exportDataPDF);
router.post("/reset", protect, allowRoles(ROLES.ADMIN), resetSystemData);
router.post("/contact", contactAdmin);

export default router;

