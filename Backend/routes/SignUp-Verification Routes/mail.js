const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../../Schema/User/UserRoleSchema");
const router = express.Router();
// GET /verify/:token (Email Verification Route)
router.get("/:token", async (req, res) => {
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
  
      res.status(200).json({ message: "Email successfully verified. You can now log in." });
    } catch (error) {
      console.error("Error during email verification:", error);
      res.status(400).json({ message: "Invalid or expired token." });
    }
  });
  
  module.exports = router;