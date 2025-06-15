// routes/predict.js
const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "temp/" });

router.post("/", upload.single("audio"), async (req, res) => {
  try {
    const { age, chest, gender, user_id } = req.body;
    const audioFile = req.file;

    if (!audioFile || !age || !chest || !gender) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const formData = new FormData();
    formData.append("audio", fs.createReadStream(audioFile.path), {
      filename: audioFile.originalname || "recording.wav",
      contentType: "audio/wav",
    });
    formData.append("age", age);
    formData.append("chest", chest);
    formData.append("gender", gender);
    if (user_id) formData.append("user_id", user_id);

    const fastApiURL = "http://127.0.0.1:7860/predict"; // Use LAN IP if needed

    const response = await axios.post(fastApiURL, formData, {
      headers: formData.getHeaders(),
      timeout: 15000, // Optional timeout
    });

    fs.unlink(audioFile.path, () => {}); // cleanup temp file
    return res.json(response.data);
  } catch (error) {
    console.error("Predict route error:", error.message);
    return res.status(500).json({
      error: error?.response?.data?.detail || error.message || "Server error",
    });
  }
});

module.exports = router;
