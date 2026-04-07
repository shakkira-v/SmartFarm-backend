import Alert from "../models/Alert.js";
import Zone from "../models/Zone.js";
import Sensor from "../models/Sensor.js";
import User from "../models/User.js";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit-table";
import { performBackupAndReset } from "../backupUtils.js";
import nodemailer from "nodemailer";

// 📊 EXPORT AS CSV
export const exportDataCSV = async (req, res) => {
  try {
    const alerts = await Alert.find().populate("zone").lean();
    
    const fields = [
      { label: "Date", value: "createdAt" },
      { label: "Zone", value: "zone.name" },
      { label: "Message", value: "message" },
      { label: "Animal", value: "animalType" },
      { label: "Severity", value: "severity" },
      { label: "Status", value: "status" }
    ];
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(alerts);
    
    res.header("Content-Type", "text/csv");
    res.attachment(`farm_security_backup_${Date.now()}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📄 EXPORT AS PDF (Table Format)
export const exportDataPDF = async (req, res) => {
  try {
    const alerts = await Alert.find().populate("zone").sort({ createdAt: -1 });
    
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.header("Content-Type", "application/pdf");
    res.attachment(`farm_security_report_${Date.now()}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("Smart Farm Security - Detailed Alert Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown(2);

    const table = {
      title: "Recent Intrusions & Alerts",
      subtitle: "Full history of animal detections and system alerts",
      headers: [
        { label: "Date", property: 'date', width: 80 },
        { label: "Zone", property: 'zone', width: 70 },
        { label: "Animal", property: 'animal', width: 60 },
        { label: "Severity", property: 'severity', width: 60 },
        { label: "Details", property: 'details', width: 200 },
      ],
      datas: alerts.map(alert => ({
        date: alert.createdAt.toLocaleDateString(),
        zone: alert.zone?.name || "N/A",
        animal: alert.animalType || "N/A",
        severity: alert.severity.toUpperCase(),
        details: alert.message
      })),
    };

    await doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
      prepareRow: (row, index, column, rect, bgColor) => {
        doc.font("Helvetica").fontSize(9);
      },
    });

    doc.end();
  } catch (error) {
    console.error("PDF Export Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🧹 SYSTEM RESET (Admin Only)
export const resetSystemData = async (req, res) => {
  const result = await performBackupAndReset();
  
  if (result.success) {
    res.json({ 
      message: "System data backed up and reset successfully!", 
      backupFile: result.file 
    });
  } else {
    res.status(500).json({ 
      message: "Reset failed", 
      error: result.error 
    });
  }
};

// 📧 CONTACT ADMIN (Nodemailer Implementation)
export const contactAdmin = async (req, res) => {
  const { name, subject, message } = req.body;

  if (!name || !subject || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const rawPass = process.env.EMAIL_PASS || "";
    const cleanPass = rawPass.replace(/\s+/g, ""); // Auto-clean Gmail App Password spaces

    // 1. Setup Transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: cleanPass,
      },
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    // 2. Define Email Options
    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: process.env.EMAIL_USER, // Optional: if you want to reply back
      subject: `[SmartFarm Contact] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 20px;">
          <h2 style="color: #052e16; border-bottom: 2px solid #10b981; padding-bottom: 10px;">New Message from Smart Farm</h2>
          <p style="font-size: 14px; color: #64748b;">A user has submitted a contact form from the Smart Farm Security platform.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; margin-top: 20px;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p style="font-style: italic; color: #334155; line-height: 1.6;">"${message}"</p>
          </div>
          
          <p style="margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center;">
            This transmission was sent via the Vigilance Core AI Security Channel.
          </p>
        </div>
      `,
    };

    // 3. Send Email
    await transporter.sendMail(mailOptions);

    res.json({ message: "Transmission successful! The administrator has been notified." });
  } catch (error) {
    console.error("Nodemailer Error Details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message
    });
    
    let errorMsg = "Transmission failed. ";
    if (error.code === 'EAUTH') errorMsg += "Authentication error. Check EMAIL_USER and EMAIL_PASS.";
    else if (error.code === 'ETIMEDOUT') errorMsg += "Connection timed out. Check your firewall.";
    else if (error.code === 'ESOCKET') errorMsg += "Network connection error.";
    else errorMsg += "Check server configuration.";

    res.status(500).json({ message: errorMsg });
  }
};
