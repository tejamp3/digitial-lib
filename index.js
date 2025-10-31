import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// MongoDB client
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("MONGODB_URI not set in env");
  process.exit(1);
}
const client = new MongoClient(mongoUri);
let db;
async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DBNAME || "gate_library");
  }
  return db;
}

// POST add resource
app.post("/api/resources", async (req, res) => {
  try {
    const { title, description, pdfUrl, ytLink } = req.body || {};
    if (!title) return res.status(400).json({ error: "title required" });
    const db = await connectDB();
    const doc = {
      title,
      description: description || "",
      pdfUrl: pdfUrl || null,
      ytLink: ytLink || null,
      uploadedAt: new Date()
    };
    const result = await db.collection("resources").insertOne(doc);
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// GET resources
app.get("/api/resources", async (req, res) => {
  try {
    const db = await connectDB();
    const rows = await db.collection("resources").find({}).sort({ uploadedAt: -1 }).toArray();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// Serve index
app.get("/", (req, res) => res.sendFile(process.cwd() + "/public/index.html"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
