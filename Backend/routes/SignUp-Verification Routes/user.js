const express = require("express");
const router = express.Router();
const User = require("../../Schema/User/UserRoleSchema");
const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; 
    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired. Please log in again." });
      }
      return res.status(401).json({ message: "Invalid token." });
    }

    const user = await User.findById(decoded.id).select("-password"); 
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
