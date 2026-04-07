import express from "express";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";
import { getAllUsers, updateUser, createUser, deleteUser, checkEmail } from "../controllers/userController.js";

const router = express.Router();

router.get("/users", protect, allowRoles(ROLES.ADMIN), getAllUsers);
router.get("/users/check-email", protect, allowRoles(ROLES.ADMIN), checkEmail);
router.post("/users", protect, allowRoles(ROLES.ADMIN), createUser);
router.put("/users/:id", protect, allowRoles(ROLES.ADMIN), updateUser);
router.delete("/users/:id", protect, allowRoles(ROLES.ADMIN), deleteUser);



router.get(
  "/dashboard",
  protect,
  allowRoles(ROLES.ADMIN),
  (req, res) => {
    res.json({ message: "Welcome Admin" });
  }
);

export default router;
