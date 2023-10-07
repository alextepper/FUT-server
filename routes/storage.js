const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const router = express.Router();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer configuration
const storage = multer.memoryStorage(); // Use memory storage
const upload = multer({ storage: storage });

router.post("/upload", upload.single("userImage"), async (req, res) => {
  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader
      .upload_stream(
        {
          transformation: [
            { height: 350, crop: "fit" },
            { gravity: "auto:face", height: 350, width: 250, crop: "crop" },
          ],
        },
        (error, result) => {
          if (error) throw error;
          res.json(result);
        }
      )
      .end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: "Failed to upload image" });
  }
});

module.exports = router;
