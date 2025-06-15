const express = require("express");
const router = express.Router();
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = "mongodb+srv://..."; // your Mongo URI
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

const db = client.db("biosonic");
const users = db.collection("bioUsers");

router.get("/:id", async (req, res) => {
  try {
    const user = await users.findOne({ _id: new ObjectId(req.params.id) });

    if (!user) return res.status(404).json({ error: "User not found" });

    const { firstName, lastName, email } = user;
    res.json({ firstName, lastName, email });
  } catch (error) {
    console.error("User fetch error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
