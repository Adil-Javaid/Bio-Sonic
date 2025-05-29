const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const User = require("../../Schema/User/UserRoleSchema");
const passport = require("passport");
const cors = require("cors");

const router = express.Router();
router.use(
  cors({
    origin: [
      "http://localhost:8081",
      "http://192.168.100.9:8081",
      "http://192.168.1.19:8081",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"], // Ensure POST is allowed
    credentials: true,
  })
);

// Session Middleware 
router.use(
  session({
    secret: process.env.JWT_SECRET || "default_secret", 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }, 
  })
);

// Passport Session Setup
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// In your backend login route (login.js)
router.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log("Login attempt for username:", username);

    // Case-insensitive search for username - removed accessGranted check
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });

    if (!user) {
      console.log("User not found");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("User found, comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("Credentials valid, generating token...");
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Login successful for user:", user.username);
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        accessGranted: user.accessGranted, // Include verification status
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
router.post("/change-password", async (req, res) => {
  console.log("POST /change-password request received:", req.body); // Log the request body
  const { username, currentPassword, newPassword } = req.body;

  // Validate required fields
  if (!username || !currentPassword || !newPassword) {
    console.log("Missing fields in request body");
    return res.status(400).json({ success: false, message: "Missing fields." });
  }

  try {
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      console.log("User not found:", username);
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      console.log("Current password is incorrect");
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log("Password changed successfully for user:", user.username);
    res
      .status(200)
      .json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("Error changing password:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to change password." });
  }
});

module.exports = router;
