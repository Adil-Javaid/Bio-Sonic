const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../../Schema/User/UserRoleSchema");
const crypto = require("crypto");
require("dotenv").config();
const nodemailer = require("nodemailer");

const router = express.Router();
const formData = require("form-data");
const Mailgun = require("mailgun.js");

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API,
});

// Add expiration to OTP storage (10 minutes)
const otpStorage = {};

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "User not found with this email" 
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStorage[email] = {
      otp,
      expiresAt: Date.now() + 600000 // 10 minutes
    };

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 10 minutes.</p>
      `
    };

    await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
    });

    res.json({ 
      success: true,
      message: "OTP sent to your email" 
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to send OTP" 
    });
  }
});

router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = otpStorage[email];

  if (!storedOtp) {
    return res.status(400).json({ 
      success: false,
      message: "OTP expired or not requested" 
    });
  }

  if (Date.now() > storedOtp.expiresAt) {
    delete otpStorage[email];
    return res.status(400).json({ 
      success: false,
      message: "OTP has expired" 
    });
  }

  if (storedOtp.otp === otp) {
    // Create a reset token valid for 10 minutes
    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    
    delete otpStorage[email];
    res.json({ 
      success: true,
      message: "OTP verified",
      resetToken 
    });
  } else {
    res.status(400).json({ 
      success: false,
      message: "Invalid OTP" 
    });
  }
});

router.post("/reset-password", async (req, res) => {
  const { resetToken, newPassword } = req.body;
  
  if (!resetToken || !newPassword) {
    return res.status(400).json({ 
      success: false,
      message: "Token and new password are required" 
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const { email } = decoded;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { $set: { password: hashedPassword } });
    
    res.status(200).json({ 
      success: true,
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false,
        message: "Reset token has expired" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Failed to reset password" 
    });
  }
});

module.exports = router;
