const express = require("express");
const router = express.Router();

router.get("/logout", (req, res) => {
  try {
    // If using sessions, destroy the session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("session"); 
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
    
      res.status(200).json({ message: "Logged out successfully" });
    }
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;