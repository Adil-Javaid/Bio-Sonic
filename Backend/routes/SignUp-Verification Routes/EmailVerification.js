const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/UserSchema");
const { sendVerificationEmail } = require("../utils/emailService");

const router = express.Router();
router.get("/verify-email", async (req, res) => {
    const { token } = req.query;
  
    try {
      const decoded = jwt.verify(token, "secretKey");
      const user = await User.findOneAndUpdate(
        { email: decoded.email },
        { isVerified: true }
      );
  
      if (!user) {
        return res.status(400).send("Invalid verification link.");
      }
  
      res.send("Email verified successfully!");
    } catch (error) {
      res.status(400).send("Invalid or expired token.");
    }
  });
  
  module.exports = router;