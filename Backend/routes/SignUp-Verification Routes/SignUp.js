const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../../Schema/User/UserRoleSchema");
const axios = require("axios");
const router = express.Router();
const passport = require("passport");

const verifyEmail = async (email) => {
  try {
    const apiKey = process.env.KICKBOX_API_KEY;
    const url = `https://api.kickbox.com/v2/verify?email=${email}&apikey=${apiKey}`;

    const response = await axios.get(url);
    console.log("📧 Kickbox Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error verifying email:", error);
    return { success: false, message: "Verification failed" };
  }
};

// Email check endpoint
router.post("/check-email", async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).json({ valid: true, exists: true });
    }

    const emailVerification = await verifyEmail(email);
    res.status(200).json({
      valid: emailVerification.result === "deliverable",
      exists: false,
    });
  } catch (error) {
    res.status(500).json({ message: "Error verifying email" });
  }
});

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9]{0,9}$/; // Starts with a character, max length 10
  return usernameRegex.test(username);
};

const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // At least 8 characters, letters, and numbers
  return passwordRegex.test(password);
};

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// GET all users or a specific user
router.get("/users", async (req, res) => {
  const { email, username } = req.query;

  try {
    if (email) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      return res.status(200).json(user);
    }

    if (username) {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      return res.status(200).json(user);
    }

    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// POST /signup
router.post("/", async (req, res) => {
  const {
    username,
    email,
    password,
    role = "user",
    accessGranted = false,
  } = req.body;

  try {
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        message:
          "Invalid username. It must start with a letter and be up to 10 characters long.",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Invalid password. It must be at least 8 characters long and include both letters and numbers.",
      });
    }

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      isAdmin: role === "admin",
      accessGranted: false, // Access remains false until email is verified
    });

    await newUser.save();

    // Send the verification email
    const verificationLink = `http://192.168.100.9:8081/verify/${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Email Verification</h1>
          <p>Hi ${username},</p>
          <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
          
          <div style="margin: 20px 0;">
            <a href="${verificationLink}" 
               style="background-color: #2563eb; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${verificationLink}</p>
          
          <p style="color: #6b7280; font-size: 0.9rem;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("Verification email sent successfully.");
    res.status(201).json({
      message: "User created successfully. Verification email sent.",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      res
        .status(400)
        .json({
          message: "Duplicate entry. Username or email already exists.",
        });
    } else {
      console.error("Error during signup:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
});

// Email verification route
router.get("/verify/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.accessGranted) {
      return res.status(400).json({ message: "Email already verified." });
    }

    user.accessGranted = true;
    await user.save();

    res
      .status(200)
      .json({ message: "Email successfully verified. You can now log in." });
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(400).json({ message: "Invalid or expired token." });
  }
});

// Google OAuth Routes
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      let user = await User.findOne({ googleId: req.user.googleId });

      if (!user) {
        user = await User.findOne({ email: req.user.emails[0].value });
      }

      if (!user) {
        user = new User({
          googleId: req.user.googleId,
          email: req.user.emails[0].value,
          username:
            req.user.displayName || req.user.emails[0].value.split("@")[0],
          profilePicture: req.user.photos[0].value || null,
          role: "user",
          accessGranted: true,
        });
        await user.save();
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.redirect(
        `http://localhost:3000/home?token=${token}&username=${encodeURIComponent(
          user.username
        )}&profilePicture=${encodeURIComponent(user.profilePicture || "")}`
      );
    } catch (error) {
      console.error("Error with Google OAuth callback:", error);
      res.redirect("/");
    }
  }
);

// User analytics
router.get("/user-signups-over-time", async (req, res) => {
  try {
    const signupsOverTime = await User.aggregate([
      {
        $project: {
          year: { $year: "$signupDate" },
          month: { $month: "$signupDate" },
          day: { $dayOfMonth: "$signupDate" },
          signupDate: 1,
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month", day: "$day" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    res.status(200).json(signupsOverTime);
  } catch (error) {
    console.error("Error fetching signups over time:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/users", async (req, res) => {
  const { currentEmail, newEmail, username, phone } = req.body;

  try {
    const user = await User.findOne({ email: currentEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (newEmail !== currentEmail) {
      const emailExists = await User.findOne({ email: newEmail });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use." });
      }
    }

    if (username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: "Username already taken." });
      }
    }

    user.email = newEmail;
    user.username = username;
    user.phone = phone || user.phone;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully." });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Change Password
router.put("/change-password", async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include both letters and numbers.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Account
router.delete("/delete-account", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password is incorrect." });
    }

    await User.deleteOne({ _id: user._id });

    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
