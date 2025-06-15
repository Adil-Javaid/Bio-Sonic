const express = require("express");
const router = express.Router();
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = "mongodb+srv://..."; // your URI
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

const db = client.db("biosonic");
const diagnosesCollection = db.collection("diagnoses");

router.post("/", async (req, res) => {
  try {
    const { name, notes, patient_id, patient_name, user_id, predictions } = req.body;

    if (!name || !patient_id || !user_id || !predictions) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const diagnosis = {
  name,
  notes,
  patient_id,
  patient_name,
  user_id,
  predictions,
  timestamp: new Date(),
};

    const result = await diagnosesCollection.insertOne(diagnosis);

    res.json({
      status: "success",
      diagnosis_id: result.insertedId,
    });
  } catch (error) {
    console.error("Diagnosis save error:", error);
    res.status(500).json({ error: "Failed to save diagnosis" });
  }
});

router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const records = await diagnosesCollection
      .find({ user_id })
      .sort({ timestamp: -1 })
      .toArray();

    res.json({ status: "success", diagnoses: records });
  } catch (error) {
    console.error("Fetch diagnosis error:", error);
    res.status(500).json({ error: "Failed to fetch diagnosis history" });
  }
});

module.exports = router;
