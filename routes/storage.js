const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const router = express.Router();
const User = require("../models/User");

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer configuration
const storage = multer.memoryStorage(); // Use memory storage
const upload = multer({ storage: storage });

async function saveImageUrlToDb(username, imageUrl) {
  // Find the user by username
  const user = await User.findOne({ username: username });

  if (!user) {
    throw new Error("User not found");
  }

  // Update the user's image URL
  user.profilePicture = imageUrl;

  // Save the user
  await user.save();

  return user;
}

router.post("/upload", upload.single("userImage"), async (req, res) => {
  try {
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: `fut-card-profile-pics/${req.body.username}`,
            background_removal: "cloudinary_ai",
            notification_url:
              "https://fut-server.onrender.com/api/users/cloudinary-webhook/" +
              req.body.userId,
            transformation: [
              { height: 700, crop: "fit" },
              { gravity: "auto:face", height: 700, width: 500, crop: "crop" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(req.file.buffer);
    });

    const imageUrl = result.secure_url;

    const updatedUser = await saveImageUrlToDb(req.body.username, imageUrl);
    res.json({ message: "Image uploaded successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to upload image", details: error.message });
  }
});

module.exports = router;
