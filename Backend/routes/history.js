// routes/history.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

// Replace with LAN IP of your machine running FastAPI
const FASTAPI_URL = "http://127.0.0.1:7860";

router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const response = await axios.get(`${FASTAPI_URL}/predictions/${user_id}`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching predictions:", error.message);
    res.status(500).json({
      error:
        error?.response?.data?.detail ||
        error.message ||
        "Failed to fetch predictions",
    });
  }
});

module.exports = router;
