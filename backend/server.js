import express from "express";
import multer from "multer";
import path from "path";
import cors from "cors";
import fs from "fs";
import { exec } from "child_process";   // ✅ import exec

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Ensure "data" folder exists
const dataFolder = path.join(process.cwd(), "data");
if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder, { recursive: true });
  console.log("Created data folder at:", dataFolder);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dataFolder);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // keep original filename
  },
});

const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  console.log("File received:", req.file);

  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  // ✅ Run cleaning2.py after saving file
  const pythonScript = path.join(process.cwd(), "cleaning2.py");

  exec(`python "${pythonScript}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error running cleaning2.py: ${error.message}`);
      return res.status(500).json({ message: "File uploaded, but ETL failed." });
    }
    if (stderr) console.error(`⚠ Python stderr: ${stderr}`);

    console.log(`📜 Python output:\n${stdout}`);
    res.json({
      message: "✅ File uploaded and processed successfully",
      filename: req.file.filename,
    });
  });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
