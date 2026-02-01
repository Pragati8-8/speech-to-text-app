require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const Groq = require("groq-sdk");
const Transcription = require('./models/Transcription');

const app = express();

// --- DEPLOYMENT & CONFIGURATION ---
// Render uses dynamic ports; Localhost uses 5000.
const port = process.env.PORT || 5000;

// Allow requests from any origin (Required for Vercel Frontend to talk to Render Backend)
app.use(cors({ origin: '*' }));
app.use(express.json());

// --- MULTER (File Handling) ---
// Create 'uploads' folder if it doesn't exist
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// --- DATABASE CONNECT ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- GROQ CLIENT ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- ROUTES ---

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    console.log(`📂 Processing: ${req.file.path}`);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-large-v3", 
    });

    const text = transcription.text;

    // Save to DB
    const newTranscription = new Transcription({ text });
    await newTranscription.save();

    // Clean up file to save server space
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    res.json({ text });

  } catch (error) {
    console.error('❌ Transcription Error:', error);
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const history = await Transcription.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Error fetching history" });
  }
});

// --- START SERVER ---
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});