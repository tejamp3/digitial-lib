// ======== IMPORTS ========
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cloudinary from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import { fileURLToPath } from "url";

// ======== BASIC SETUP ========
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// Fix __dirname (since we’re using ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======== MIDDLEWARE ========
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serves index.html etc.

// ======== MONGODB CONNECTION ========
const MONGO_URI = process.env.MONGODB_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// ======== CLOUDINARY SETUP ========
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "gate_digital_library",
    resource_type: "raw", // allows PDFs
    allowed_formats: ["pdf"]
  },
});

const upload = multer({ storage });

// ======== SCHEMA ========
const resourceSchema = new mongoose.Schema({
  title: String,
  type: String, // 'pdf' or 'yt'
  url: String,
  uploadedAt: { type: Date, default: Date.now }
});

const Resource = mongoose.model("Resource", resourceSchema);

// ======== ROUTES ========

// ✅ Upload a PDF file to Cloudinary
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.json({
    message: "✅ File uploaded successfully!",
    url: req.file.path,
  });
});

// ✅ Add a resource (PDF or YouTube link)
app.post("/api/resources", async (req, res) => {
  try {
    const { title, type, url } = req.body;
    if (!title || !type || !url) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newResource = new Resource({ title, type, url });
    await newResource.save();
    res.json({ message: "✅ Resource added successfully!" });
  } catch (err) {
    res.status(500).json({ message: "❌ Error saving resource", error: err });
  }
});

// ✅ Get all resources
app.get("/api/resources", async (req, res) => {
  try {
    const allResources = await Resource.find().sort({ uploadedAt: -1 });
    res.json(allResources);
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching resources", error: err });
  }
});

// ✅ Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ======== START SERVER ========
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
