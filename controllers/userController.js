import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ROLES } from "../constants/roles.js";

// GET ALL USERS (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE USER (Admin only)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || ROLES.USER,
      status: status || "active",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE USER (Admin only)
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.status = status || user.status;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// DELETE USER (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🛡️ Security Guard: Prevent deleting itself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: "Security Violation: Self-deletion is strictly prohibited." });
    }

    // 🛡️ Security Guard: Prevent deleting ANY Admin account via API
    if (user.role === ROLES.ADMIN) {
      return res.status(403).json({ message: "Access Denied: Administrative profiles are protected and cannot be removed via this interface." });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CHECK IF EMAIL EXISTS (Admin only)
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email }).select("name role status createdAt");
    if (user) {
      return res.json({ 
        exists: true, 
        user: {
          name: user.name,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        } 
      });
    }
    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
