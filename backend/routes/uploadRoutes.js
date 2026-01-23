// backend/routes/uploadRoutes.js

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

/* ================================
   ENSURE UPLOAD FOLDERS EXIST
================================ */
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const IMAGE_DIR = path.join(__dirname, "../uploads/images");
const VIDEO_DIR = path.join(__dirname, "../uploads/videos");

// Create folders at runtime (PERMANENT FIX)
ensureDir(IMAGE_DIR);
ensureDir(VIDEO_DIR);

/* ================================
   CONSTANTS
================================ */
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "video/mp4",
  "video/webm"
];

/* ================================
   FILE FILTER
================================ */
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

/* ================================
   IMAGE STORAGE
================================ */
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGE_DIR);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "_" + safeName);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: MAX_SIZE },
  fileFilter
});

/* ================================
   VIDEO STORAGE
================================ */
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEO_DIR);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "_" + safeName);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: MAX_SIZE },
  fileFilter
});

/* ================================
   ROUTES
================================ */

// Upload Image
router.post("/image", (req, res) => {
  imageUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded"
      });
    }

    res.json({
      success: true,
      fileName: req.file.filename,
      fileUrl: `http://localhost:5000/uploads/images/${req.file.filename}`
    });
  });
});

// Upload Video
router.post("/video", (req, res) => {
  videoUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No video uploaded"
      });
    }

    res.json({
      success: true,
      fileName: req.file.filename,
      fileUrl: `http://localhost:5000/uploads/videos/${req.file.filename}`
    });
  });
});

module.exports = router;
