import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ROLES } from "../constants/roles.js";
import sendEmail from "../utils/sendEmail.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase();
    
    const userExist = await User.findOne({ email: normalizedEmail });
    
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate Verification Token (Bypassed for now)
    // const verificationToken = crypto.randomBytes(32).toString("hex");
    // const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const assignedRole = role || ROLES.USER;
    const initialStatus = assignedRole === ROLES.ADMIN ? "active" : "pending_approval";

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      status: initialStatus,
      isEmailVerified: true,
    });

    // Send Verification Email (Bypassed)
    /*
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const emailHtml = `...`;

    await sendEmail({
      to: email,
      subject: "Verify Your Email - Smart Farm Security",
      html: emailHtml,
    });
    */

    res.status(201).json({
      message: "Registration successful! Account verified automatically (Email bypassed).",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Invalid or missing token" });
    }

    // Try finding by token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      // Check if any user is already verified (in case they clicked twice)
      // This is hard to check without the email, but we can return a better message
      return res.status(400).json({ 
        message: "Invalid or expired verification token. If you've already verified, please try logging in." 
      });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    
    // Automatically approve Admins
    if (user.role === ROLES.ADMIN) {
      user.status = "active";
    } else {
      user.status = "pending_approval";
    }
    
    await user.save();

    res.json({
      message: user.role === ROLES.ADMIN 
        ? "Email verified successfully! Your admin account is now active."
        : "Email verified successfully! Your account is now awaiting administrator approval.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // --- REVISED VERIFICATION CHECK (Backward Compatible) ---
    // If the account is already 'active', we assume they are verified (for legacy users)
    const isLegacyActive = user.status === "active" && user.isEmailVerified === undefined;
    const isVerifiedOrLegacy = user.isEmailVerified || isLegacyActive || user.status === "active";

    if (!isVerifiedOrLegacy) {
      return res.status(403).json({ message: "Please verify your email address first." });
    }

    if (user.status === "pending_approval") {
      return res.status(403).json({ message: "Your account is pending administrator approval." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Your account is inactive. Please contact support." });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({
      message: "Login successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "No user found with that email address." });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const emailHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #10b981; width: 64px; height: 64px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; color: white;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
        </div>
        <h2 style="color: #0f172a; text-align: center; font-weight: 800; margin-bottom: 8px;">Reset Security Key</h2>
        <p style="color: #64748b; text-align: center; margin-bottom: 32px;">A request was made to reset the password for your Smart Farm account.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">Reset Password</a>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.6;">If you did not request this, please ignore this email. This link will expire in 60 minutes.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Reset Password - Smart Farm Security",
      html: emailHtml,
    });

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send reset link." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
      }
    );

    res.json({ message: "Password reset successful! You can now login with your new security key." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Reset failed." });
  }
};
